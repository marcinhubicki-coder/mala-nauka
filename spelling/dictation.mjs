export function cleanDictationTag(value) {
  return typeof value === 'string' && /^dyktando(?::[\p{L}\p{N}_-]{1,60})?$/u.test(value) ? value : 'dyktando';
}

export function dictationPacks(words) {
  const tags = new Map();
  for (const word of words) {
    if (!word.tags?.includes('dyktando')) continue;
    for (const tag of word.tags) {
      if (cleanDictationTag(tag) !== tag) continue;
      tags.set(tag, (tags.get(tag) || 0) + 1);
    }
  }
  return [...tags].map(([tag, count]) => ({ tag, count,
    label: tag === 'dyktando' ? 'Dyktando' : tag.slice(9).replace(/[_-]/g, ' ') }));
}

export function dictationSource(words, tag) {
  const selected = cleanDictationTag(tag);
  return words.filter(word => word.tags?.includes('dyktando') && word.tags.includes(selected));
}
