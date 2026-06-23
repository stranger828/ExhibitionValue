import { useEffect, useMemo, useRef, useState } from 'react';
import Intro from './components/Intro.jsx';
import StepLayout from './components/StepLayout.jsx';
import QuestionStep from './components/QuestionStep.jsx';
import WordSelectStep from './components/WordSelectStep.jsx';
import WordRemoveStep from './components/WordRemoveStep.jsx';
import PositiveAlternativeStep from './components/PositiveAlternativeStep.jsx';
import FinalSelectStep from './components/FinalSelectStep.jsx';
import ResultPage from './components/ResultPage.jsx';
import { NEGATIVE_WORDS, PLANNING_QUESTIONS, POSITIVE_WORDS } from './data/words.js';
import { clearSavedState, loadSavedState, saveState } from './utils/storage.js';

const TOTAL_STEPS = 10;

const STAGE_KEYS = [
  'planning_questions',
  'positive_select_20',
  'positive_remove_20_to_15',
  'positive_remove_15_to_10',
  'positive_remove_10_to_5',
  'negative_select_10',
  'negative_remove_10_to_5',
  'positive_alternatives',
  'final_mood_select',
  'result',
];

const initialState = {
  currentStep: -1,
  encouragementMessage: '',
  planningAnswers: {
    reason: '',
    message: '',
    afterThought: '',
    expectedAudience: '',
    desiredAudience: '',
  },
  selectedPositiveWords: [],
  removedPositiveRound1: [],
  removedPositiveRound2: [],
  removedPositiveRound3: [],
  positiveCoreWords: [],
  selectedNegativeWords: [],
  removedNegativeWords: [],
  negativeCoreWords: [],
  positiveAlternativesForNegativeWords: {},
  finalMoodWords: [],
  interactionLog: {
    stageSummaries: {},
    dwellEvents: [],
    choiceEvents: [],
  },
};

function withoutRemoved(words, removed) {
  return words.filter((word) => !removed.includes(word));
}

function deriveState(state) {
  const positive15 = withoutRemoved(state.selectedPositiveWords, state.removedPositiveRound1);
  const positive10 = withoutRemoved(positive15, state.removedPositiveRound2);
  const positiveCoreWords = withoutRemoved(positive10, state.removedPositiveRound3);
  const negativeCoreWords = withoutRemoved(state.selectedNegativeWords, state.removedNegativeWords);
  return { positive15, positive10, positiveCoreWords, negativeCoreWords };
}

function pruneObject(object, allowedKeys) {
  return Object.fromEntries(Object.entries(object).filter(([key]) => allowedKeys.includes(key)));
}

