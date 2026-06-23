import { FileText, RotateCcw, Sparkles } from 'lucide-react';

export default function Intro({ encouragementMessage, hasSaved, onContinue, onEncouragementChange, onStart }) {
  return (
    <main className="intro">
      <section className="intro-copy">
        <p className="eyebrow">Exhibition Planning Workshop</p>
        <h1>전시 무드 생각해보기</h1>
        <p>
          함께 준비하는 8명의 무드를 파악하고, 전시기획 회의에서 참고할 수 있는 방향과
          키워드를 정리합니다.
        </p>
        <div className="intro-encouragement">
          <label htmlFor="encouragementMessage">응원의 메시지</label>
          <textarea
            id="encouragementMessage"
            value={encouragementMessage}
            onChange={(event) => onEncouragementChange(event.target.value)}
            placeholder="함께 준비하는 사람들에게 건네고 싶은 말을 적어주세요."
            rows={4}
          />
        </div>
        <div className="intro-actions">
          {hasSaved && (
            <button className="btn primary" type="button" onClick={onContinue}>
              <RotateCcw size={18} />
              이전 작업 이어하기
            </button>
          )}
          <button className="btn dark" type="button" onClick={onStart}>
            <Sparkles size={18} />
            새로 시작하기
          </button>
        </div>
      </section>
      <aside className="intro-sheet">
        <FileText size={28} />
        <h2>같이 정리해볼 것</h2>
        <p>이번 전시가 가져가고 싶은 무드와 피하고 싶은 방향을 고르며, 회의에 참고할 수 있는 키워드를 남깁니다.</p>
        <ul>
          <li>정답을 찾기보다 함께 생각을 맞춰보는 과정입니다.</li>
          <li>입력 내용은 브라우저 localStorage에만 저장됩니다.</li>
          <li>결과는 복사하거나 인쇄해서 회의 자료로 사용할 수 있습니다.</li>
        </ul>
      </aside>
    </main>
  );
}
