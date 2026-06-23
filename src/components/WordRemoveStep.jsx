import { useRef } from 'react';

export default function WordRemoveStep({ words, removed, onChange, onDwell, onToggle, limit, remainingLabel }) {
  const dwellStarts = useRef({});

  function startDwell(word) {
    dwellStarts.current[word] = Date.now();
  }

  function endDwell(word) {
    const startedAt = dwellStarts.current[word];
    if (!startedAt) return;
    onDwell?.(word, Date.now() - startedAt, { mode: 'remove' });
    delete dwellStarts.current[word];
  }

  function toggle(word) {
    const has = removed.includes(word);
    if (has) {
      onToggle?.(word, 'unmark_remove');
      onChange(removed.filter((item) => item !== word));
      return;
    }
    if (removed.length < limit) {
      onToggle?.(word, 'mark_remove');
      onChange([...removed, word]);
    }
  }

  return (
    <>
      <div className="selection-note remove-note">
        <strong>제거할 단어 {limit}개 중 {removed.length}개 선택됨</strong>
        <span>{remainingLabel} 남기기 위해 내려놓을 단어를 선택하세요.</span>
      </div>
      <div className="chip-grid">
        {words.map((word) => {
          const active = removed.includes(word);
          return (
            <button
              className={`chip removable ${active ? 'removed' : 'kept'}`}
              type="button"
              key={word}
              onClick={() => toggle(word)}
              onPointerEnter={() => startDwell(word)}
              onPointerLeave={() => endDwell(word)}
              onFocus={() => startDwell(word)}
              onBlur={() => endDwell(word)}
            >
              <span>{word}</span>
              <small>{active ? '제거' : '유지'}</small>
            </button>
          );
        })}
      </div>
    </>
  );
}
