import { useRef } from 'react';

export default function WordSelectStep({
  words,
  selected,
  onChange,
  onDwell,
  onToggle,
  limit,
  tone = 'positive',
}) {
  const dwellStarts = useRef({});

  function startDwell(word) {
    dwellStarts.current[word] = Date.now();
  }

  function endDwell(word) {
    const startedAt = dwellStarts.current[word];
    if (!startedAt) return;
    onDwell?.(word, Date.now() - startedAt, { mode: 'select' });
    delete dwellStarts.current[word];
  }

  function toggle(word) {
    const has = selected.includes(word);
    if (has) {
      onToggle?.(word, 'unselect');
      onChange(selected.filter((item) => item !== word));
      return;
    }
    if (selected.length < limit) {
      onToggle?.(word, 'select');
      onChange([...selected, word]);
    }
  }

  return (
    <>
      <div className="selection-note">
        <strong>{limit}개 중 {selected.length}개 선택됨</strong>
        <span>정확히 {limit}개를 선택해야 다음으로 이동할 수 있습니다.</span>
      </div>
      <div className="chip-grid">
        {words.map((word) => {
          const active = selected.includes(word);
          return (
            <button
              className={`chip ${tone} ${active ? 'selected' : ''}`}
              type="button"
              key={word}
              onClick={() => toggle(word)}
              onPointerEnter={() => startDwell(word)}
              onPointerLeave={() => endDwell(word)}
              onFocus={() => startDwell(word)}
              onBlur={() => endDwell(word)}
            >
              {word}
            </button>
          );
        })}
      </div>
    </>
  );
}
