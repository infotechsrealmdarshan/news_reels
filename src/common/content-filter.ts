const ADULT_KEYWORDS = [
  'porn',
  'porno',
  'xxx',
  'sex',
  'sexual',
  'nude',
  'nudity',
  'onlyfans',
  'escort',
  'hookup',
  'hentai',
  'blowjob',
  'anal',
  'cum',
  'masturb',
  'fetish',
];

export function isAdultContent(texts: Array<string | undefined | null>): boolean {
  const joined = texts
    .map((t) => (t ?? '').toString())
    .join(' ')
    .toLowerCase();
  if (!joined.trim()) return false;
  return ADULT_KEYWORDS.some((k) => joined.includes(k));
}

