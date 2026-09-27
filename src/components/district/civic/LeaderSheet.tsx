/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  LeaderSheet — "tap a person, see everything about them"
// ═══════════════════════════════════════════════════════════════════════
//  Photo, name, the job in plain words ("What this person does"), level,
//  party, the area they represent, since when, office phone and email
//  when stored, how the record was checked (and when), and "In the news":
//  the latest 5 stories from the last 6 months that name them
//  (/api/data/leader-news). Call / Email / affidavit buttons at the bottom.
//
//  Honesty: contact rows appear only when stored; the news list says
//  plainly when nothing names the person; headlines keep their source and
//  date and open the original story.
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ExternalLink, FileText, Mail, Phone } from "lucide-react";
import type { Leader } from "@/hooks/useRealtimeData";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { LoadingShell } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";
import { hueClass } from "@/lib/design/hues";
import { getPartyColor } from "@/lib/constants/party-colors";
import { scriptLang } from "@/lib/utils/script-lang";
import type { LeaderNewsPayload } from "@/app/api/data/leader-news/route";
import { LeaderAvatar, isPlaceholderName, leaderProvenance, roleDescription, roleText, tierMeta } from "./leader-shared";

/** Affidavits of every candidate who stood for election (ECI). */
const AFFIDAVIT_URL = "https://affidavit.eci.gov.in/";

