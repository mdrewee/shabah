/**
 * Canonical Shabah Game ID normalizer.
 * Unifies all legacy and alternative game IDs (e.g. draft-5, the-scammer, scattergories)
 * into the 5 official Shabah Game IDs.
 */

export type ShabahGameCanonicalId =
  | 'ai-coach'
  | 'ai-broker'
  | 'ai-judge'
  | 'ai-arabic'
  | 'ai-guide';

export function normalizeGameId(rawId: string | null | undefined): ShabahGameCanonicalId {
  if (!rawId) return 'ai-coach';
  const clean = rawId.trim().toLowerCase();

  switch (clean) {
    case 'ai-coach':
    case 'draft-5':
    case 'draft':
    case 'coach':
      return 'ai-coach';

    case 'ai-broker':
    case 'the-scammer':
    case 'broker':
    case 'scammer':
      return 'ai-broker';

    case 'ai-arabic':
    case 'scattergories':
    case 'words':
    case 'arabic':
      return 'ai-arabic';

    case 'ai-guide':
    case 'geo-blind-tourism':
    case 'tourism':
    case 'guide':
      return 'ai-guide';

    case 'ai-judge':
    case 'ai-lawyer':
    case 'judge':
    case 'lawyer':
      return 'ai-judge';

    default:
      return 'ai-coach';
  }
}
