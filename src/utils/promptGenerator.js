function list(values) {
  return values?.length ? values.join(', ') : '미입력';
}

function block(values) {
  return Object.values(values || {}).filter(Boolean).join('\n\n') || '미입력';
}

function seconds(ms) {
  if (ms === null || ms === undefined) return '없음';
  return `${Math.round(ms / 100) / 10}초`;
}

function summarizeInteractions(interactionLog) {
  if (!interactionLog) return '기록 없음';

  const stageLines = Object.values(interactionLog.stageSummaries || {})
    .map((stage) => (
      `- ${stage.stage}: 전체 ${seconds(stage.durationMs)}, 첫 행동까지 ${seconds(stage.firstActionDelayMs)}, 선택/변경 ${stage.choiceEventCount}회, 머문 기록 ${stage.dwellEventCount}회`
    ));

  const dwellByWord = {};
  (interactionLog.dwellEvents || []).forEach((event) => {
    const key = `${event.stage}:${event.word}`;
    dwellByWord[key] ||= { stage: event.stage, word: event.word, durationMs: 0, count: 0 };
    dwellByWord[key].durationMs += event.durationMs;
    dwellByWord[key].count += 1;
  });

  const dwellLines = Object.values(dwellByWord)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 12)
    .map((item) => `- ${item.stage} / ${item.word}: ${seconds(item.durationMs)} (${item.count}회 머묾)`);

  return [
    '[단계별 소요/주저 참고]',
    stageLines.length ? stageLines.join('\n') : '기록 없음',
    '',
    '[오래 머문 키워드 참고]',
    dwellLines.length ? dwellLines.join('\n') : '기록 없음',
  ].join('\n');
}

export function buildResultData(state) {
  return {
    planningAnswers: state.planningAnswers,
    positiveCoreWords: state.positiveCoreWords,
    negativeCoreWords: state.negativeCoreWords,
    positiveAlternativesForNegativeWords: state.positiveAlternativesForNegativeWords,
    finalMoodWords: state.finalMoodWords,
    interactionLog: state.interactionLog,
  };
}

export function generatePrompt(state) {
  const pairs = Object.entries(state.positiveAlternativesForNegativeWords || {})
    .map(([negative, positive]) => `- ${negative} -> ${positive}`)
    .join('\n') || '미입력';

  return `다음은 함께 전시를 준비하는 8명이 선택한 전시 무드, 관객 상상, 피하고 싶은 방향에 대한 데이터이다.

너는 전시기획자이자 큐레이터의 관점에서 이 데이터를 분석해줘.

분석 목표는 다음과 같다.

1. 참여자들이 공통적으로 추구하는 전시 방향을 찾아줘.
2. 서로 충돌하거나 긴장관계에 있는 키워드를 찾아줘.
3. 긍정 키워드와 부정 키워드를 바탕으로 이번 전시가 피해야 할 위험을 정리해줘.
4. 전체 전시의 주제, 테마, 컨셉, 무드를 각각 제안해줘.
5. 관객 타겟을 구체적으로 설정해줘.
6. 전시 제목 후보를 10개 제안해줘.
7. 전시 소개문을 3가지 톤으로 작성해줘.
   - 진지한 톤
   - 감각적인 톤
   - 짧고 인상적인 홍보문 톤
8. 전시 공간, 그래픽, 포스터, 리플렛, SNS 홍보물에서 어떤 시각적 방향을 잡으면 좋을지 제안해줘.
9. 최종적으로 이 전시가 관객에게 어떤 경험으로 남아야 하는지 한 문장으로 정리해줘.

[입력 데이터]

전시를 함께 상상하기 위한 단답 질문:
${block(state.planningAnswers)}

긍정 핵심 키워드:
${list(state.positiveCoreWords)}

부정 핵심 키워드:
${list(state.negativeCoreWords)}

부정 키워드에 대응하는 긍정 방향:
${pairs}

최종 선택된 전시 무드 키워드:
${list(state.finalMoodWords)}

상호작용 참고 데이터:
아래 데이터는 심리 진단이 아니라, 어떤 단계나 키워드에서 더 오래 머물렀는지 참고하기 위한 보조 정보입니다.
${summarizeInteractions(state.interactionLog)}

[분석 요청]

위 데이터를 바탕으로 이번 전시의 기획 방향을 분석해줘.
단, 너무 추상적인 말로만 정리하지 말고 실제 전시기획 회의에서 사용할 수 있도록 구체적으로 써줘.
특히 "좋다/나쁘다"보다 "어떤 관객 경험을 만들 것인가"를 중심으로 설명해줘.`;
}
