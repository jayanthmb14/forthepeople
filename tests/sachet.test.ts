/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// NDMA SACHET parsers and district matching (src/scraper/lib/sachet.ts).
// The CAP message is a real one from 27 Sep 2026 (CWC flood warning
// published by the Uttar Pradesh SDMA), shortened.
import { describe, expect, it } from "vitest";
import {
  SACHET_CAP_URL,
  capAlertType,
  capSeverity,
  englishInfo,
  isLiveAlert,
  localInfo,
  matchAlertToDistrict,
  needsPolygon,
  parseCapAlert,
  parsePolygons,
  parseSachetRss,
  pointInPolygon,
  type DistrictForMatch,
} from "@/scraper/lib/sachet";
import { alertDistrictNames } from "@/scraper/lib/district-aliases";

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <item>
    <title>River Ganga at Haridwar in Haridwar district of Uttarakhand  continues to flow in above normal flood situation.</title>
    <category>Met</category>
    <link>https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=1790520009482009</link>
    <author>controlroom@ndma.gov.in (CWC)</author>
    <guid isPermaLink="false">1790520009482009</guid>
    <pubDate>Sun, 27 Sep 2026 14:42:25 GMT</pubDate>
  </item>
  <item><title>bad</title><guid>../etc</guid></item>
</channel></rss>`;

const CAP = (opts: { district?: string; state?: string; sender?: string; expires?: string; msgType?: string; english?: boolean } = {}) => {
  const district = opts.district ?? "Kushinagar";
  const state = opts.state ?? "Uttar Pradesh";
  const en = `<cap:info>
<cap:language>en-IN</cap:language><cap:category>Met</cap:category><cap:event>Flood</cap:event>
<cap:urgency>Expected</cap:urgency><cap:severity>Severe</cap:severity><cap:certainty>Observed</cap:certainty>
<cap:effective>2026-09-27T15:00:00+05:30</cap:effective><cap:onset>2026-09-27T15:54:02+05:30</cap:onset>
<cap:expires>${opts.expires ?? "2026-09-27T22:00:00+05:30"}</cap:expires>
<cap:headline>River Gandak at Khadda in ${district} district of ${state} continues to flow in severe flood situation at 3:00 pm today.</cap:headline>
<cap:description>It was flowing at a level of 96 m, 0.00 m above its Danger Level.</cap:description>
<cap:instruction/>
<cap:parameter><cap:valueName>Polygon URL</cap:valueName><cap:value>https://sachet.ndma.gov.in/cap_public_website/FetchPolygonXMLFile?identifier=1790504518957013</cap:value></cap:parameter>
<cap:area><cap:areaDesc>Gandak, Khadda, ${district}, ${state}</cap:areaDesc></cap:area>
</cap:info>`;
  const hi = `<cap:info>
<cap:language>HI</cap:language><cap:category>Met</cap:category><cap:event>Flood</cap:event><cap:severity>Severe</cap:severity>
<cap:expires>${opts.expires ?? "2026-09-27T22:00:00+05:30"}</cap:expires>
<cap:headline>गंडक नदी आज दोपहर 3:00 बजे भी गंभीर बाढ़ की स्थिति में बह रही है।</cap:headline>
<cap:description>It was flowing at a level of 96 m, 0.00 m above its Danger Level.</cap:description>
<cap:area><cap:areaDesc>क्षेत्र</cap:areaDesc></cap:area>
</cap:info>`;
  return `<cap:alert xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">
