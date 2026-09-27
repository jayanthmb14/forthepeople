/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Module-level Error Boundary
// Wraps any district module page to catch render errors.
//
// Design v3 (2026-09-27): a calm token-only card (no red fill, no left
// stripe; the danger colour appears only on the icon), honest copy that
// does not promise cached data, and the kit's secondary "Try again"
// button. Behaviour is unchanged: "Try again" clears the error state so
// React renders the children again.
// ═══════════════════════════════════════════════════════════
import { useTranslations } from "next-intl";
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ToolbarButton } from "@/components/district/ui";

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
      <ModuleErrorFallback
        moduleName={this.props.moduleName}
        onRetry={() => this.setState({ hasError: false, errorMessage: "" })}
      />
    );
  }
}

/** The fallback card, as a function component so it can use translations. */
function ModuleErrorFallback({ moduleName, onRetry }: { moduleName?: string; onRetry: () => void }) {
  const t = useTranslations("errors");
  const tk = useTranslations("kit");
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        margin: 24,
        padding: 16,
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <AlertCircle size={18} style={{ color: "var(--ftp-danger)", flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <div>
          <p className="ftp-title">{moduleName ? t("sectionFailed", { name: moduleName }) : t("sectionFailedGeneric")}</p>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 2 }}>
            {t("sectionFailedBody")}
          </p>
        </div>
      </div>
      <div>
        <ToolbarButton icon={RefreshCw} onClick={onRetry}>
          {tk("tryAgain")}
        </ToolbarButton>
      </div>
    </div>
  );
}
