(() => {
  const processed = new WeakSet();

  function numberFromText(node) {
    const value = Number(String(node?.textContent || '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function clearDifference(array) {
    array?.querySelectorAll('.difference-cell').forEach((cell) => {
      cell.classList.remove('difference-cell', 'difference-missing', 'difference-extra');
    });
    array?.querySelectorAll('.difference-number[data-difference-number]').forEach((number) => number.remove());
  }

  function addDifferenceNumber(cell, value) {
    let number = cell.querySelector('.cell-number');
    if (!number) {
      number = document.createElement('span');
      number.className = 'cell-number difference-number';
      number.dataset.differenceNumber = 'true';
      cell.append(number);
    }
    number.textContent = String(value);
    cell.classList.add('show-number');
  }

  function nearestOutsideCells(array, rows, columns, count) {
    const candidates = [...array.querySelectorAll('.array-cell.outside-problem')].map((cell) => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const vertical = Math.max(0, row - rows);
      const horizontal = Math.max(0, col - columns);
      const onRightEdge = row <= rows && col > columns;
      const onBottomEdge = row > rows && col <= columns;
      const edgePenalty = onRightEdge || onBottomEdge ? 0 : 20;
      const distance = Math.abs(row - rows) + Math.abs(col - columns) + edgePenalty;
      return { cell, row, col, distance };
    });

    candidates.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      // Najpierw rozszerzaj ostatni rząd w prawo, potem schodź pod prostokąt.
      const aRight = a.row === rows && a.col > columns ? 0 : 1;
      const bRight = b.row === rows && b.col > columns ? 0 : 1;
      if (aRight !== bRight) return aRight - bRight;
      if (a.row !== b.row) return b.row - a.row;
      return a.col - b.col;
    });

    return candidates.slice(0, count).map(({ cell }) => cell);
  }

  function highlightDifference(note) {
    const questionBlock = note.closest('.question-block');
    const quizStage = note.closest('.quiz-stage');
    const array = quizStage?.querySelector('.array');
    if (!questionBlock || !array) return;

    const equationNumbers = [...questionBlock.querySelectorAll('.equation-number')].map(numberFromText);
    if (equationNumbers.length < 2 || equationNumbers.some((value) => value == null)) return;

    const rows = equationNumbers[0];
    const columns = equationNumbers[1];
    const correct = rows * columns;
    const chosen = Number(note.dataset.chosenAnswer);
    if (!Number.isFinite(chosen) || chosen === correct) return;

    clearDifference(array);
    const difference = Math.abs(correct - chosen);

    if (chosen < correct) {
      [...array.querySelectorAll('.array-cell.in-problem[data-count]')]
        .filter((cell) => {
          const value = Number(cell.dataset.count);
          return value > chosen && value <= correct;
        })
        .forEach((cell) => cell.classList.add('difference-cell', 'difference-missing'));
      return;
    }

    nearestOutsideCells(array, rows, columns, difference).forEach((cell, index) => {
      cell.classList.add('difference-cell', 'difference-extra');
      addDifferenceNumber(cell, correct + index + 1);
    });
  }

  function prepareNote(note) {
    if (processed.has(note)) return;

    const questionBlock = note.closest('.question-block');
    const equationNumbers = [...questionBlock?.querySelectorAll('.equation-number') || []].map(numberFromText);
    const strong = note.querySelector('strong');
    const chosen = numberFromText(strong);
    if (equationNumbers.length < 2 || equationNumbers.some((value) => value == null) || chosen == null) return;

    const correct = equationNumbers[0] * equationNumbers[1];
    if (chosen === correct) return;

    const difference = Math.abs(correct - chosen);
    const direction = chosen < correct ? 'za mało' : 'za dużo';
    note.dataset.chosenAnswer = String(chosen);
    note.dataset.correctAnswer = String(correct);
    note.dataset.difference = String(difference);
    note.dataset.direction = chosen < correct ? 'low' : 'high';
    note.innerHTML = `To o <strong>${difference}</strong> ${direction}.`;
    processed.add(note);

    const quizStage = note.closest('.quiz-stage');
    const expressions = [...quizStage?.querySelectorAll('.row-expression') || []];
    if (!expressions.length) return;

    const maybeFinish = () => {
      if (expressions.every((button) => !button.disabled)) {
        highlightDifference(note);
        expressionObserver.disconnect();
      }
    };

    const expressionObserver = new MutationObserver(maybeFinish);
    expressions.forEach((button) => expressionObserver.observe(button, { attributes: true, attributeFilter: ['disabled'] }));
    maybeFinish();
  }

  function scan() {
    document.querySelectorAll('.wrong-answer-note').forEach(prepareNote);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