<cap:identifier>IN-1790504518957013_13</cap:identifier>
<cap:sender>${opts.sender ?? "Uttar-Pradesh-SDMA"}</cap:sender>
<cap:sent>2026-09-27T15:54:02+05:30</cap:sent>
<cap:status>Actual</cap:status>
<cap:msgType>${opts.msgType ?? "Update"}</cap:msgType>
${opts.english === false ? "" : en}
${hi}
</cap:alert>`;
};

const NOW = Date.parse("2026-09-27T18:00:00+05:30");
const district = (slug: string, name: string, stateName: string, hq?: { lat: number; lng: number }): DistrictForMatch => ({
  slug,
  stateName,
  names: alertDistrictNames(slug, name),
  hq: hq ?? null,
});

describe("parseSachetRss", () => {
  it("reads items and skips ones with an unsafe guid", () => {
    const items = parseSachetRss(RSS);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ guid: "1790520009482009", office: "CWC", category: "Met" });
    expect(items[0].pubDate?.toISOString()).toBe("2026-09-27T14:42:25.000Z");
    expect(SACHET_CAP_URL(items[0].guid)).toBe(items[0].link);
  });
});

describe("parseCapAlert", () => {
  it("reads the message and both language blocks", () => {
    const cap = parseCapAlert(CAP())!;
    expect(cap.sender).toBe("Uttar-Pradesh-SDMA");
    expect(cap.infos).toHaveLength(2);
    const en = englishInfo(cap)!;
    expect(en.event).toBe("Flood");
    expect(en.severity).toBe("Severe");
    expect(en.expires?.toISOString()).toBe("2026-09-27T16:30:00.000Z");
    expect(en.areaDescs).toEqual(["Gandak, Khadda, Kushinagar, Uttar Pradesh"]);
    expect(en.polygonUrl).toMatch(/^https:\/\/sachet\.ndma\.gov\.in\//);
    expect(localInfo(cap)?.language).toBe("HI");
  });

  it("returns null for something that is not a CAP alert", () => {
    expect(parseCapAlert("Error Code: 403")).toBeNull();
  });
});

describe("isLiveAlert", () => {
  it("drops expired, cancelled and non-actual messages", () => {
    const live = parseCapAlert(CAP())!;
    expect(isLiveAlert(live, englishInfo(live), NOW)).toBe(true);
    const expired = parseCapAlert(CAP({ expires: "2026-09-27T12:00:00+05:30" }))!;
    expect(isLiveAlert(expired, englishInfo(expired), NOW)).toBe(false);
    const cancelled = parseCapAlert(CAP({ msgType: "Cancel" }))!;
    expect(isLiveAlert(cancelled, englishInfo(cancelled), NOW)).toBe(false);
  });
});

describe("capSeverity / capAlertType", () => {
  it("maps CAP words to the alerts page's words", () => {
    expect(capSeverity("Extreme")).toBe("critical");
    expect(capSeverity("Severe")).toBe("high");
    expect(capSeverity("Moderate")).toBe("medium");
    expect(capSeverity("Minor")).toBe("low");
    expect(capSeverity(null)).toBe("info");
    expect(capAlertType("Flood")).toBe("flood");
    expect(capAlertType("Thunderstorm with Lightning")).toBe("thunderstorm");
    expect(capAlertType("Heavy Rain")).toBe("heavy_rain");
    expect(capAlertType("Moderate Rain", "Met")).toBe("weather");
    expect(capAlertType("Heat Wave")).toBe("heat_wave");
    expect(capAlertType("Squally", "Met")).toBe("thunderstorm");
  });
});

describe("matchAlertToDistrict", () => {
  const lucknow = district("lucknow", "Lucknow", "Uttar Pradesh");

  it("matches a district named in the alert of its own state", () => {
    const cap = parseCapAlert(CAP({ district: "Lucknow" }))!;
    expect(matchAlertToDistrict(cap, lucknow)).toBe("name");
  });

  it("does not match other districts, or the same name in another state", () => {
    expect(matchAlertToDistrict(parseCapAlert(CAP())!, lucknow)).toBeNull();
    const hyderabad = district("hyderabad", "Hyderabad", "Telangana");
    const elsewhere = parseCapAlert(CAP({ district: "Hyderabad", state: "Sindh", sender: "Other-SDMA" }))!;
    expect(matchAlertToDistrict(elsewhere, hyderabad)).toBeNull();
    const telangana = parseCapAlert(CAP({ district: "Hyderabad", state: "Telangana", sender: "Telangana-SDMA" }))!;
    expect(matchAlertToDistrict(telangana, hyderabad)).toBe("name");
  });

  it("ignores the 'Mantralaya, Mumbai' signature", () => {
    const mumbai = district("mumbai", "Mumbai", "Maharashtra");
    const cap = parseCapAlert(
      CAP({ district: "Satara", state: "Maharashtra", sender: "Maharashtra-SDMA" }).replace(
        "at 3:00 pm today.</cap:headline>",
        "at 3:00 pm today. Mantralaya, Mumbai.</cap:headline>",
      ),
    )!;
    expect(matchAlertToDistrict(cap, mumbai)).toBeNull();
  });

  it("uses the polygon only when the alert has no English text", () => {
    const hq = { lat: 26.847, lng: 80.946 };
    const square: Array<[number, number]> = [
      [26.5, 80.5],
      [26.5, 81.5],
      [27.2, 81.5],
      [27.2, 80.5],
    ];
    const withHq = district("lucknow", "Lucknow", "Uttar Pradesh", hq);
    const hindiOnly = parseCapAlert(CAP({ english: false }))!;
    expect(needsPolygon(hindiOnly)).toBe(true);
    expect(matchAlertToDistrict(hindiOnly, withHq, [square])).toBe("polygon");
    const english = parseCapAlert(CAP())!;
    expect(needsPolygon(english)).toBe(false);
    expect(matchAlertToDistrict(english, withHq, [square])).toBeNull();
  });
});

describe("parsePolygons / pointInPolygon", () => {
  it("reads lat,lng rings and tests points", () => {
    const polys = parsePolygons("<alert><polygon>12.0,76.0 12.0,77.0 13.0,77.0 13.0,76.0 bad,pair</polygon><polygon>1,1</polygon></alert>");
    expect(polys).toHaveLength(1);
    expect(polys[0]).toHaveLength(4);
    expect(pointInPolygon(12.524, 76.897, polys[0])).toBe(true); // Mandya
    expect(pointInPolygon(12.972, 77.595, polys[0])).toBe(false); // Bengaluru
  });
});
