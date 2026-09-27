# Layout rules — phone, tablet, laptop, PC

Every module page must be easy for a 5-year-old and a 60-year-old: the
answer is visible straight away, and details are one tap away.

## Devices

| Device | Width | Navigation | Content frame | Tile grid | Charts |
|---|---|---|---|---|---|
| Phone | < 640 px | top bar + drawer | full width, 16 px sides | 2 tiles per row | full width, 220–260 px tall |
| Tablet | 640–1023 px | top bar + drawer (no sidebar: it left ~500 px for content) | full width, 20 px sides | 2–3 per row | 2 per row where both are small |
| Laptop | 1024–1439 px | sidebar | up to 1320 px, 28 px sides | 4 per row | 2 per row |
| PC | ≥ 1440 px | sidebar | up to 1320 px, centred | 4 per row | 2–3 per row |

- Wrap each module page in `<ModulePage>` (`src/components/district/ui.tsx`),
  not a hand-made `maxWidth: var(--ftp-reading-max)` div.
- Use `className="ftp-grid"` for card grids. It sets auto-fill columns with a
  280 px minimum; override with `style={{ "--ftp-grid-min": "220px" }}`.
  Never use fixed column counts that squeeze cards on a phone.
- Running text inside wide cards gets `className="ftp-prose"` (72 characters).
- Tables: on a phone, show cards (one per row of data) or a 2-column list,
  never a sideways-scrolling table as the only view. The `ChartCard` "table
  view" may scroll.
- Touch targets are at least 44 × 44 px. Nothing scrolls sideways at 320 px.

## The page recipe

It runs top to bottom, and the first four parts fit on one phone screen.

1. `PageHeader`: the module hue, emoji, title, freshness and source.
2. **The answer in one sentence** (`Explainer` "In simple words"), for
   example "Mandya has 7 dams; 5 are more than half full."
3. **3–4 big numbers** (`StatStrip` of `StatTile`s with emoji and plain labels).
4. **One picture** that explains the numbers: pictogram, gauge, tank, ring,
   countdown or steps.
5. The main list, as cards. **Tapping a card opens `DetailSheet`** with
   everything about that item (`DetailList` rows, the source link, actions).
   The visitor never has to leave the page for details.
6. Charts in `ChartCard`, each with a one-line takeaway.
7. Sources and freshness footer.

## Shared pieces

- `DetailSheet` + `DetailList` (`src/components/district/DetailSheet.tsx`):
  the detail panel. It is a bottom sheet on phones and tablets, and a right
  panel on laptops and PCs.
- `HowItWorks` (`visuals.tsx`): 3–5 picture steps ("📝 Apply → 🔎 Check →
  ✅ Approved → 💰 Money").
- `CountdownBar` (`visuals.tsx`): the time left until a date, filled from the
  start of the wait. Use it for exams, deadlines and elections.
- `Explainer`, `Pictogram`, `Gauge`, `WaterTank`, `ChartCard` (`visuals.tsx`).
