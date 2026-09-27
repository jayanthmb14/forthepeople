"use client";

/**
 * ForThePeople.in — Unified admin sidebar
 * Replaces the old black top-bar + sub-tab row.
 * Active item is detected from pathname + ?tab= query param.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Bell,
  Bot,
  FileCheck2,
  Wallet,
  Receipt,
  BarChart3,
  ShieldCheck,
  MessageSquare,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  TrendingDown,
  Globe,
  KeyRound,
  Pencil,
  History,
  Heart,
  Megaphone,
  Users,
  Lightbulb,
  Flame,
  Inbox,
} from "lucide-react";
import ModuleHelp from "./ModuleHelp";
import { logoutAction } from "@/app/[locale]/admin/actions";

type ItemId =
  | "dashboard"
  | "system-health"
  | "alerts"
  | "ai-settings"
  | "review"
  | "news-queue"
  | "population-audit"
  | "revenue"
  | "contributors-flagged"
  | "expenditure"
  | "costs"
  | "analytics"
  | "traffic"
  | "security"
  | "vault"
  | "content-editor"
  | "update-log"
  | "support-page"
  | "announcement"
  | "feedback"
  | "suggestions"
  | "responsibility";

interface NavItem {
  id: ItemId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  /** Href used for navigation. Tabs inside /admin use ?tab=; others are full routes. */
  buildHref: (locale: string) => string;
  /** True if this item should show on /admin with a ?tab= query param */
  inPageTab: boolean;
  /** Segment (first path segment after /admin) for active-detection of full-route items */
  routeSegment?: string;
  help: string;
  badgeKey?: "unreadAlerts" | "pendingReviews" | "unreadFeedback";
}

interface Group {
  header: string;
  items: NavItem[];
}

