import type { RiskComment, RiskCommentAttachment } from '@/lib/risk-types'

/** Normalizes legacy single `attachment` and `attachments` into one list. */
export function getCommentAttachments(c: RiskComment): RiskCommentAttachment[] {
  if (c.attachments?.length) return c.attachments
  if (c.attachment) return [c.attachment]
  return []
}
