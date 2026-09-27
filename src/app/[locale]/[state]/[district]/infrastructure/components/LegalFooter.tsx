/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — legal notice at the bottom of the page.
 * Extracted from infrastructure/page.tsx (no behaviour change).
 */



export default function LegalFooter() {
  return (
    <div
      role="note"
      style={{
        background: "#F9F9F7", border: "1px solid #E8E8E4", borderRadius: 8,
        padding: 16, marginTop: 32,
        fontSize: 12, color: "#4B5563", lineHeight: 1.6,
      }}
    >
      <strong style={{ color: "#1A1A1A" }}>Legal Notice:</strong>{" "}
      Infrastructure project data on ForThePeople.in is compiled from publicly available news articles and government
      press releases under <span style={{ color: "#1A1A1A" }}>Article 19(1)(a)</span> of the Indian Constitution
      (Right to Freedom of Speech and Expression) and India&apos;s{" "}
      <span style={{ color: "#1A1A1A" }}>National Data Sharing and Accessibility Policy (NDSAP)</span>.
      <br /><br />
      Person and party attribution reflects public announcements as reported in news media at the time of the
      project&apos;s announcement and does not constitute an assessment of performance, responsibility, or current
      political affiliation. Political party affiliations shown may not reflect current affiliations due to party
      changes or restructuring. Display of political affiliations is for citizen transparency and does not constitute
      endorsement or opposition to any political party.
      <br /><br />
      Project status classifications (Proposed, Under Construction, Delayed, Stalled, Completed, Cancelled) and
      progress percentages are derived from news reports and seed data, and may not reflect official status or current
      progress. Budget figures are as reported in news media and may differ from official government records.
      <br /><br />
      Government agency names shown may have changed due to administrative restructuring since the data was last updated.
      <br /><br />
      News headlines are displayed under fair dealing provisions of the{" "}
      <span style={{ color: "#1A1A1A" }}>Indian Copyright Act, 1957 §52(1)(a)(ii)</span> for reporting current events
      and public interest.
      <br /><br />
      For verified project information, contact the relevant executing agency directly. ForThePeople.in is an
      independent citizen transparency initiative and is not affiliated with, endorsed by, or opposed to any
      government body, political party, or executing agency.
    </div>
  );
}
