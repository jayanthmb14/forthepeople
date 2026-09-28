/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// Deleting stored news safely. Two ways a NewsItem row goes:
//
//   mergeNewsCopies()  copies of one story → the row that stays (keepId):
//                      references (duplicateOf) move to it first, so no
//                      row is left pointing at a deleted one
//   deleteNewsItems()  retention (old rows): a copy whose original goes
//                      becomes the story's row (planCopyPromotion)
//
// Both also delete the rows' stored translations (ContentTranslation,
// entityType "news"). The plans are pure (src/lib/news-dedupe.ts).
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { planCopyPromotion } from "@/lib/news-dedupe";

async function deleteNewsTranslations(ids: string[]): Promise<void> {
  // The table may not exist yet (needs db:push): nothing to delete then.
  await prisma.contentTranslation.deleteMany({ where: { entityType: "news", entityId: { in: ids } } }).catch(() => {});
}

/** Merge copies of one story into `keepId`; returns how many rows were deleted. */
export async function mergeNewsCopies(keepId: string, removeIds: string[]): Promise<number> {
  if (removeIds.length === 0) return 0;
  await prisma.newsItem.updateMany({ where: { duplicateOf: { in: removeIds } }, data: { duplicateOf: keepId } });
  await prisma.newsItem.updateMany({ where: { id: keepId, duplicateOf: keepId }, data: { duplicateOf: null } });
  await deleteNewsTranslations(removeIds);
  const del = await prisma.newsItem.deleteMany({ where: { id: { in: removeIds } } });
  return del.count;
}

/** Delete stored stories (retention); returns how many rows were deleted. */
export async function deleteNewsItems(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const copies = await prisma.newsItem.findMany({
    where: { duplicateOf: { in: ids }, id: { notIn: ids } },
    select: { id: true, duplicateOf: true, publishedAt: true },
    take: 5000,
  });
  for (const { keepId, repointIds } of planCopyPromotion(copies)) {
    await prisma.newsItem.update({ where: { id: keepId }, data: { duplicateOf: null } });
    if (repointIds.length > 0) {
      await prisma.newsItem.updateMany({ where: { id: { in: repointIds } }, data: { duplicateOf: keepId } });
    }
  }
  await deleteNewsTranslations(ids);
  const del = await prisma.newsItem.deleteMany({ where: { id: { in: ids } } });
  return del.count;
}
