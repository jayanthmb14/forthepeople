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
  to one district or scope; run one by hand only after reading it.
