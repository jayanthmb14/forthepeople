/**
 * Rendered on /tenders pages when District.tendersActive === false.
 * Tells the visitor tenders for this district aren't tracked yet, and
 * lists currently-live districts so they can find coverage elsewhere.
 *
 * The sidebar still renders "Govt. Tenders" for every district (intentional
 * discoverability). This component is the gated entry-point content.
 *
 * The kit PageHeader (the page's one <h1>, module hue and emoji from the
 * registry) and a Section of districts that are tracked today. 44 px tap
 * targets. v5: no sponsor ask here — support lives in the site header
 * and footer only.
 * Words come from "page_tenders"; state names are translated, district
 * names are shown as the database has them.
 */

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader, Section } from "@/components/district/ui";
import { usePlaceText } from "@/i18n/client";

interface Props {
  locale: string;
  stateSlug: string;
  stateName: string;
  districtSlug: string;
  districtName: string;
}

interface LiveDistrict {
  districtSlug: string;
  districtName: string;
  stateSlug: string;
  stateName: string;
}

/** Primary call-to-action link (module-hue fill, 44 px tall). */

export default function TenderLockedState({
  locale,
  stateSlug,
  stateName,
  districtSlug,
  districtName,
}: Props) {
  const t = useTranslations("page_tenders");
  const place = usePlaceText();
  // Fetch other districts that DO have tenders active — this page is the
  // best discovery surface for "what's covered today".
  const { data: liveList } = useQuery<{ districts: LiveDistrict[] }>({
    queryKey: ["tenders-live-districts"],
    queryFn: () => fetch("/api/tenders/live-districts").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const liveElsewhere = (liveList?.districts ?? []).filter(
    (d) => d.districtSlug !== districtSlug,
  );
  const stateLabel = place.state(stateSlug, stateName);

  return (
    <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" }}>
      {/* Header: the module's own identity, the lock as its icon. */}
      <PageHeader
        icon={Lock}
        title={t("locked.title", { district: districtName })}
        description={t("locked.description", { state: stateLabel })}
      />

      {/* What's covered elsewhere */}
      {liveElsewhere.length > 0 && (
        <Section title={t("locked.tracked")}>
          <Card>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {liveElsewhere.map((d) => (
                <li key={d.districtSlug}>
                  <Link
                    href={`/${locale}/${d.stateSlug}/${d.districtSlug}/tenders`}
                    className="ftp-rail-item"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      minHeight: 44,
                      padding: "0 12px",
                      borderRadius: "var(--ftp-radius-tile)",
                      textDecoration: "none",
                      color: "var(--ftp-text)",
                      fontSize: 13,
                    }}
                  >
                    <span>
                      <span style={{ fontWeight: 600 }}>{d.districtName}</span>
                      <span style={{ color: "var(--ftp-text-2)", fontSize: 11, marginLeft: 8 }}>{place.state(d.stateSlug, d.stateName)}</span>
                    </span>
                    <ArrowRight size={14} aria-hidden style={{ color: "var(--hue)" }} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}
    </div>
  );
}
