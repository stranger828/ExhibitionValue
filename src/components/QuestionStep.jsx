export default function QuestionStep({ group, value, onChange }) {
  return (
    <div className="question-list">
      {group.fields.map(([key, label]) => (
        <label className="field question" key={key}>
          <span>{label}</span>
          <textarea
            value={value[key] || ''}
            onChange={(event) => onChange(key, event.target.value)}
            rows={5}
            placeholder="회의에서 나온 문장, 단어, 아직 덜 정리된 생각을 그대로 적어도 좋습니다."
          />
        </label>
      ))}
    </div>
  );
}
