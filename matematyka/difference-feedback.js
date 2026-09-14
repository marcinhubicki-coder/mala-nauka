(() => {
  const processed = new WeakSet();
  const MAX_VALUE = 100;
  const TABLE_SIZE = 10;

  function numberFromText(node) {
    const value = Number(String(node?.textContent || '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function clearDifference(array) {
    array?.querySelectorAll('.difference-cell, .difference-target, .difference-soft').forEach((cell) => {
      cell.classList.remove(
        'difference-cell',
        'difference-missing',
        'difference-extra',
        'difference-target',
        'difference-soft'
      );
    });

    array?.querySelectorAll('.difference-number[data-difference-number]').forEach((number) => number.remove());
  }

  function addDifferenceNumber(cell, value) {
    if (value > MAX_VALUE) return;

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

  function cellAt(array, row, col) {
    return array.querySelector(`.array-cell[data-row="${row}"][data-col="${col}"]`);
  }

  function extraCellsInNumberingOrder(array, rows, columns, count) {
    const result = [];
    const seen = new Set();
    const push = (cell) => {
      if (!cell || !cell.classList.contains('outside-problem') || seen.has(cell)) return;
      seen.add(cell);
      result.push(cell);
    };

    const remainingInLastRow = Math.max(0, TABLE_SIZE - columns);

    // Jeżeli nadmiar mieści się po prawej stronie ostatniego poprawnego wyniku,
    // kontynuuj numerowanie w tym samym rzędzie.
    if (count <= remainingInLastRow) {
      for (let col = columns + 1; col <= TABLE_SIZE && result.length < count; col += 1) {
        push(cellAt(array, rows, col));
      }
      return result;
    }

    // Jeżeli w rzędzie brakuje miejsca, przejdź do wolnych kolumn po prawej
    // i licz od góry do dołu, kolumna po kolumnie.
    for (let col = columns + 1; col <= TABLE_SIZE && result.length < count; col += 1) {
      for (let row = 1; row <= TABLE_SIZE && result.length < count; row += 1) {
        push(cellAt(array, row, col));
      }
    }

    // Dla prostokątów dochodzących do prawej krawędzi wykorzystaj wolne rzędy
    // pod poprawnym obszarem. To pozwala zachować ciąg aż do 100.
    for (let row = rows + 1; row <= TABLE_SIZE && result.length < count; row += 1) {
      for (let col = 1; col <= columns && result.length < count; col += 1) {
        push(cellAt(array, row, col));
      }
    }

    // Ostateczny fallback: każde pozostałe wolne pole, bez duplikatów.
    for (let row = 1; row <= TABLE_SIZE && result.length < count; row += 1) {
      for (let col = 1; col <= TABLE_SIZE && result.length < count; col += 1) {
        push(cellAt(array, row, col));
      }
    }

    return result;
  }

  function markTarget(cell) {
    if (!cell) return;
    cell.classList.add('difference-cell', 'difference-target');
  }

  function markSoft(cell, kind) {
    if (!cell) return;
    cell.classList.add('difference-cell', 'difference-soft', kind);
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
    const chosen = Math.min(MAX_VALUE, Number(note.dataset.chosenAnswer));
    if (!Number.isFinite(chosen) || chosen === correct) return;

    clearDifference(array);

    if (chosen < correct) {
      const chosenCell = array.querySelector(`.array-cell.in-problem[data-count="${chosen}"]`);
      markTarget(chosenCell);

      [...array.querySelectorAll('.array-cell.in-problem[data-count]')]
        .filter((cell) => {
          const value = Number(cell.dataset.count);
          return value > chosen && value <= correct;
        })
        .forEach((cell) => markSoft(cell, 'difference-missing'));
      return;
    }

    const visibleDifference = Math.min(chosen - correct, MAX_VALUE - correct);
    extraCellsInNumberingOrder(array, rows, columns, visibleDifference).forEach((cell, index) => {
      const value = correct + index + 1;
      addDifferenceNumber(cell, value);
      if (value === chosen) markTarget(cell);
      else markSoft(cell, 'difference-extra');
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
    note.innerHTML = `<strong class="chosen-answer">${chosen}</strong> to o <strong class="difference-amount">${difference}</strong> ${direction}.`;
    processed.add(note);

    const quizStage = note.closest('.quiz-stage');
    const array = quizStage?.querySelector('.array');
    const expressions = [...quizStage?.querySelectorAll('.row-expression') || []];
    if (!expressions.length || !array) return;

    // Po pierwszym ręcznym kliknięciu wyniku po prawej usuń czerwone pola.
    // Komunikat nad planszą zostaje, a oryginalna niebieska interakcja działa bez zakłóceń.
    expressions.forEach((button) => {
      button.addEventListener('click', () => clearDifference(array), { capture: true, once: true });
    });

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
