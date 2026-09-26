/**
 * ForThePeople.in — India's Citizen Transparency Platform
 *
 * Original Creator: Jayanth M B
 * Inception: March 2026
 * Repository: github.com/jayanthmb14/forthepeople
 * License: MIT
 *
 * This project was conceived, designed, and built by Jayanth M B
 * from Karnataka, India. Any fork or derivative must retain this
 * attribution notice as per the license terms.
 *
 * © 2026 Jayanth M B. All rights reserved.
 * Project ID: FTP-JMB-2026-IN
 */

export const CREATOR = {
  name: "Jayanth M B",
  project: "ForThePeople.in",
  inception: "2026-03-17",
  projectId: "FTP-JMB-2026-IN",
  repository: "github.com/jayanthmb14/forthepeople",
  license: "MIT",
} as const;

export function addWatermarkHeaders(headers: Headers): void {
  headers.set("X-Powered-By", "ForThePeople.in");
  headers.set("X-Creator", "Jayanth M B");
  headers.set("X-Project-ID", CREATOR.projectId);
  headers.set(
    "X-License",
    "MIT — github.com/jayanthmb14/forthepeople"
  );
}

export function getWatermarkMeta() {
  return {
    _meta: {
      platform: CREATOR.project,
      creator: CREATOR.name,
      projectId: CREATOR.projectId,
      license: CREATOR.license,
    },
  };
}
