"use client";

import { useState } from "react";

interface ReviewItem {
  questionId: string;
  text: string;
  yourAnswer: string[];
  correctAnswer: string[];
  options: { id: string; text: string }[];
  isCorrect: boolean;
  questionScore: number;
  responseTimeMs: number;
  explanation: string | null;
}

export function ResultReview({ review }: { review?: ReviewItem[] }) {
  const [open, setOpen] = useState(false);

  if (!review || review.length === 0) {
    return (
      <p className="text-muted" style={{ fontSize: 13, textAlign: "center" }}>
        Detailed answer review isn&apos;t available for this quiz.
      </p>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <button className="btn btn-primary btn-block" style={{ fontSize: 15, padding: 13 }} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide Detailed Result" : "View Detailed Result →"}
      </button>
      {open ? (
        <div style={{ display: "grid", gap: 10, marginTop: 16, textAlign: "left" }}>
          {review.map((item, i) => (
            <div key={item.questionId} className="card elev-sm" style={{ padding: 16, gap: 6 }}>
              <div className="card-kicker">Question {i + 1}</div>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{item.text}</p>
              <div style={{ display: "grid", gap: 4 }}>
                {item.options.map((opt) => {
                  const wasSelected = item.yourAnswer.includes(opt.id);
                  const isCorrectOption = item.correctAnswer.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      style={{
                        fontSize: 13,
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: isCorrectOption
                          ? "var(--color-accent-2-100)"
                          : wasSelected
                            ? "#fbe4df"
                            : "transparent",
                      }}
                    >
                      {isCorrectOption ? "✓ " : wasSelected ? "✗ " : "— "}
                      {opt.text}
                    </div>
                  );
                })}
              </div>
              {item.explanation ? (
                <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {item.explanation}
                </p>
              ) : null}
              <div className="card-meta">
                {item.isCorrect ? "Correct" : "Incorrect"} · {Math.round(item.questionScore)} pts · {(item.responseTimeMs / 1000).toFixed(1)}s
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
