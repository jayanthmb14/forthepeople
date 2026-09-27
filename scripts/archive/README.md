# scripts/archive — provenance only

These scripts already ran. They are kept because they show **where numbers in
the database came from**, not so that anyone runs them again.

| Script | What it did |
|---|---|
| `extract-mpi-*.ts` (7) | Pulled district MPI (NITI Aayog, 2023) figures out of `scripts/data-pdfs/niti-mpi-2023.pdf` for Delhi, Maharashtra, Telangana, Tamil Nadu, West Bengal and Uttar Pradesh, plus the Karnataka rural/urban 2015-16 baseline. The PDF is git-ignored (22 MB); fetch it with `scripts/fetch-source-pdfs.ts`. The live extractor pattern is `scripts/extract-mpi-barchart-full.ts`. |
| `fill-{bengaluru,mandya,mysuru,remaining-districts}-infra.ts` | Hand-researched infrastructure rows (fill-only, never overwrote news-derived values). Each change wrote an `UpdateLog` entry with `actorLabel: "manual-research"`. |
| `seed-infra-real-data.ts` | The first real infrastructure rows (`UpdateLog` `actorLabel: "seed-script"`). |
| `seed-subdistrict-populations.ts` | Census 2011 sub-district (taluk) populations and areas ("approximate where noted" in the script). |
| `seed-pune-responsibility-2026-04-25.ts` + `pune-responsibility-2026-04-25.json` | The Pune "What you can do" items, from the research JSON beside it. |

Rules:

- **Do not run these against production.** They write to the shared Neon
  database and were written for the schema of April 2026.
- They are outside the app `tsconfig` (the whole `scripts/` folder is), so
  `npx tsc --noEmit` does not check them.
- Scripts that were one-off data fixes, probes or test-data seeders were
  deleted in the v5 cleanup (27 Sep 2026). `git log --all -- scripts/<name>.ts`
  still finds them.
