/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Sends this page only the message namespaces it reads (src/i18n/ScopedMessages.tsx).
import ScopedMessages from "@/i18n/ScopedMessages";

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <ScopedMessages scope="about" locale={locale}>
      {children}
    </ScopedMessages>
  );
}
