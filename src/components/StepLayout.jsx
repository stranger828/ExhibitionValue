import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function StepLayout({
  children,
  current,
  total,
  eyebrow,
  title,
  description,
  canNext,
  onPrev,
  onNext,
  nextLabel = '다음',
  hidePrev = false,
}) {
  const progress = Math.round(((current + 1) / total) * 100);

  return (
    <main className="app-frame">
      <header className="topbar">
        <div>
          <p className="brand">전시 무드 생각해보기</p>
          <p className="step-count">{current + 1} / {total}</p>
        </div>
        <div className="progress-track" aria-label="진행률">
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <section className="step-panel">
        <div className="step-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </section>

      <nav className="bottom-actions">
        {!hidePrev && (
          <button className="btn ghost" type="button" onClick={onPrev}>
            <ArrowLeft size={18} />
            이전
          </button>
        )}
        <button className="btn primary" type="button" disabled={!canNext} onClick={onNext}>
          {nextLabel}
          <ArrowRight size={18} />
        </button>
      </nav>
    </main>
  );
}
