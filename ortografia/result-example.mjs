export function exampleResult(words, scenario = 'mixed') {
  const order = ['marzenie', 'łóżko', 'możliwość', 'skuwka', 'krzyżówka', 'róża', 'ucho'];
  const base = order.map((word, i) => {
    const record = words.find(item => item.word === word);
    if (!record) throw Error('Brak przykładowego słowa: ' + word);
    return {...record, kind: 'spelling', correct: i >= 5, selected: i >= 5 ? record.answer : record.options.find(option => option !== record.answer)};
  });
  const attempts = scenario === 'empty' ? [] : scenario === 'correct' ? base.map(item => ({...item, correct: true})) :
    scenario === 'review' ? Array.from({length: 14}, (_, i) => ({...base[i % base.length], correct: false})) : base;
  return {mode: 'spelling', category: 'all', difficulty: 0, duration: 180, dyktando: scenario === 'dyktando',
    early: scenario !== 'completed', date: new Date().toISOString(), attempts,
    correct: attempts.filter(item => item.correct).length, wrong: attempts.filter(item => !item.correct).length};
}
