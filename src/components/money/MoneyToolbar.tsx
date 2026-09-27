/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The end of a module page: the Download CSV / Share / Compare buttons,
// translated (v5: the "not an official website" line lives once in the
// district shell's verification panel). Share
// uses the phone's share sheet when there is one, otherwise it copies the
// link and says so for two seconds.
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Check, Download, Share2 } from "lucide-react";
import { Toolbar, ToolbarButton } from "@/components/district/ui";

export default function MoneyToolbar({
  shareTitle,
  compareHref,
  onCsv,
  csvDisabled,
}: {
  /** Title handed to the phone's share sheet (translated). */
  shareTitle: string;
  compareHref?: string;
  onCsv?: () => void;
  csvDisabled?: boolean;
}) {
  const t = useTranslations("page_money");
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* The visitor closed the share sheet — nothing to do. */
    }
  };

  return (
    <Toolbar label={t("actions.label")}>
      {onCsv && (
        <ToolbarButton icon={Download} onClick={onCsv} disabled={csvDisabled}>
          {t("actions.csv")}
        </ToolbarButton>
      )}
      <ToolbarButton icon={copied ? Check : Share2} onClick={onShare} ariaLabel={t("actions.shareAria")}>
        {copied ? t("actions.copied") : t("actions.share")}
      </ToolbarButton>
      {compareHref && (
        <ToolbarButton icon={ArrowLeftRight} href={compareHref}>
          {t("actions.compare")}
        </ToolbarButton>
      )}
    </Toolbar>
  );
}

/** Turn rows into a CSV file and start a download in the browser. */
export function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
