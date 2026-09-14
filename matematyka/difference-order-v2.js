(() => {
  const MAX_VALUE = 100;
  const TABLE_SIZE = 10;

  function numberFromText(node) {
    const value = Number(String(node?.textContent || '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function cellAt(array, row, col) {
    return array.querySelector(`.array-cell[data-row="${row}"][data-col="${col}"]`);
  }

  function desiredExtraCells(array, rows, columns, count) {
    const result = [];
    for (let row = rows + 1; row <= TABLE_SIZE && result.length < count; row += 1) {
      for (let col = 1; col <= columns && result.length < count; col += 1) result.push(cellAt(array, row, col));
    }
    for (let col = columns + 1; col <= TABLE_SIZE && result.length < count; col += 1) {
      for (let row = 1; row <= TABLE_SIZE && result.length < count; row += 1) result.push(cellAt(array, row, col));
    }
    return result.filter(Boolean);
  }

  function addNumber(cell, value) {
    if (!cell || value > MAX_VALUE) return;
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

  function clearOutsideDifference(array) {
    array.querySelectorAll('.array-cell.outside-problem').forEach((cell) => {
      cell.classList.remove('difference-cell', 'difference-extra', 'difference-target', 'difference-soft');
      cell.querySelectorAll('.difference-number[data-difference-number]').forEach((number) => number.remove());
    });
  }

  function fix(note) {
    if (!note || note.dataset.direction !== 'high' || note.dataset.diffDismissed === '1' || note.dataset.diffOrderFixed === '1') return;
    const stage = note.closest('.quiz-stage');
    if (stage?.dataset.operation !== 'multiply') return;
    const questionBlock = note.closest('.question-block');
    const array = stage?.querySelector('.array');
    if (!stage || !questionBlock || !array || !array.querySelector('.difference-extra, .difference-target')) return;

    const factors = [...questionBlock.querySelectorAll('.equation-number')].map(numberFromText);
    if (factors.length < 2 || factors.some((value) => value == null)) return;
    const rows = factors[0];
    const columns = factors[1];
    const correct = rows * columns;
    const chosen = Math.min(MAX_VALUE, Number(note.dataset.chosenAnswer));
    if (!Number.isFinite(chosen) || chosen <= correct) return;

    const count = Math.min(chosen - correct, MAX_VALUE - correct);
    clearOutsideDifference(array);
    desiredExtraCells(array, rows, columns, count).forEach((cell, index) => {
      const value = correct + index + 1;
      addNumber(cell, value);
      cell.classList.add('difference-cell', 'difference-extra');
      if (value === chosen) cell.classList.add('difference-target');
      else cell.classList.add('difference-soft');
    });
    note.dataset.diffOrderFixed = '1';
  }

  function scan() {
    document.querySelectorAll('.quiz-stage[data-operation="multiply"] .wrong-answer-note[data-direction="high"]').forEach(fix);
  }

  document.addEventListener('click', event => {
    const expression = event.target.closest?.('.quiz-stage[data-operation="multiply"] .row-expression');
    if (!expression) return;
    const note = expression.closest('.quiz-stage')?.querySelector('.wrong-answer-note');
    if (note) note.dataset.diffDismissed = '1';
  }, true);

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  scan();
})();
