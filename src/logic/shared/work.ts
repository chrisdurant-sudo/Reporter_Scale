import type { UtcTimestamp, WorkItem } from "../../contracts/v2";

/** Reconstruct editable work fields without rewriting the retained audit history. */
export function projectWorkItemAt(work: WorkItem, asOfAt: UtcTimestamp): WorkItem {
  const asOf = Date.parse(asOfAt);
  if (!Number.isFinite(asOf)) throw new Error("Work history requires a valid as-of time.");
  const later = (work.editHistory ?? []).map((edit, index) => ({ edit, index }))
    .filter(({ edit }) => Date.parse(edit.occurredAt) > asOf)
    .sort((a, b) => Date.parse(b.edit.occurredAt) - Date.parse(a.edit.occurredAt) || b.index - a.index);
  if (!later.length) return work;
  const restored = { ...work };
  for (const { edit } of later) {
    if ("title" in edit.changes) {
      if (edit.previous.title === undefined) delete restored.title;
      else restored.title = edit.previous.title;
    }
    if ("priority" in edit.changes) {
      if (edit.previous.priority === undefined) delete restored.priority;
      else restored.priority = edit.previous.priority;
    }
    if ("dueAt" in edit.changes) {
      if (edit.previous.dueAt === undefined) throw new Error(`Work ${work.id} is missing its previous due date.`);
      restored.dueAt = edit.previous.dueAt;
    }
    if ("blockerCode" in edit.changes) {
      if (edit.previous.blockerCode === undefined) throw new Error(`Work ${work.id} is missing its previous blocker.`);
      restored.blockerCode = edit.previous.blockerCode;
    }
  }
  return restored;
}
