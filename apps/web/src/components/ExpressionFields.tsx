import type { Expression } from "../api/client";

interface ExpressionFieldsProps {
  expressions: Expression[];
  onChange: (expressions: Expression[]) => void;
}

export function ExpressionFields({
  expressions,
  onChange
}: ExpressionFieldsProps) {
  const update = (index: number, patch: Partial<Expression>) => {
    onChange(
      expressions.map((expression, expressionIndex) =>
        expressionIndex === index ? { ...expression, ...patch } : expression
      )
    );
  };

  return (
    <fieldset className="expression-list">
      <legend>可复用表达</legend>
      {expressions.map((expression, index) => (
        <div className="expression-row" key={index}>
          <label>
            英文表达 {index + 1}
            <input
              value={expression.text}
              onChange={(event) => update(index, { text: event.target.value })}
            />
          </label>
          <label>
            中文含义 {index + 1}
            <input
              value={expression.meaning}
              onChange={(event) =>
                update(index, { meaning: event.target.value })
              }
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={expression.usedInSummary}
              onChange={(event) =>
                update(index, { usedInSummary: event.target.checked })
              }
            />
            已在总结中复用
          </label>
        </div>
      ))}
      <button
        className="secondary-button"
        type="button"
        onClick={() =>
          onChange([
            ...expressions,
            { text: "", meaning: "", usedInSummary: false }
          ])
        }
      >
        添加表达
      </button>
    </fieldset>
  );
}
