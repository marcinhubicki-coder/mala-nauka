export const LEARNING_TYPES = Object.freeze({
  exchange: 'Pisownia wymienna',
  pattern: 'Reguła',
  exception: 'Wyjątek',
  memory: 'Zapamiętaj',
});

const text = (value, limit = 600) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit;
const words = value => Array.isArray(value) && value.length <= 24 && new Set(value).size === value.length && value.every(word => text(word, 80));
export function validLearning(value) {
  if (value === undefined) return true;
  return value !== null && typeof value === 'object' && Object.hasOwn(LEARNING_TYPES, value.type) &&
    text(value.title, 120) && text(value.explanation) && words(value.relatedWords) && words(value.forms) &&
    Array.isArray(value.examples) && value.examples.length <= 12 && value.examples.every(example =>
      example !== null && typeof example === 'object' && text(example.from, 80) && text(example.to, 80) && text(example.change, 40)) &&
    Array.isArray(value.sources) && value.sources.length <= 6 && value.sources.every(source =>
      source !== null && typeof source === 'object' && text(source.label, 100) && text(source.url, 500) && /^https:\/\//.test(source.url));
}
