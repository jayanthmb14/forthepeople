/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Sends the browser only the message namespaces one part of the site needs.
//
// Every page used to serialise the whole dictionary (~400 KB, more in Hindi
// and Kannada) into its HTML and RSC payload, which made each page 0.6–1 MB
// and drove Vercel's ISR-write and transfer charges. A nested provider
// replaces the parent's messages for its subtree, so each scope lists
// everything its own client components read. The lists are generated from
// the import graph (scripts/gen-client-namespaces.mjs) and a test fails when
// they are stale.
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { CLIENT_NAMESPACES, type MessageScope } from "./client-namespaces";

export function pickNamespaces(messages: Record<string, unknown>, names: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const n of names) if (n in messages) out[n] = messages[n];
  return out;
}

export default async function ScopedMessages({
  scope,
  locale,
  children,
}: {
  scope: MessageScope;
  locale: string;
  children: React.ReactNode;
}) {
  const messages = (await getMessages({ locale })) as Record<string, unknown>;
  return (
    <NextIntlClientProvider locale={locale} messages={pickNamespaces(messages, CLIENT_NAMESPACES[scope])} timeZone="Asia/Kolkata">
      {children}
    </NextIntlClientProvider>
  );
}