/** A big footer action: 44 px tall, filled for the main one. */
function SheetAction({
  href,
  icon: Icon,
  children,
  primary,
  external,
}: {
  href: string;
  icon: typeof Phone;
  children: React.ReactNode;
  primary?: boolean;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{
        flex: "1 1 140px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        borderRadius: 12,
        border: `1px solid ${primary ? "var(--hue)" : "var(--ftp-border)"}`,
        background: primary ? "var(--hue)" : "var(--ftp-surface)",
        color: primary ? "#fff" : "var(--ftp-text)",
        fontSize: 15,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      <Icon size={18} aria-hidden />
      {children}
    </a>
  );
}

export function LeaderSheet({
  leader,
  onClose,
  district,
  state,
}: {
  leader: Leader | null;
  onClose: () => void;
  district: string;
  state: string;
}) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  const open = leader !== null;
  const id = leader?.id ?? "";
  const { data, isLoading, isError } = useQuery<{ data: LeaderNewsPayload | null }>({
    queryKey: ["leader-news", district, id, f.locale],
    queryFn: () =>
      fetch(
        `/api/data/leader-news?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&id=${encodeURIComponent(id)}&locale=${f.locale}`,
      ).then((r) => r.json()),
    enabled: open && id.length > 0,
    staleTime: 10 * 60_000,
  });

  if (!leader) return null;
  const l = leader;
  const extra = data?.data ?? null;
  const fmtDate = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });
  const meta = tierMeta(l.tier, t);
  const role = roleText(l, f.locale, extra?.roleLocal);
  const nameLocal = l.nameLocal ?? extra?.nameLocal ?? null;
  const phone = l.phone ?? extra?.contact.phone ?? null;
  const email = l.email ?? extra?.contact.email ?? null;
  const placeholder = isPlaceholderName(l.name);
  const party = l.party?.trim() || null;
  // Officers (level 3) belong to no party; say so instead of leaving a gap.
  const partyValue = party ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: getPartyColor(party).border, flexShrink: 0 }} />
      {party}
    </span>
  ) : l.tier === 3 ? (
    t("sheet.noParty")
  ) : null;
  const news = extra?.news ?? [];
  const newsFailed = isError || (data !== undefined && !data.data);
  const subtitle = [role.text, l.constituency].filter(Boolean).join(" · ");

  const footer =
    phone || email || l.tier === 4 ? (
      <>
        {phone && (
          <SheetAction href={`tel:${phone.replace(/[^\d+]/g, "")}`} icon={Phone} primary>
            {t("sheet.call")}
          </SheetAction>
        )}
        {email && (
          <SheetAction href={`mailto:${email}`} icon={Mail} primary={!phone}>
            {t("sheet.email")}
          </SheetAction>
        )}
        {l.tier === 4 && (
          <SheetAction href={AFFIDAVIT_URL} icon={FileText} external primary={!phone && !email}>
            {t("sheet.affidavit")}
          </SheetAction>
        )}
      </>
    ) : undefined;

  return (
    <DetailSheet
      open={open}
      onClose={onClose}
      title={<span style={placeholder ? { fontStyle: "italic", color: "var(--ftp-text-2)" } : undefined}>{l.name}</span>}
      subtitle={<span lang={role.lang}>{subtitle}</span>}
      media={<LeaderAvatar name={l.name} photoUrl={l.photoUrl} size={56} />}
      hueClassName={hueClass("leadership")}
      footer={footer}
    >
      {/* The job in plain words, first. */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          background: "var(--hue-tint)",
          border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
        }}
      >
        <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, color: "var(--hue-deep)" }}>
          {t("sheet.whatTheyDo")}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 15, lineHeight: "23px", color: "var(--ftp-text)" }}>{roleDescription(l, t)}</p>
      </div>

      <DetailList
        rows={[
          { label: t("sheet.level"), value: meta.label },
          { label: t("sheet.role"), value: role.text, lang: role.lang },
          { label: t("sheet.localName"), value: nameLocal && nameLocal !== l.name ? nameLocal : null, lang: nameLocal ? scriptLang(nameLocal) : undefined },
          { label: t("sheet.party"), value: partyValue },
          { label: t("sheet.constituency"), value: l.constituency },
          { label: t("sheet.since"), value: l.since?.trim() || null },
          {
            label: t("sheet.phone"),
            value: phone ? (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                {phone}
              </a>
            ) : null,
          },
          {
            label: t("sheet.emailLabel"),
            value: email ? (
              <a href={`mailto:${email}`} style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                {email}
              </a>
            ) : null,
          },
          { label: t("sheet.checked"), value: leaderProvenance(l, t, fmtDate) },
        ]}
      />
      {!phone && !email && !isLoading && <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("sheet.noContact")}</p>}
      {party && <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("attribution")}</p>}
      {l.tier === 4 && <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("sheet.affidavitHint")}</p>}

      {/* In the news */}
      <section aria-labelledby={`leader-news-${l.id}`}>
        <h3 id={`leader-news-${l.id}`} className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 650, color: "var(--ftp-text)" }}>
          {t("sheet.newsTitle")}
        </h3>
        <p style={{ margin: "2px 0 10px", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
          {t("sheet.newsLead", { name: l.name })}
        </p>
        {isLoading && <LoadingShell rows={2} />}
        {!isLoading && news.length === 0 && (
          <p style={{ margin: 0, fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>
            {newsFailed ? t("sheet.newsError") : t("sheet.newsEmpty", { name: l.name })}
          </p>
        )}
        {news.length > 0 && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {news.map((n) => {
              const who = n.publisher?.trim() || n.source;
              const when = fmtDate(n.publishedAt);
              return (
                <li key={n.id}>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ftp-card-link"
                    aria-label={`${n.title}. ${t("sheet.openStory", { source: who, date: when })}`}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: "10px 12px",
                      minHeight: 44,
                      borderRadius: 12,
                      border: "1px solid var(--ftp-border)",
                      background: "var(--ftp-surface)",
                      textDecoration: "none",
                      color: "var(--ftp-text)",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span lang={n.lang} style={{ display: "block", fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>
                        {n.title}
                      </span>
                      <span style={{ display: "block", marginTop: 2, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                        {who} · <span className="ftp-num">{when}</span>
                      </span>
                    </span>
                    <ExternalLink size={14} aria-hidden style={{ flexShrink: 0, marginTop: 3, color: "var(--hue)" }} />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </DetailSheet>
  );
}
