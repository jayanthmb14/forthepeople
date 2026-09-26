/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import dynamic from "next/dynamic";

const ContributorWall = dynamic(() => import("./ContributorWall"), { ssr: false });

export default function ContributorWallClient() {
  return <ContributorWall />;
}