export default function App() {
  const [state, setState] = useState(() => loadSavedState() || initialState);
  const [toast, setToast] = useState('');
  const stageStartRef = useRef(Date.now());
  const firstActionRef = useRef(null);
  const derived = useMemo(() => deriveState(state), [state]);
  const hasSaved = Boolean(loadSavedState()?.currentStep >= 0);

  useEffect(() => {
    stageStartRef.current = Date.now();
    firstActionRef.current = null;
  }, [state.currentStep]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Derived arrays are stored as requested state fields so copied JSON stays explicit.
  useEffect(() => {
    setState((prev) => {
      const nextAlternatives = pruneObject(prev.positiveAlternativesForNegativeWords, derived.negativeCoreWords);
      const finalPool = [...new Set([...derived.positiveCoreWords, ...Object.values(nextAlternatives).filter(Boolean)])];
      return {
        ...prev,
        positiveCoreWords: derived.positiveCoreWords,
        negativeCoreWords: derived.negativeCoreWords,
        positiveAlternativesForNegativeWords: nextAlternatives,
        finalMoodWords: prev.finalMoodWords.filter((word) => finalPool.includes(word)),
      };
    });
  }, [derived.positiveCoreWords.join('|'), derived.negativeCoreWords.join('|')]);

  function update(partial) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  function updateNested(group, key, value) {
    setState((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  }

  function currentStageKey(step = state.currentStep) {
    return STAGE_KEYS[step] || `step_${step}`;
  }

  function markFirstAction() {
    if (firstActionRef.current === null) {
      firstActionRef.current = Date.now() - stageStartRef.current;
    }
  }

  function recordChoiceEvent(word, action, extra = {}) {
    markFirstAction();
    const event = {
      stage: currentStageKey(),
      word,
      action,
      elapsedMs: Date.now() - stageStartRef.current,
      timestamp: new Date().toISOString(),
      ...extra,
    };
    setState((prev) => ({
      ...prev,
      interactionLog: {
        ...prev.interactionLog,
        choiceEvents: [...prev.interactionLog.choiceEvents, event].slice(-500),
      },
    }));
  }

  function recordDwell(word, durationMs, extra = {}) {
    if (durationMs < 150) return;
    const event = {
      stage: currentStageKey(),
      word,
      durationMs: Math.round(durationMs),
      timestamp: new Date().toISOString(),
      ...extra,
    };
    setState((prev) => ({
      ...prev,
      interactionLog: {
        ...prev.interactionLog,
        dwellEvents: [...prev.interactionLog.dwellEvents, event].slice(-500),
      },
    }));
  }

  function finalizeCurrentStage(step = state.currentStep) {
    if (step < 0 || step >= TOTAL_STEPS - 1) return;
    const stage = currentStageKey(step);
    const durationMs = Date.now() - stageStartRef.current;
    setState((prev) => {
      const stageEvents = prev.interactionLog.choiceEvents.filter((event) => event.stage === stage);
      const stageDwells = prev.interactionLog.dwellEvents.filter((event) => event.stage === stage);
      const dwellTotalMs = stageDwells.reduce((sum, event) => sum + event.durationMs, 0);
      return {
        ...prev,
        interactionLog: {
          ...prev.interactionLog,
          stageSummaries: {
            ...prev.interactionLog.stageSummaries,
            [stage]: {
              stage,
              durationMs: Math.round(durationMs),
              firstActionDelayMs: firstActionRef.current === null ? null : Math.round(firstActionRef.current),
              choiceEventCount: stageEvents.length,
              dwellEventCount: stageDwells.length,
              dwellTotalMs: Math.round(dwellTotalMs),
            },
          },
        },
      };
    });
  }

  function startFresh() {
    const encouragementMessage = state.encouragementMessage || '';
    clearSavedState();
    stageStartRef.current = Date.now();
    firstActionRef.current = null;
    setState({ ...initialState, encouragementMessage, currentStep: 0 });
  }

  function continueSaved() {
    setState((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep) }));
  }

  function restart() {
    startFresh();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextStep() {
    finalizeCurrentStage();
    setState((prev) => ({ ...prev, currentStep: Math.min(TOTAL_STEPS - 1, prev.currentStep + 1) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function prevStep() {
    setState((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setToast('복사되었습니다');
  }

  const finalPool = useMemo(
    () => [...new Set([...state.positiveCoreWords, ...Object.values(state.positiveAlternativesForNegativeWords).filter(Boolean)])],
    [state.positiveCoreWords, state.positiveAlternativesForNegativeWords],
  );

  const canNext = (() => {
    switch (state.currentStep) {
      case 0:
        return true;
      case 1:
        return state.selectedPositiveWords.length === 20;
      case 2:
        return state.removedPositiveRound1.length === 5;
      case 3:
        return state.removedPositiveRound2.length === 5;
      case 4:
        return state.removedPositiveRound3.length === 5;
      case 5:
        return state.selectedNegativeWords.length === 10;
      case 6:
        return state.removedNegativeWords.length === 5;
      case 7:
        return state.negativeCoreWords.every((word) => state.positiveAlternativesForNegativeWords[word]?.trim());
      case 8:
        return state.finalMoodWords.length === 5;
      default:
        return false;
    }
  })();

  if (state.currentStep < 0) {
    return (
      <>
        <Intro
          encouragementMessage={state.encouragementMessage}
          hasSaved={hasSaved}
          onContinue={continueSaved}
          onEncouragementChange={(encouragementMessage) => update({ encouragementMessage })}
          onStart={startFresh}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  if (state.currentStep === TOTAL_STEPS - 1) {
    return (
      <>
        <ResultPage state={state} onCopy={copyText} onRestart={restart} />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  const stepProps = {
    current: state.currentStep,
    total: TOTAL_STEPS,
    canNext,
    onPrev: prevStep,
    onNext: nextStep,
    hidePrev: state.currentStep === 0,
  };

  const screens = [
    <StepLayout {...stepProps} eyebrow="Planning Questions" title={PLANNING_QUESTIONS.title} description="함께 준비하는 8명이 전시의 이유, 말하고 싶은 것, 관객을 짧게 정리합니다.">
      <QuestionStep group={PLANNING_QUESTIONS} value={state.planningAnswers} onChange={(key, value) => updateNested('planningAnswers', key, value)} />
    </StepLayout>,
    <StepLayout {...stepProps} eyebrow="Positive Mood" title="이번 전시에서 가져가고 싶은 무드 20개를 선택합니다" description="좋아 보이는 말보다, 이번 전시에 실제로 필요한 분위기를 고릅니다.">
      <WordSelectStep
        words={POSITIVE_WORDS}
        selected={state.selectedPositiveWords}
        onChange={(selectedPositiveWords) => update({
            selectedPositiveWords,
            removedPositiveRound1: [],
            removedPositiveRound2: [],
            removedPositiveRound3: [],
            finalMoodWords: [],
          })}
        onToggle={recordChoiceEvent}
        onDwell={recordDwell}
        limit={20}
      />
    </StepLayout>,
    <StepLayout {...stepProps} eyebrow="Remove 20 -> 15" title="20개 중 5개를 내려놓습니다" description="좋지만 덜 중요한 단어를 제거해 전시의 중심을 선명하게 만듭니다.">
      <WordRemoveStep words={state.selectedPositiveWords} removed={state.removedPositiveRound1} onChange={(removedPositiveRound1) => update({ removedPositiveRound1 })} onToggle={recordChoiceEvent} onDwell={recordDwell} limit={5} remainingLabel="15개를" />
    </StepLayout>,
    <StepLayout {...stepProps} eyebrow="Remove 15 -> 10" title="15개 중 5개를 더 내려놓습니다" description="비슷한 단어 사이의 미세한 차이를 보며 우선순위를 정합니다.">
      <WordRemoveStep words={derived.positive15} removed={state.removedPositiveRound2} onChange={(removedPositiveRound2) => update({ removedPositiveRound2 })} onToggle={recordChoiceEvent} onDwell={recordDwell} limit={5} remainingLabel="10개를" />
    </StepLayout>,
    <StepLayout {...stepProps} eyebrow="Remove 10 -> 5" title="전시의 긍정 핵심 키워드 5개를 남깁니다" description="마지막 제거 단계입니다. 남은 단어는 전시가 붙잡을 중심 무드가 됩니다.">
      <WordRemoveStep words={derived.positive10} removed={state.removedPositiveRound3} onChange={(removedPositiveRound3) => update({ removedPositiveRound3 })} onToggle={recordChoiceEvent} onDwell={recordDwell} limit={5} remainingLabel="핵심 5개를" />
    </StepLayout>,
    <StepLayout {...stepProps} eyebrow="Risk Mood" title="피하고 싶은 무드 10개를 선택합니다" description="전시가 빠지기 쉬운 위험, 관객에게 남기고 싶지 않은 인상을 골라봅니다.">
      <WordSelectStep
        words={NEGATIVE_WORDS}
        selected={state.selectedNegativeWords}
        onChange={(selectedNegativeWords) => update({
          selectedNegativeWords,
          removedNegativeWords: [],
          positiveAlternativesForNegativeWords: {},
          finalMoodWords: [],
        })}
        onToggle={recordChoiceEvent}
        onDwell={recordDwell}
        limit={10}
        tone="negative"
      />
    </StepLayout>,
    <StepLayout {...stepProps} eyebrow="Remove Risk" title="부정 무드 10개 중 5개를 남깁니다" description="가장 경계해야 할 위험 5개가 남도록 덜 중요한 단어를 제거합니다.">
      <WordRemoveStep words={state.selectedNegativeWords} removed={state.removedNegativeWords} onChange={(removedNegativeWords) => update({ removedNegativeWords })} onToggle={recordChoiceEvent} onDwell={recordDwell} limit={5} remainingLabel="부정 핵심 5개를" />
    </StepLayout>,
    <StepLayout {...stepProps} eyebrow="Convert" title="부정 핵심 단어마다 긍정 방향을 정합니다" description="피하고 싶은 방향을 넘어서기 위해 전시가 선택할 구체적인 태도를 만듭니다.">
      <PositiveAlternativeStep
        negativeWords={state.negativeCoreWords}
        value={state.positiveAlternativesForNegativeWords}
        onChange={(negative, positive, action = 'set_alternative') => {
          if (action !== 'type_alternative' || !state.positiveAlternativesForNegativeWords[negative]) {
            recordChoiceEvent(positive, action, { negative });
          }
          updateNested('positiveAlternativesForNegativeWords', negative, positive);
        }}
        onDwell={recordDwell}
      />
    </StepLayout>,
    <StepLayout {...stepProps} eyebrow="Final Mood" title="최종 전시 무드 키워드 5개를 선택합니다" description={`긍정 핵심과 전환 방향을 합친 ${finalPool.length}개 후보 중 최종 5개를 남깁니다.`} nextLabel="결과 보기">
      <FinalSelectStep words={finalPool} selected={state.finalMoodWords} onChange={(finalMoodWords) => update({ finalMoodWords })} onToggle={recordChoiceEvent} onDwell={recordDwell} />
    </StepLayout>,
  ];

  return (
    <>
      {screens[state.currentStep]}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
