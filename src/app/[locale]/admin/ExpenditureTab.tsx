"use client";

/**
 * ForThePeople.in — Expenditure tab
 * - Summary cards (total, this month, net P&L, recurring monthly)
 * - Add/edit/delete expenses
 * - List view + monthly P&L view
 * - CSV export
 * Invoice attachment is link-only for now (no Vercel Blob dependency).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import ModuleHelp from "@/components/admin/ModuleHelp";

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amountINR: number;
  amountUSD: number | null;
  exchangeRate: number | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  invoiceUrl: string | null;
  invoiceBlobUrl: string | null;
  isRecurring: boolean;
  recurringInterval: string | null;
  notes: string | null;
  createdAt: string;
}

interface FinanceSummary {
  revenue?: { total: number };
  expense: { total: number; thisMonth: number; recurringMonthly: number };
  pnl: { thisMonth: number; allTime: number };
  monthlyBreakdown: Array<{ month: string; revenue: number; expense: number; net: number }>;
}

const CATEGORIES = [
  { value: "hosting", label: "Hosting" },
  { value: "domain", label: "Domain" },
  { value: "ai_credits", label: "AI Credits" },
  { value: "development", label: "Development" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "legal", label: "Legal" },
  { value: "hardware", label: "Hardware" },
  { value: "travel", label: "Travel" },
  { value: "salary", label: "Salary" },
  { value: "other", label: "Other" },
];

const METHODS = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "crypto", label: "Crypto" },
  { value: "other", label: "Other" },
];

const RECURRING_OPTIONS = [
  { value: "", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const USD_TO_INR_DEFAULT = 84;

const EXPENDITURE_HELP =
  "Track all platform expenses. Add one-time or recurring costs. Paste invoice links (Drive, Dropbox, etc.). The P&L view compares revenue (from supporter contributions) against expenses per month. Download CSV for accounting and tax filing. Recurring expenses need one record per period — they are not auto-posted.";

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function monthLabel(m: string): string {
  const [y, mm] = m.split("-");
  const d = new Date(Number(y), Number(mm) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default function ExpenditureTab() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "pnl">("list");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterRecurring, setFilterRecurring] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/expenses").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/finance-summary").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([expRes, sumRes]) => {
        if (expRes) setExpenses(expRes.expenses ?? []);
        if (sumRes) setSummary(sumRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = expenses;
    if (filterCategory !== "all") list = list.filter((e) => e.category === filterCategory);
    if (filterRecurring === "recurring") list = list.filter((e) => e.isRecurring);
    if (filterRecurring === "one-time") list = list.filter((e) => !e.isRecurring);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.notes ?? "").toLowerCase().includes(q) ||
          (e.referenceNumber ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [expenses, filterCategory, filterRecurring, search]);

  const deleteExpense = async (id: string) => {
    if (!confirm("Permanently delete this expense? This cannot be undone.")) return;
    await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" }).catch(() => {});
    load();
  };

  const exportCsv = () => {
    const rows = [
      [
        "Date",
        "Category",
        "Description",
        "Amount INR",
        "Amount USD",
        "Exchange Rate",
        "Payment Method",
        "Reference",
        "Recurring",
        "Interval",
        "Invoice",
        "Notes",
      ],
      ...filtered.map((e) => [
        e.date,
        e.category,
        e.description,
        String(e.amountINR),
        e.amountUSD != null ? String(e.amountUSD) : "",
        e.exchangeRate != null ? String(e.exchangeRate) : "",
        e.paymentMethod ?? "",
        e.referenceNumber ?? "",
        e.isRecurring ? "Yes" : "No",
        e.recurringInterval ?? "",
        e.invoiceUrl ?? e.invoiceBlobUrl ?? "",
        e.notes ?? "",
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c).replace(/\n/g, " ").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ftp-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pnlThisMonth = summary?.pnl.thisMonth ?? 0;
  const pnlColor = pnlThisMonth >= 0 ? "#16A34A" : "#DC2626";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>
            Expenditure
          </h2>
          <ModuleHelp text={EXPENDITURE_HELP} size={14} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setView(view === "list" ? "pnl" : "list")}
            style={{
              padding: "6px 12px",
              background: "#fff",
              color: "#2563EB",
              border: "1px solid #DBEAFE",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {view === "list" ? "P&L View" : "List View"}
          </button>
          <button
            onClick={exportCsv}
            style={{
              padding: "6px 12px",
              background: "#fff",
              color: "#16A34A",
              border: "1px solid #BBF7D0",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Download size={12} /> CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: "6px 12px",
              background: "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Plus size={12} /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <SummaryCard
          label="Total Expense"
          value={`₹${(summary?.expense.total ?? 0).toLocaleString("en-IN")}`}
          sub="all time"
          color="#DC2626"
        />
        <SummaryCard
          label="This Month"
          value={`₹${(summary?.expense.thisMonth ?? 0).toLocaleString("en-IN")}`}
          sub={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          color="#D97706"
        />
        <SummaryCard
          label="Net P&L (month)"
          value={`${pnlThisMonth >= 0 ? "+" : "−"}₹${Math.abs(pnlThisMonth).toLocaleString("en-IN")}`}
          sub={pnlThisMonth >= 0 ? "profit" : "loss"}
          color={pnlColor}
        />
        <SummaryCard
          label="Recurring Monthly"
          value={`₹${(summary?.expense.recurringMonthly ?? 0).toLocaleString("en-IN")}`}
          sub={`${expenses.filter((e) => e.isRecurring).length} recurring entries`}
          color="#7C3AED"
        />
      </div>

      {view === "pnl" ? (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 10 }}>
            Monthly P&L (last 12 months)
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E8E4" }}>
                <th style={th}>Month</th>
                <th style={{ ...th, textAlign: "right" }}>Revenue</th>
                <th style={{ ...th, textAlign: "right" }}>Expenses</th>
                <th style={{ ...th, textAlign: "right" }}>Net</th>
                <th style={{ ...th, textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.monthlyBreakdown ?? []).map((m) => (
                <tr key={m.month} style={{ borderBottom: "1px solid #F5F5F0" }}>
                  <td style={{ padding: "6px 8px", color: "#1A1A1A", fontWeight: 500 }}>
                    {monthLabel(m.month)}
                  </td>
                  <td style={tdRight}>₹{m.revenue.toLocaleString("en-IN")}</td>
                  <td style={tdRight}>₹{m.expense.toLocaleString("en-IN")}</td>
                  <td
                    style={{
                      ...tdRight,
                      color: m.net >= 0 ? "#16A34A" : "#DC2626",
                    }}
                  >
                    {m.net >= 0 ? "+" : "−"}₹{Math.abs(m.net).toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: m.net >= 0 ? "#DCFCE7" : "#FEE2E2",
                        color: m.net >= 0 ? "#16A34A" : "#DC2626",
                      }}
                    >
                      {m.net > 0 ? "🟢 Profit" : m.net < 0 ? "🔴 Loss" : "— Flat"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={filterRecurring}
              onChange={(e) => setFilterRecurring(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All types</option>
              <option value="recurring">Recurring only</option>
              <option value="one-time">One-time only</option>
            </select>
            <input
              type="search"
              placeholder="Search description, notes, ref"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...selectStyle,
                minWidth: 220,
                padding: "6px 10px",
                background: "#fff",
                color: "#1A1A1A",
              }}
            />
            <span style={{ fontSize: 11, color: "#9B9B9B", marginLeft: "auto" }}>
              {filtered.length} of {expenses.length}
            </span>
          </div>

          {/* List */}
          <div style={card}>
            {loading ? (
              <div style={{ fontSize: 13, color: "#9B9B9B", textAlign: "center", padding: 16 }}>
                Loading expenses...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ fontSize: 13, color: "#9B9B9B", textAlign: "center", padding: 16 }}>
                No expenses recorded. Click &quot;Add Expense&quot; to start tracking.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E8E8E4" }}>
                      <th style={th}>Date</th>
                      <th style={th}>Category</th>
                      <th style={th}>Description</th>
                      <th style={{ ...th, textAlign: "right" }}>₹</th>
                      <th style={{ ...th, textAlign: "right" }}>$</th>
                      <th style={{ ...th, textAlign: "center" }}>Invoice</th>
                      <th style={{ ...th, textAlign: "center" }}>Recurring</th>
                      <th style={{ ...th, textAlign: "center" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id} style={{ borderBottom: "1px solid #F5F5F0" }}>
                        <td style={{ padding: "6px 8px", color: "#6B6B6B", whiteSpace: "nowrap" }}>
                          {fmtDate(e.date)}
                        </td>
                        <td style={{ padding: "6px 8px", color: "#6B6B6B" }}>{e.category}</td>
                        <td style={{ padding: "6px 8px", color: "#1A1A1A", fontWeight: 500 }}>
                          {e.description}
                          {e.referenceNumber && (
                            <div style={{ fontSize: 10, color: "#9B9B9B" }}>
                              ref: {e.referenceNumber}
                            </div>
                          )}
                        </td>
                        <td style={tdRight}>₹{e.amountINR.toLocaleString("en-IN")}</td>
                        <td style={tdRight}>
                          {e.amountUSD != null ? `$${e.amountUSD.toFixed(2)}` : "—"}
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                          {(e.invoiceUrl || e.invoiceBlobUrl) ? (
                            <a
                              href={e.invoiceUrl ?? e.invoiceBlobUrl ?? ""}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#2563EB", display: "inline-flex", alignItems: "center" }}
                              aria-label="Open invoice"
                            >
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ color: "#9B9B9B" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                          {e.isRecurring ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: 10,
                                fontWeight: 600,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "#EDE9FE",
                                color: "#7C3AED",
                              }}
                            >
                              <Repeat size={10} /> {e.recurringInterval ?? "monthly"}
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, color: "#9B9B9B" }}>One-time</span>
                          )}
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: 4 }}>
                            <button
                              onClick={() => setEditing(e)}
                              style={iconBtn}
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => deleteExpense(e.id)}
                              style={{ ...iconBtn, color: "#DC2626" }}
                              aria-label="Delete"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {summary && <TaxOverview summary={summary} expenses={expenses} />}

      {showAdd && (
        <ExpenseForm
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
      {editing && (
        <ExpenseForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function TaxOverview({ summary, expenses }: { summary: FinanceSummary; expenses: Expense[] }) {
  const [open, setOpen] = useState(false);

  // Indian FY: 1 April → 31 March. If today is before April 1, FY started last year.
  const today = new Date();
  const fyStart = new Date(
    today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1,
    3, // April (0-indexed)
    1
  );
  const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31); // 31 March next year
  const fyLabel = `FY ${fyStart.getFullYear()}-${String((fyStart.getFullYear() + 1) % 100).padStart(2, "0")}`;

  const fyExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d >= fyStart && d <= fyEnd;
  });
  const fyExpenseTotal = fyExpenses.reduce((s, e) => s + e.amountINR, 0);

  // Revenue for FY: pull from monthlyBreakdown by filtering months in the FY range.
  const fyRevenue = summary.monthlyBreakdown
    .filter((m) => {
      const [y, mm] = m.month.split("-").map(Number);
      const d = new Date(y, mm - 1, 1);
      return d >= fyStart && d <= fyEnd;
    })
    .reduce((s, m) => s + m.revenue, 0);

  // Tax-relevant groupings (order of typical ITR relevance)
  const byCategory = new Map<string, number>();
  for (const e of fyExpenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amountINR);
  }
  const deductibleCats = ["hosting", "domain", "ai_credits", "development", "design", "legal"];
  const deductible = deductibleCats
    .map((c) => ({ category: c, amount: byCategory.get(c) ?? 0 }))
    .filter((c) => c.amount > 0);

  return (
    <div style={card}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: "#1A1A1A",
        }}
      >
        📊 Tax Overview ({fyLabel})
        <span style={{ fontSize: 10, color: "#9B9B9B" }}>{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#1A1A1A", lineHeight: 1.7 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
            <SummaryBox label="Gross Revenue (FY)" value={`₹${fyRevenue.toLocaleString("en-IN")}`} color="#16A34A" />
            <SummaryBox label="Total Expenses (FY)" value={`₹${fyExpenseTotal.toLocaleString("en-IN")}`} color="#DC2626" />
            <SummaryBox
              label="Net Income (FY)"
              value={`${fyRevenue - fyExpenseTotal >= 0 ? "+" : "−"}₹${Math.abs(fyRevenue - fyExpenseTotal).toLocaleString("en-IN")}`}
              color={fyRevenue - fyExpenseTotal >= 0 ? "#16A34A" : "#DC2626"}
            />
          </div>
          {deductible.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 4 }}>
                Tax-relevant expenses (likely deductible — confirm with CA):
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {deductible.map((c) => (
                  <li key={c.category}>
                    <span style={{ textTransform: "capitalize" }}>{c.category.replace(/_/g, " ")}</span>:
                    ₹{c.amount.toLocaleString("en-IN")}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div
            style={{
              marginTop: 12,
              padding: 8,
              background: "#FEF3C7",
              border: "1px solid #FDE68A",
              borderRadius: 6,
              color: "#92400E",
              fontSize: 11,
            }}
          >
            ⚠️ Not financial advice. This summary is derived from admin records for reference only.
            Consult a Chartered Accountant for ITR filing and GST classification.
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#FAFAF8", padding: 8, borderRadius: 6 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#9B9B9B",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: "var(--font-mono, monospace)" }}>
        {value}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div style={card}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#9B9B9B",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "var(--font-mono, monospace)" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function ExpenseForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Expense;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(
    initial ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [category, setCategory] = useState(initial?.category ?? "hosting");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amountINR, setAmountINR] = useState<number>(initial?.amountINR ?? 0);
  const [amountUSD, setAmountUSD] = useState<string>(
    initial?.amountUSD != null ? String(initial.amountUSD) : ""
  );
  const [exchangeRate, setExchangeRate] = useState<number>(
    initial?.exchangeRate ?? USD_TO_INR_DEFAULT
  );
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? "upi");
  const [referenceNumber, setReferenceNumber] = useState(initial?.referenceNumber ?? "");
  const [invoiceUrl, setInvoiceUrl] = useState(initial?.invoiceUrl ?? "");
  const [recurringInterval, setRecurringInterval] = useState(
    initial?.isRecurring ? initial.recurringInterval ?? "monthly" : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calc INR from USD when both present
  const applyUsd = (usd: string) => {
    setAmountUSD(usd);
    const n = Number(usd);
    if (Number.isFinite(n) && n > 0 && exchangeRate > 0) {
      setAmountINR(Math.round(n * exchangeRate));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amountINR) {
      setError("Description and amount are required");
      return;
    }
    setSaving(true);
    setError(null);
    const isRecurring = Boolean(recurringInterval);
    const payload = {
      date: new Date(date).toISOString(),
      category,
      description: description.trim(),
      amountINR,
      amountUSD: amountUSD ? Number(amountUSD) : null,
      exchangeRate: amountUSD ? exchangeRate : null,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || null,
      invoiceUrl: invoiceUrl.trim() || null,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : null,
      notes: notes.trim() || null,
    };
    try {
      const url = initial ? `/api/admin/expenses/${initial.id}` : "/api/admin/expenses";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            borderBottom: "1px solid #F0F0EC",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
            {initial ? "Edit expense" : "Add expense"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "#6B6B6B",
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={submit}
          style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <FormField label="Date *">
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} style={input} />
          </FormField>
          <FormField label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Description *" full>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={input}
            />
          </FormField>
          <FormField label="Amount (₹) *">
            <input
              type="number"
              min={0}
              step="any"
              required
              value={amountINR || ""}
              onChange={(e) => setAmountINR(Number(e.target.value))}
              style={input}
            />
          </FormField>
          <FormField label="Amount ($)">
            <input
              type="number"
              min={0}
              step="any"
              value={amountUSD}
              onChange={(e) => applyUsd(e.target.value)}
              style={input}
            />
          </FormField>
          {amountUSD && (
            <FormField label={`Exchange rate (₹/${1})`} full>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  style={{ ...input, width: 120 }}
                />
                <span style={{ fontSize: 11, color: "#6B6B6B" }}>
                  ₹{exchangeRate.toFixed(2)}/$1 — stored alongside the expense
                </span>
              </div>
            </FormField>
          )}
          <FormField label="Payment method">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={input}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Reference number">
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              style={input}
            />
          </FormField>
          <FormField label="Invoice link (paste URL)" full>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={invoiceUrl}
              onChange={(e) => setInvoiceUrl(e.target.value)}
              style={input}
            />
            <span style={{ fontSize: 10, color: "#9B9B9B" }}>
              PDF upload to Vercel Blob is not wired yet — paste a shared link for now.
            </span>
          </FormField>
          <FormField label="Recurring">
            <select
              value={recurringInterval}
              onChange={(e) => setRecurringInterval(e.target.value)}
              style={input}
            >
              {RECURRING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes" full>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...input, resize: "vertical" }}
            />
          </FormField>

          {error && (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "#FEE2E2",
                color: "#991B1B",
                padding: 10,
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "7px 14px",
                background: "#fff",
                color: "#6B6B6B",
                border: "1px solid #E8E8E4",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "7px 14px",
                background: "#16A34A",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : initial ? "Save changes" : "Add expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        gridColumn: full ? "1 / -1" : undefined,
      }}
    >
      <span style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  color: "#9B9B9B",
  fontWeight: 600,
  fontSize: 11,
};

const tdRight: React.CSSProperties = {
  padding: "6px 8px",
  textAlign: "right",
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
  color: "#1A1A1A",
};

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 4,
  cursor: "pointer",
  color: "#6B6B6B",
  display: "inline-flex",
  alignItems: "center",
};

const input: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #E8E8E4",
  borderRadius: 6,
  fontSize: 13,
  background: "#FAFAF8",
};

const selectStyle: React.CSSProperties = {
  padding: "5px 10px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  border: "1px solid #E8E8E4",
  background: "#fff",
  color: "#6B6B6B",
  cursor: "pointer",
};
