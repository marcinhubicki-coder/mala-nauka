export const WORD_LIMITS = Object.freeze([10, 20, 40, 80]);

export function cleanRoundSettings(value) {
  return {
    limitMode: value?.limitMode === 'count' ? 'count' : 'time',
    wordLimit: WORD_LIMITS.includes(Number(value?.wordLimit)) ? Number(value.wordLimit) : 20
  };
}

export function configureSpellingRound(session, config, source) {
  const settings = cleanRoundSettings(config);
  session.untimed = config.dyktando === true || settings.limitMode === 'count';
  session.questionLimit = config.dyktando ? source.length : settings.limitMode === 'count' ? settings.wordLimit : 0;
  return session;
}

export function spellingRoundLabel(result) {
  if (result.dyktando) return 'Dyktando';
  if (result.limitMode === 'count') return cleanRoundSettings(result).wordLimit + ' słów';
  return result.duration / 60 + ' min';
}
