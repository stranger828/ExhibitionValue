import { useRef } from 'react';
import { ALTERNATIVE_MAP } from '../data/words.js';

export default function PositiveAlternativeStep({ negativeWords, value, onChange, onDwell }) {
  const completed = negativeWords.filter((word) => value[word]).length;
  const dwellStarts = useRef({});

  function startDwell(key) {
    dwellStarts.current[key] = Date.now();
  }

  function endDwell(key, word, extra = {}) {
    const startedAt = dwellStarts.current[key];
    if (!startedAt) return;
    onDwell?.(word, Date.now() - startedAt, { mode: 'alternative', ...extra });
    delete dwellStarts.current[key];
  }

  return (
    <>
      <div className="selection-note">
        <strong>{negativeWords.length}개 중 {completed}개 완료됨</strong>
        <span>추천 단어를 고르거나 직접 입력해도 됩니다.</span>
      </div>
      <div className="alternative-list">
        {negativeWords.map((negative) => {
          const recommendations = ALTERNATIVE_MAP[negative] || ['명료한', '사려 깊은', '고유한'];
          return (
            <article className="alternative-card" key={negative}>
              <div>
                <p>피하고 싶은 방향</p>
                <h2>{negative}</h2>
              </div>
              <div className="mini-chip-row">
                {recommendations.map((word) => (
                  <button
                    className={`mini-chip ${value[negative] === word ? 'selected' : ''}`}
                    type="button"
                    key={word}
                    onClick={() => onChange(negative, word, 'select_alternative')}
                    onPointerEnter={() => startDwell(`${negative}:${word}`)}
                    onPointerLeave={() => endDwell(`${negative}:${word}`, word, { negative })}
                    onFocus={() => startDwell(`${negative}:${word}`)}
                    onBlur={() => endDwell(`${negative}:${word}`, word, { negative })}
                  >
                    {word}
                  </button>
                ))}
              </div>
              <input
                value={value[negative] || ''}
                placeholder="직접 긍정 방향 입력"
                onChange={(event) => onChange(negative, event.target.value, 'type_alternative')}
              />
            </article>
          );
        })}
      </div>
    </>
  );
}