const GROUPS: Group[] = [
  {
    header: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        buildHref: (locale) => `/${locale}/admin?tab=dashboard`,
        inPageTab: true,
        help: "Overview of platform health, revenue, and pending actions",
      },
    ],
  },
  {
    header: "Operations",
    items: [
      {
        id: "system-health",
        label: "System Health",
        icon: Activity,
        buildHref: (locale) => `/${locale}/admin?tab=system-health`,
        inPageTab: true,
        help: "Monitor database, cache, scrapers, and data freshness",
      },
      {
        id: "alerts",
        label: "Alerts & Logs",
        icon: Bell,
        buildHref: (locale) => `/${locale}/admin?tab=alerts`,
        inPageTab: true,
        help: "Notifications for scraper failures, payments, and feedback",
        badgeKey: "unreadAlerts",
      },
      {
        id: "content-editor",
        label: "Content Editor",
        icon: Pencil,
        buildHref: (locale) => `/${locale}/admin?tab=content-editor`,
        inPageTab: true,
        help: "Inline edit seeded district data (leaders, schemes, offices, etc.)",
      },
      {
        id: "update-log",
        label: "Update Log",
        icon: History,
        buildHref: (locale) => `/${locale}/admin?tab=update-log`,
        inPageTab: true,
        help: "Every data change with before/after values — filterable by source/module",
      },
      {
        id: "support-page",
        label: "Support Page",
        icon: Heart,
        buildHref: (locale) => `/${locale}/admin?tab=support-page`,
        inPageTab: true,
        help: "Edit the /support page bio, photo, cost breakdown, and help links",
      },
      {
        id: "announcement",
        label: "Site Announcement",
        icon: Megaphone,
        buildHref: (locale) => `/${locale}/admin?tab=announcement`,
        inPageTab: true,
        help: "Sitewide modal/banner shown on first page load — toggle, edit, schedule auto-hide",
      },
    ],
  },
  {
    header: "AI & Data",
    items: [
      {
        id: "ai-settings",
        label: "AI Settings",
        icon: Bot,
        buildHref: (locale) => `/${locale}/admin/ai-settings`,
        inPageTab: false,
        routeSegment: "ai-settings",
        help: "Configure AI provider, model routing, and test connections",
      },
      {
        id: "review",
        label: "Review Queue",
        icon: FileCheck2,
        buildHref: (locale) => `/${locale}/admin/review`,
        inPageTab: false,
        routeSegment: "review",
        help: "Approve or reject AI-generated insights before they go live",
        badgeKey: "pendingReviews",
      },
      {
        id: "news-queue",
        label: "News & Check Queue",
        icon: Inbox,
        buildHref: (locale) => `/${locale}/admin/news-queue`,
        inPageTab: false,
        routeSegment: "news-queue",
        help: "Items waiting for a decision: data changes found in news, and disagreements raised by the daily data check (verify-*). Read-only list by type.",
      },
      {
        id: "population-audit",
        label: "Population Audit",
        icon: Users,
        buildHref: (locale) => `/${locale}/admin/population`,
        inPageTab: false,
        routeSegment: "population",
        help: "Per-district demographic profile completeness grid (Census, NFHS-5, MPI)",
      },
    ],
  },
  {
    header: "Finance",
    items: [
      {
        id: "revenue",
        label: "Revenue & Supporters",
        icon: Wallet,
        buildHref: (locale) => `/${locale}/admin/supporters`,
        inPageTab: false,
        routeSegment: "supporters",
        help: "Track contributions, add manual supporters, sync Razorpay",
      },
      {
        id: "contributors-flagged",
        label: "Flagged Names",
        icon: ShieldCheck,
        buildHref: (locale) => `/${locale}/admin/contributors-flagged`,
        inPageTab: false,
        routeSegment: "contributors-flagged",
        help: "Review supporters whose names were auto-flagged as spam or promotional",
      },
      {
        id: "expenditure",
        label: "Expenditure",
        icon: TrendingDown,
        buildHref: (locale) => `/${locale}/admin?tab=expenditure`,
        inPageTab: true,
        help: "Log one-time and recurring expenses, attach invoices, view monthly P&L",
      },
      {
        id: "costs",
        label: "Costs & Billing",
        icon: Receipt,
        buildHref: (locale) => `/${locale}/admin?tab=costs`,
        inPageTab: true,
        help: "Service subscriptions with expiry countdowns + real OpenRouter credit spend",
      },
    ],
  },
  {
    header: "Analytics",
    items: [
      {
        id: "analytics",
        label: "Analytics",
        icon: BarChart3,
        buildHref: (locale) => `/${locale}/admin?tab=analytics`,
        inPageTab: true,
        help: "District requests, feature votes, and engagement trends",
      },
      {
        id: "traffic",
        label: "Traffic",
        icon: Globe,
        buildHref: (locale) => `/${locale}/admin?tab=traffic`,
        inPageTab: true,
        help: "Live visitors, top pages, referrers, and device breakdown (Plausible)",
      },
    ],
  },
  {
    header: "Security",
    items: [
      {
        id: "security",
        label: "Access & 2FA",
        icon: ShieldCheck,
        buildHref: (locale) => `/${locale}/admin/security`,
        inPageTab: false,
        routeSegment: "security",
        help: "Session info, 2FA setup, backup codes, team members, audit log",
      },
      {
        id: "vault",
        label: "API Vault",
        icon: KeyRound,
        buildHref: (locale) => `/${locale}/admin?tab=vault`,
        inPageTab: true,
        help: "Encrypted API key storage with a separate 2FA gate (10-min session)",
      },
    ],
  },
  {
    header: "Community",
    items: [
      {
        id: "feedback",
        label: "Feedback",
        icon: MessageSquare,
        buildHref: (locale) => `/${locale}/admin/feedback`,
        inPageTab: false,
        routeSegment: "feedback",
        help: "Read and respond to user feedback with AI classification",
        badgeKey: "unreadFeedback",
      },
      {
        id: "suggestions",
        label: "Suggestions",
        icon: Lightbulb,
        buildHref: (locale) => `/${locale}/admin/suggestions`,
        inPageTab: false,
        routeSegment: "suggestions",
        help: "Review citizen-submitted ideas: accept, reject, mark as spam, or track as implemented",
      },
      {
        id: "responsibility",
        label: "Responsibility",
        icon: Flame,
        buildHref: (locale) => `/${locale}/admin/responsibility`,
        inPageTab: false,
        routeSegment: "responsibility",
        help: "Per-district civic responsibility items. Verify unverified phones before they go public.",
      },
    ],
  },
];

interface NavCounts {
  unreadAlerts: number;
  pendingReviews: number;
  unreadFeedback: number;
}

