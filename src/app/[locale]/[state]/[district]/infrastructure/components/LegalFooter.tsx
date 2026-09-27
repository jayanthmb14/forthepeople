/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — legal notice at the bottom of the page.
 * Design v3: a plain Card with body text; legal copy unchanged.
 */

import { Card } from "@/components/district/ui";

const STRONG: React.CSSProperties = { fontWeight: 500, color: "var(--ftp-text)" };
const PARA: React.CSSProperties = { color: "var(--ftp-text-2)", marginTop: 12 };

export default function LegalFooter() {
  return (
    <div role="note" style={{ marginTop: 32 }}>
      <Card>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
          <span style={STRONG}>Legal notice:</span>{" "}
          Infrastructure project data on ForThePeople.in is compiled from publicly available news articles and government
          press releases under <span style={{ color: "var(--ftp-text)" }}>Article 19(1)(a)</span> of the Indian Constitution
          (Right to Freedom of Speech and Expression) and India&apos;s{" "}
          <span style={{ color: "var(--ftp-text)" }}>National Data Sharing and Accessibility Policy (NDSAP)</span>.
        </p>
        <p className="ftp-body" style={PARA}>
          Person and party attribution reflects public announcements as reported in news media at the time of the
          project&apos;s announcement and does not constitute an assessment of performance, responsibility, or current
          political affiliation. Political party affiliations shown may not reflect current affiliations due to party
          changes or restructuring. Display of political affiliations is for citizen transparency and does not constitute
          endorsement or opposition to any political party.
        </p>
        <p className="ftp-body" style={PARA}>
          Project status classifications (Proposed, Under Construction, Delayed, Stalled, Completed, Cancelled) and
          progress percentages are derived from news reports and seed data, and may not reflect official status or current
          progress. Budget figures are as reported in news media and may differ from official government records.
        </p>
        <p className="ftp-body" style={PARA}>
          Government agency names shown may have changed due to administrative restructuring since the data was last updated.
        </p>
        <p className="ftp-body" style={PARA}>
          News headlines are displayed under fair dealing provisions of the{" "}
          <span style={{ color: "var(--ftp-text)" }}>Indian Copyright Act, 1957 §52(1)(a)(ii)</span> for reporting current events
          and public interest.
        </p>
        <p className="ftp-body" style={PARA}>
          For verified project information, contact the relevant executing agency directly. ForThePeople.in is an
          independent citizen transparency initiative and is not affiliated with, endorsed by, or opposed to any
          government body, political party, or executing agency.
        </p>
      </Card>
    </div>
  );
}
