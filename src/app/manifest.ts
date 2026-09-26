/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ForThePeople.in",
    short_name: "ForThePeople",
    description: "Your District. Your Data. Your Right.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#2563EB",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["government", "news", "utilities"],
    lang: "en-IN",
    dir: "ltr",
    scope: "/",
    prefer_related_applications: false,
  };
}
