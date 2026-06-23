import { Copy, Download, Printer, RotateCcw } from 'lucide-react';
import { PLANNING_QUESTIONS } from '../data/words.js';
import { generatePrompt, buildResultData } from '../utils/promptGenerator.js';

function SummaryBlock({ title, children }) {
  return (
    <section className="result-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function TextRows({ data }) {
  return (
    <dl className="text-rows">
      {Object.entries(data).map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || '미입력'}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ResultPage({ state, onCopy, onRestart }) {
  const prompt = generatePrompt(state);
  const resultJson = JSON.stringify(buildResultData(state), null, 2);
  const alternativeEntries = Object.entries(state.positiveAlternativesForNegativeWords);
  const planningRows = Object.fromEntries(
    PLANNING_QUESTIONS.fields.map(([key, question]) => [question, state.planningAnswers[key]]),
  );
  const stageSummaries = Object.values(state.interactionLog?.stageSummaries || {});
  const dwellEvents = state.interactionLog?.dwellEvents || [];

  function downloadText() {
    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exhibition-mood-prompt.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-frame result-frame">
      <header className="topbar print-hidden">
        <div>
          <p className="brand">전시 무드 생각해보기</p>
          <p className="step-count">결과</p>
        </div>
        <div className="progress-track"><span style={{ width: '100%' }} /></div>
      </header>

      <section className="result-hero">
        <p className="eyebrow">Workshop Output</p>
        <h1>전시기획 회의를 위한 무드 결과</h1>
        <p>아래 데이터는 단정적인 해석이 아니라, 전시 방향을 함께 논의하기 위한 정리본입니다.</p>
      </section>

      <div className="result-grid">
        <SummaryBlock title="최종 전시 무드 키워드 5">
          <div className="result-chips featured">
            {state.finalMoodWords.map((word) => <span key={word}>{word}</span>)}
          </div>
        </SummaryBlock>

        <SummaryBlock title="단답 질문 답변 요약">
          <TextRows data={planningRows} />
        </SummaryBlock>

        <SummaryBlock title="키워드 흐름">
          <div className="keyword-columns">
            <div>
              <h3>긍정 핵심</h3>
              <div className="result-chips">{state.positiveCoreWords.map((word) => <span key={word}>{word}</span>)}</div>
            </div>
            <div>
              <h3>부정 핵심</h3>
              <div className="result-chips muted">{state.negativeCoreWords.map((word) => <span key={word}>{word}</span>)}</div>
            </div>
          </div>
          <div className="pair-list">
            {alternativeEntries.map(([negative, positive]) => (
              <p key={negative}><strong>{negative}</strong><span>{'->'}</span>{positive}</p>
            ))}
          </div>
        </SummaryBlock>

        <SummaryBlock title="상호작용 참고 기록">
          <TextRows data={{
            '단계 기록': stageSummaries.length
              ? stageSummaries.map((item) => `${item.stage}: ${Math.round(item.durationMs / 1000)}초, 첫 행동 ${item.firstActionDelayMs === null ? '없음' : `${Math.round(item.firstActionDelayMs / 1000)}초`}, 선택/변경 ${item.choiceEventCount}회`).join('\n')
              : '아직 기록 없음',
            '머문 기록': dwellEvents.length
              ? `키워드 위에 머문 기록 ${dwellEvents.length}개가 결과 JSON과 AI 프롬프트에 포함됩니다.`
              : '아직 기록 없음',
          }} />
        </SummaryBlock>

        <SummaryBlock title="AI 분석용 프롬프트">
          <pre className="prompt-preview">{prompt}</pre>
          <div className="result-actions print-hidden">
            <button className="btn primary" type="button" onClick={() => onCopy(prompt)}>
              <Copy size={18} />
              AI 분석 프롬프트 복사하기
            </button>
            <button className="btn ghost" type="button" onClick={() => onCopy(resultJson)}>
              <Copy size={18} />
              결과 JSON 복사하기
            </button>
            <button className="btn ghost" type="button" onClick={downloadText}>
              <Download size={18} />
              텍스트 파일 다운로드
            </button>
            <button className="btn ghost" type="button" onClick={() => window.print()}>
              <Printer size={18} />
              인쇄하기
            </button>
            <button className="btn danger" type="button" onClick={onRestart}>
              <RotateCcw size={18} />
              처음부터 다시 하기
            </button>
          </div>
        </SummaryBlock>
      </div>
    </main>
  );
}
