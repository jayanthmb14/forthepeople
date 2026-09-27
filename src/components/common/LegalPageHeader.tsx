/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Header for the legal pages (Privacy, Disclaimer): back link, the page's
// one <h1>, and the "Last updated" date. Design v3: token colours, v3 type
// scale (.ftp-h1), Lucide arrow, 44 px back-link target.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  lastUpdated: string;
  backHref?: string;
};

export default function LegalPageHeader({ title, lastUpdated, backHref = "/" }: Props) {
  return (
    <header style={{ marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid var(--ftp-border)" }}>
      <Link
        href={backHref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          minHeight: 44,
          fontSize: 13,
          color: "var(--ftp-text-2)",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={14} aria-hidden /> Back to ForThePeople.in
      </Link>
      <h1 className="ftp-h1" style={{ marginTop: 4 }}>{title}</h1>
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 6 }}>
        Last updated: {lastUpdated}
      </p>
    </header>
  );
}
