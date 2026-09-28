# prisma/archive — provenance only, never run

These seeds are kept so the history of rows in the database can be traced
(`scripts/fix-audit-2026-09-*.ts` cite them). They are **not** a way to load
data. Each one contains invented or untraceable figures — random rainfall,
arrears and traffic challans, hand-typed mandi prices and weather readings
labelled "AGMARKNET" or "IMD" — and `seed.ts` first deletes every row of about
50 tables, including `District` and `State`.

| File | Why it is archived |
|---|---|
| `seed.ts` | The March 2026 Mandya pilot. Wipes ~50 tables with no filter, then writes demo rows (random rainfall, arrears and challans; crop prices dated the run day). |
| `seed-bengaluru-data.ts` | Crop prices labelled "APMC Bengaluru / AGMARKNET" and dam readings dated the run day; random rainfall and challans. |
| `seed-bengaluru-data-ext-c.ts` | Hand-typed crop prices labelled "Agmarknet", weather readings labelled "IMD", rainfall and power outages with no traceable source. |
| `seed-mysuru-data.ts` | Hand-typed crop prices labelled "Agmarknet", weather and dam readings, "IMD Mysuru" rainfall. |
| `seed-delhi-data.ts` | Random rainfall labelled "IMD Delhi"; hand-typed weather readings labelled "IMD". |
| `seed-lucknow-data.ts` | Random traffic challans; crime and court figures the file itself calls approximate. |
| `seed-bengaluru-data-ext-b.ts` | Election results with invented rows ("Tejasvi Surya (MLA)", Bengaluru South 2023 — he is an MP) and round-number budget rows. |
| `seed-chennai-data.ts`, `seed-kolkata-data.ts` | Budget rows "estimated" (~₹7,000 / ~₹8,000 Cr, round numbers) labelled as the corporation budget; election and court rows not taken from ECI / NJDG. |
| `seed-mumbai-data.ts` | 2024 Lok Sabha winner votes "estimated from turnout & margin", labelled "ECI 2024"; budget and court rows likewise. |
| `seed-hyderabad-data.ts` | 2023 Assembly vote counts and court figures marked APPROXIMATE in the file, labelled results.eci.gov.in / njdg.ecourts.gov.in. |
| `seed-expansion.ts` | Ran the Bengaluru and Mysuru files above in one go. |

Rules:

- Every file calls `exitUnlessLocalSeedAllowed()` (`prisma/seed-guard.ts`)
  before doing anything: it exits unless `ALLOW_SEED_WIPE=1` is set **and**
  `DATABASE_URL` points at a database on this machine. `.env` may point at
  production — the guard is why running one by mistake does nothing.
- No npm script runs them (`db:seed`, `db:reset` and the `prisma.seed` hook were
  removed on 2026-09-28).
- `tests/seed-guard.test.ts` fails if a seed outside this folder deletes a
  whole table (`deleteMany({})`) or uses random numbers.
- The seeds still in `prisma/` write researched rows with their source, filtered
  to one district or scope; run one by hand only after reading it. The
  all-in-one city seeds (Chennai, Kolkata, Mumbai, Hyderabad) moved here on
  2026-09-28 because each has sections marked estimated / approximate but
  labelled with an official source; their other sections (offices, schools,
  schemes …) are already in the database, and re-running a file would bring
  the invented sections back into any table the audit emptied.
