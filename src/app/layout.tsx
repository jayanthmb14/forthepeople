/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Noto_Sans_Kannada, Noto_Sans_Devanagari } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetBrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const notoKannada = Noto_Sans_Kannada({
  variable: "--font-noto-kannada",
  subsets: ["kannada"],
  weight: ["400", "600"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600"],
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const metadata: Metadata = {
  title: {
    default: "ForThePeople.in — Your District. Your Data. Your Right.",
    template: "%s | ForThePeople.in",
  },
  description:
    "India's citizen transparency platform. Access district-level government data — budgets, schemes, crop prices, water levels, and more.",
  metadataBase: new URL(BASE_URL),
  keywords: [
    "government data India", "district dashboard", "RTI India",
    "crop prices", "government schemes", "citizen transparency",
    "Karnataka districts", "Mandya", "gram panchayat",
    "India civic data", "public data India", "government transparency",
  ],
  authors: [{ name: "Jayanth M B", url: BASE_URL }],
  creator: "Jayanth M B",
  publisher: "ForThePeople.in",
  other: {
    "original-author": "Jayanth M B",
    "project-inception": "2026-03-17",
    "x-created-by": "Jayanth M B, Karnataka, India",
    "x-project-id": "FTP-JMB-2026-IN",
    "x-repository": "github.com/jayanthmb14/forthepeople",
  },
  openGraph: {
    type: "website",
    siteName: "ForThePeople.in",
    title: "ForThePeople.in — Your District. Your Data. Your Right.",
    description:
      "Access district-level government data for every Indian — budgets, crop prices, water levels, schemes, and more.",
    url: BASE_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ForThePeople.in — District Data Platform for India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ForThePeople.in — Your District. Your Data. Your Right.",
    description: "India's citizen transparency platform. Free district-level government data.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// WebApplication schema — creator attribution for search engines
const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ForThePeople.in",
  "url": BASE_URL,
  "description": "India's Citizen Transparency Platform — Free, real-time district-level government data dashboards",
  "applicationCategory": "GovernmentService",
  "operatingSystem": "Web",
  "dateCreated": "2026-03-17",
  "license": "https://opensource.org/licenses/MIT",
  "isAccessibleForFree": true,
  "inLanguage": ["en", "kn"],
  "author": {
    "@type": "Person",
    "name": "Jayanth M B",
    "url": "https://www.instagram.com/jayanth_m_b/",
    "nationality": "Indian",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Karnataka",
      "addressCountry": "IN",
    },
  },
};

// Organization + WebSite + FAQPage schema for all pages
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ForThePeople.in",
  "url": BASE_URL,
  "logo": `${BASE_URL}/icon-512.png`,
  "description": "India's citizen transparency platform providing free district-level government data — budgets, crop prices, water levels, government schemes, and more.",
  "foundingDate": "2026",
  "founder": {
    "@type": "Person",
    "name": "Jayanth M B",
    "url": BASE_URL,
  },
  "areaServed": {
    "@type": "Country",
    "name": "India",
  },
  "sameAs": [],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ForThePeople.in",
  "url": BASE_URL,
  "description": "India's citizen transparency platform. Access district-level government data free of cost.",
  "inLanguage": ["en", "kn"],
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${BASE_URL}/en?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is ForThePeople.in?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ForThePeople.in is India's citizen transparency platform — a free, independent website that aggregates district-level government data including crop prices, dam water levels, government schemes, budgets, school data, and more. It is not an official government website and operates under the NDSAP Open Data Policy.",
      },
    },
    {
      "@type": "Question",
      "name": "Which districts are covered on ForThePeople.in?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ForThePeople.in currently covers 20+ Karnataka districts including Mandya, Bengaluru Urban, Mysuru, Tumakuru, Hassan, Kolar, and more. The platform plans to expand to all 780+ Indian districts. Each district has live data on weather, crops, water, budget, schools, elections, leadership, and 25+ other civic categories.",
      },
    },
    {
      "@type": "Question",
      "name": "How do I check crop prices on ForThePeople.in?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "To check crop prices, navigate to your district page (e.g., forthepeople.in/en/karnataka/mandya) and click on 'Crop Prices'. Live mandi prices are sourced from AGMARKNET and updated daily. You can view prices for paddy, sugarcane, ragi, jowar, maize, and other crops with historical trends.",
      },
    },
    {
      "@type": "Question",
      "name": "How do I file an RTI using ForThePeople.in?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ForThePeople.in provides RTI (Right to Information) templates and filing guides for every district. Navigate to your district, click 'RTI', and you'll find pre-filled templates for common government data requests. You can submit RTIs through the official RTI Online Portal at rtionline.gov.in.",
      },
    },
    {
      "@type": "Question",
      "name": "Is ForThePeople.in data free to access?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. ForThePeople.in is completely free — no paywalls, no subscriptions, no registration required. All government data belongs to citizens. The platform sources data from official government portals, public APIs, and gazetted documents under the National Data Sharing and Accessibility Policy (NDSAP).",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${jetBrains.variable} ${notoKannada.variable} ${notoDevanagari.variable}`}
    >
      <head>
        <meta name="theme-color" content="#2563EB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ForThePeople" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        {/* Skip navigation link for keyboard / screen-reader users */}
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>
        {/* Global structured data */}
        <Script
          id="webapp-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }}
        />
        <Script
          id="org-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <Script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <Script
          id="faq-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }`,
          }}
        />
      </body>
    </html>
  );
}
