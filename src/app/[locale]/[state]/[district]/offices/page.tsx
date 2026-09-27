/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Government Offices — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useOffices() → the district office directory (active rows only).
//  Search box + department Chips filter the list on the client.
//  "Open now" is a simple weekday-hours rule (isOpenNow below); it is
//  unchanged from the previous design.
"use client";
import { use, useState } from "react";
import { Building, Phone, Mail, Globe, MapPin, Clock, Search } from "lucide-react";
import { useOffices } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  Chips,
  Pill,
  StatTile,
  StatStrip,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleSources } from "@/lib/constants/state-config";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

function isOpenNow() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
}

/** Contact link (tel / mailto / website) with a 32 px tap height. */
function ContactLink({ href, icon: Icon, children, external }: { href: string; icon: typeof Phone; children: React.ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 32, fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none" }}
    >
      <Icon size={12} aria-hidden /> {children}
    </a>
  );
}

function OfficesPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useOffices(district, state);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const offices = (data?.data ?? []).filter((o) => o.active);
  const departments = Array.from(new Set(offices.map((o) => o.department)));
  const openNow = isOpenNow();
  const refresh = `Directory updates: ${getModuleSources("offices", state).frequency.toLowerCase()}`;

  const filtered = offices.filter((o) => {
    const matchesDept = filter === "all" || o.department === filter;
    const matchesSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.department.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <ModulePage>
      <PageHeader
        icon={Building}
        title="Government Offices"
        description="Directory of government offices — addresses, contacts, and services"
        backHref={base}
        accent={getModuleAccent("offices")}
      />

      <AIInsightCard module="offices" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && offices.length === 0 && <NoDataCard module="offices" district={district} state={state} />}

      {!isLoading && offices.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile label="Offices" value={offices.length} icon={Building} sub={refresh} />
            <StatTile label="Departments" value={departments.length} sub={refresh} />
            <StatTile label="Status" value={openNow ? "Open Now" : "Closed"} icon={Clock} sub="Mon–Fri office hours" />
          </StatStrip>

          {/* Office hours line — plain text, no tinted box. */}
          <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: "16px 0 0" }}>
            <Clock size={14} aria-hidden style={{ color: openNow ? "var(--ftp-live)" : "var(--ftp-text-2)", flexShrink: 0 }} />
            <span suppressHydrationWarning>
              {openNow ? "Offices are open now (Mon–Fri, 10:00 AM – 5:30 PM)" : "Offices are currently closed. Open Mon–Fri, 10:00 AM – 5:30 PM"}
            </span>
          </p>

          <Section title="Office directory">
            {/* Search + department filter. */}
            <label style={{ position: "relative", display: "block", marginBottom: 12 }}>
              <span className="sr-only">Search offices</span>
              <Search size={16} aria-hidden style={{ position: "absolute", left: 12, top: 14, color: "var(--ftp-text-2)" }} />
              <input
                type="search"
                placeholder="Search offices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  padding: "10px 14px 10px 36px",
                  borderRadius: "var(--ftp-radius-tile)",
                  border: "1px solid var(--ftp-border)",
                  background: "var(--ftp-surface)",
                  color: "var(--ftp-text)",
                  fontFamily: "var(--ftp-font-sans)",
                  fontSize: 15,
                  boxSizing: "border-box",
                }}
              />
            </label>
            <div style={{ marginBottom: 12 }}>
              <Chips
                label="Department"
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "all", label: "All", count: offices.length },
                  ...departments.map((d) => ({ value: d, label: d, count: offices.filter((o) => o.department === d).length })),
                ]}
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState title="No offices match your search." body="Try a different name or department." />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {filtered.map((o) => (
                  <Card key={o.id} as="article">
                    <h3 className="ftp-title">{o.name}</h3>
                    {o.nameLocal && <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{o.nameLocal}</div>}
                    <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>{o.department} · {o.type}</div>

                    {o.headName && (
                      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", marginTop: 8 }}>
                        Head: {o.headName}
                        {o.headDesignation && <span style={{ color: "var(--ftp-text-2)" }}> ({o.headDesignation})</span>}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                      <MapPin size={12} aria-hidden style={{ flexShrink: 0, marginTop: 4 }} />
                      <span>{o.address}</span>
                    </div>

                    {(o.phone || o.email || o.website) && (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                        {o.phone && <ContactLink href={`tel:${o.phone}`} icon={Phone}><span className="ftp-num">{o.phone}</span></ContactLink>}
                        {o.email && <ContactLink href={`mailto:${o.email}`} icon={Mail}>{o.email.split("@")[0]}</ContactLink>}
                        {o.website && <ContactLink href={o.website} icon={Globe} external>Website</ContactLink>}
                      </div>
                    )}

                    {o.services.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div className="ftp-label" style={{ marginBottom: 4 }}>Services</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                          {o.services.slice(0, 4).map((s, i) => <Pill key={i}>{s}</Pill>)}
                          {o.services.length > 4 && (
                            <span style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>+{o.services.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      <ModuleSources module="offices" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="offices" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="offices"
        moduleLabel="Government Offices"
        shareText={`Government offices in ${district}: ${offices.length} offices across ${departments.length} departments`}
      />
    </ModulePage>
  );
}

export default function OfficesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Government Offices">
      <OfficesPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
