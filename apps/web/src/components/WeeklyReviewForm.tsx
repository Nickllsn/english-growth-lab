import { type FormEvent, useState } from "react";
import {
  saveReview,
  type StoredReview,
  type WeeklyReviewInput
} from "../api/client";

interface WeeklyReviewFormProps {
  onSaved: (review: StoredReview) => void;
}

function currentIsoWeek(): string {
  const date = new Date();
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - start.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const initialReview = (): WeeklyReviewInput => ({
  week: currentIsoWeek(),
  theme: "",
  materials: [{ title: "", url: "" }],
  technicalPerspective: "",
  businessPerspective: "",
  myView: "",
  reusedExpressions: [""],
  nextWeek: ""
});

export function WeeklyReviewForm({ onSaved }: WeeklyReviewFormProps) {
  const [review, setReview] = useState(initialReview);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    try {
      const saved = await saveReview(review.week, {
        ...review,
        materials: review.materials.filter(({ title, url }) => title && url),
        reusedExpressions: review.reusedExpressions.filter(Boolean)
      });
      onSaved(saved);
      setMessage("本周复盘已保存");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "本周复盘保存失败");
    }
  };

  return (
    <details className="panel review-form-panel">
      <summary>创建本周英文复盘</summary>
      <form className="review-form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            ISO 周
            <input
              pattern="\d{4}-W\d{2}"
              value={review.week}
              onChange={(event) => setReview({ ...review, week: event.target.value })}
              required
            />
          </label>
          <label>
            本周主题
            <input
              value={review.theme}
              onChange={(event) => setReview({ ...review, theme: event.target.value })}
              required
            />
          </label>
          <label>
            材料标题
            <input
              value={review.materials[0]?.title ?? ""}
              onChange={(event) =>
                setReview({
                  ...review,
                  materials: [{ ...review.materials[0], title: event.target.value, url: review.materials[0]?.url ?? "" }]
                })
              }
              required
            />
          </label>
          <label>
            材料链接
            <input
              type="url"
              value={review.materials[0]?.url ?? ""}
              onChange={(event) =>
                setReview({
                  ...review,
                  materials: [{ ...review.materials[0], title: review.materials[0]?.title ?? "", url: event.target.value }]
                })
              }
              required
            />
          </label>
        </div>
        <label>
          技术视角
          <textarea
            value={review.technicalPerspective}
            onChange={(event) =>
              setReview({ ...review, technicalPerspective: event.target.value })
            }
            required
          />
        </label>
        <label>
          商业或社会视角
          <textarea
            value={review.businessPerspective}
            onChange={(event) =>
              setReview({ ...review, businessPerspective: event.target.value })
            }
            required
          />
        </label>
        <label>
          我的英文观点
          <textarea
            value={review.myView}
            onChange={(event) => setReview({ ...review, myView: event.target.value })}
            required
          />
        </label>
        <label>
          本周复用表达
          <input
            value={review.reusedExpressions[0] ?? ""}
            onChange={(event) =>
              setReview({ ...review, reusedExpressions: [event.target.value] })
            }
            required
          />
        </label>
        <label>
          下周调整
          <textarea
            value={review.nextWeek}
            onChange={(event) => setReview({ ...review, nextWeek: event.target.value })}
            required
          />
        </label>
        {message && <p role="status">{message}</p>}
        <button className="primary-button" type="submit">
          保存本周复盘
        </button>
      </form>
    </details>
  );
}
