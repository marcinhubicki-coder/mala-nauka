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
  const available=new Set(source.map(row=>row.word.normalize('NFC').toLocaleLowerCase('pl'))).size;
  session.noRepeatWords=true;
  session.questionLimit = config.dyktando ? available : settings.limitMode === 'count' ? Math.min(settings.wordLimit,available) : available;
  session.availableWords=available;
  session.poolExhausted=false;
  return session;
}

export function spellingRoundLabel(result) {
  if (result.dyktando) return 'Dyktando';
  if (result.limitMode === 'count') return (result.actualWordLimit||cleanRoundSettings(result).wordLimit) + ' słów';
  return result.duration / 60 + ' min';
}
