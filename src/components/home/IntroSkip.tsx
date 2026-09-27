/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Ends the intro early on click / tap / key, and marks it seen once it has
// played so a client-side trip back to the home page never replays it.
"use client";

import { useEffect } from "react";

export default function IntroSkip() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-intro") !== "show") return;
    const finish = () => root.setAttribute("data-intro", "seen");
    const skip = () => {
      root.setAttribute("data-intro", "leaving");
      window.setTimeout(finish, 450);
    };
    const t = window.setTimeout(finish, 2500);
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);
  return null;
}
