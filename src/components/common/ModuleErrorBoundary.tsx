/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Module-level Error Boundary
// Wraps any district module page to catch render errors.
// ═══════════════════════════════════════════════════════════
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ModuleErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console; in production you could send to Sentry / Vercel analytics
    console.error(`[ModuleErrorBoundary] ${this.props.moduleName ?? "module"} crashed:`, error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          margin: 24,
          padding: "20px 24px",
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderLeft: "4px solid #DC2626",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AlertCircle size={18} style={{ color: "#DC2626", flexShrink: 0 }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
              Couldn&apos;t load {this.props.moduleName ?? "this section"}
            </div>
            <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 3 }}>
              There was an error loading this module. Cached data may be shown below.
            </div>
          </div>
        </div>
        <button
          onClick={() => this.setState({ hasError: false, errorMessage: "" })}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            background: "#DC2626",
            color: "#FFF",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          <RefreshCw size={13} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }
}