export default function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState<NavCounts>({
    unreadAlerts: 0,
    pendingReviews: 0,
    unreadFeedback: 0,
  });

  const fetchCounts = useCallback(() => {
    fetch("/api/admin/nav-counts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: NavCounts | null) => {
        if (d) setCounts(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60_000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Close mobile drawer when route/tab changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname, searchParams]);

  const activeItemId = resolveActiveItem(pathname, searchParams?.get("tab") ?? null, locale);

  return (
    <>
      {/* Mobile top bar (visible < 1024px) */}
      <div className="admin-mobile-bar">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          style={{
            background: "none",
            border: "none",
            padding: 6,
            cursor: "pointer",
            color: "#1A1A1A",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Menu size={20} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", flex: 1, textAlign: "center" }}>
          {labelForActive(activeItemId)}
        </span>
        <span style={{ width: 32 }} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}
        aria-label="Admin navigation"
      >
        <div className="admin-sidebar-inner">
          <div className="admin-sidebar-header">
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
              🛡️ ForThePeople Admin
            </span>
            <button
              type="button"
              className="admin-sidebar-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {GROUPS.map((group) => (
              <div key={group.header} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    padding: "6px 18px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#9B9B9B",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {group.header}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItemId === item.id;
                  const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0 10px",
                      }}
                    >
                      <Link
                        href={item.buildHref(locale)}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? "#1A1A1A" : "#4B4B4B",
                          background: isActive ? "#F0F0EC" : "transparent",
                          textDecoration: "none",
                          transition: "background 120ms",
                        }}
                      >
                        <Icon size={18} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {badgeCount > 0 && (
                          <span
                            style={{
                              background: "#DC2626",
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 10,
                              minWidth: 18,
                              textAlign: "center",
                              lineHeight: 1.2,
                            }}
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </Link>
                      <ModuleHelp text={item.help} size={13} placement="right" />
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>

          <div
            style={{
              borderTop: "1px solid #E8E8E4",
              padding: "10px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <Link
              href={`/${locale}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#6B6B6B",
                textDecoration: "none",
                padding: "4px 0",
              }}
            >
              <ArrowLeft size={14} /> Main Site
            </Link>
            <form action={logoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px 0",
                  fontSize: 12,
                  color: "#6B6B6B",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <LogOut size={14} /> Logout
              </button>
            </form>
          </div>
        </div>
      </aside>

      <style>{`
        .admin-mobile-bar {
          display: none;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #FFFFFF;
          border-bottom: 1px solid #E8E8E4;
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .admin-sidebar {
          width: 260px;
          min-height: 100vh;
          background: #FFFFFF;
          border-right: 1px solid #E8E8E4;
          position: sticky;
          top: 0;
          flex-shrink: 0;
        }
        .admin-sidebar-inner {
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
        }
        .admin-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid #F0F0EC;
        }
        .admin-sidebar-close {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #6B6B6B;
          padding: 4px;
        }
        .admin-mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          z-index: 40;
        }
        @media (max-width: 1023px) {
          .admin-mobile-bar { display: flex; }
          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 220ms ease;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .admin-sidebar.is-open {
            transform: translateX(0);
          }
          .admin-sidebar-close { display: inline-flex; }
          .admin-mobile-overlay { display: block; }
        }
      `}</style>
    </>
  );
}

function resolveActiveItem(
  pathname: string,
  tab: string | null,
  locale: string
): ItemId {
  const base = `/${locale}/admin`;
  // Full-route pages first
  if (pathname.startsWith(`${base}/ai-settings`)) return "ai-settings";
  if (pathname.startsWith(`${base}/review`)) return "review";
  if (pathname.startsWith(`${base}/news-queue`)) return "news-queue";
  if (pathname.startsWith(`${base}/population`)) return "population-audit";
  if (pathname.startsWith(`${base}/supporters`)) return "revenue";
  if (pathname.startsWith(`${base}/security`)) return "security";
  if (pathname.startsWith(`${base}/feedback`)) return "feedback";
  if (pathname.startsWith(`${base}/recover`)) return "security";

  // /admin root — distinguished by ?tab=
  if (tab === "system-health") return "system-health";
  if (tab === "alerts") return "alerts";
  if (tab === "analytics") return "analytics";
  if (tab === "costs") return "costs";
  if (tab === "expenditure") return "expenditure";
  if (tab === "traffic") return "traffic";
  if (tab === "vault") return "vault";
  if (tab === "content-editor") return "content-editor";
  if (tab === "update-log") return "update-log";
  return "dashboard";
}

function labelForActive(id: ItemId): string {
  for (const group of GROUPS) {
    for (const item of group.items) {
      if (item.id === id) return item.label;
    }
  }
  return "Admin";
}
