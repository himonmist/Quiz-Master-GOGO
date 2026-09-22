"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
}
interface Category {
  id: string;
  name: string;
}

type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";

export function NewQuestionForm({ courses, categories }: { courses: Course[]; categories: Category[] }) {
  const router = useRouter();
  const [type, setType] = useState<QuestionType>("SINGLE_CHOICE");
  const [text, setText] = useState("");
  const [courseId, setCourseId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [marks, setMarks] = useState(10);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(20);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setOptionText(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, text: value } : o)));
  }
  function setOptionCorrect(i: number) {
    setOptions((prev) =>
      prev.map((o, idx) => (type === "MULTIPLE_CHOICE" ? (idx === i ? { ...o, isCorrect: !o.isCorrect } : o) : { ...o, isCorrect: idx === i }))
    );
  }
  function addOption() {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, { text: "", isCorrect: false }]);
  }
  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onTypeChange(next: QuestionType) {
    setType(next);
    if (next === "TRUE_FALSE") {
      setOptions([
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false },
      ]);
    }
  }

  async function onSubmit() {
    setError(null);
    if (text.trim().length < 3) return setError("Enter the question text");
    const filledOptions = options.filter((o) => o.text.trim().length > 0);
    if (filledOptions.length < 2) return setError("Add at least two answer options");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          text,
          courseId,
          categoryId,
          difficulty,
          marks,
          timeLimitSeconds,
          negativeMarks,
          explanation,
          tags: [],
          options: filledOptions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create question");
        return;
      }
      router.push("/admin/questions");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card elev-sm" style={{ padding: 22, gap: 12, maxWidth: 680 }}>
      <div className="field">
        <label htmlFor="type">Question type</label>
        <select id="type" className="input" value={type} onChange={(e) => onTypeChange(e.target.value as QuestionType)}>
          <option value="SINGLE_CHOICE">Multiple choice — single answer</option>
          <option value="MULTIPLE_CHOICE">Multiple choice — multiple answers</option>
          <option value="TRUE_FALSE">True / False</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="text">Question text</label>
        <textarea id="text" className="input" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label>Answer options {type !== "MULTIPLE_CHOICE" ? "(select the correct one)" : "(select all correct ones)"}</label>
        {options.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type={type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
              name="correct-option"
              checked={opt.isCorrect}
              onChange={() => setOptionCorrect(i)}
            />
            <input
              className="input"
              placeholder={`Option ${i + 1}`}
              value={opt.text}
              onChange={(e) => setOptionText(i, e.target.value)}
              disabled={type === "TRUE_FALSE"}
            />
            {type !== "TRUE_FALSE" && options.length > 2 ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeOption(i)}>
                ✕
              </button>
            ) : null}
          </div>
        ))}
        {type !== "TRUE_FALSE" && options.length < 6 ? (
          <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} onClick={addOption}>
            + Add option
          </button>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="field">
          <label htmlFor="courseId">Course</label>
          <select id="courseId" className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Unassigned</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="categoryId">Category</label>
          <select id="categoryId" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="difficulty">Difficulty</label>
          <select id="difficulty" className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="marks">Marks</label>
          <input id="marks" type="number" min={1} className="input" value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="timeLimitSeconds">Time limit (sec)</label>
          <input id="timeLimitSeconds" type="number" min={5} className="input" value={timeLimitSeconds} onChange={(e) => setTimeLimitSeconds(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="negativeMarks">Negative marks</label>
          <input id="negativeMarks" type="number" min={0} className="input" value={negativeMarks} onChange={(e) => setNegativeMarks(Number(e.target.value))} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="explanation">Explanation (shown in result review)</label>
        <textarea id="explanation" className="input" rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </div>

      {error ? <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{error}</p> : null}
      <button className="btn btn-primary" onClick={onSubmit} disabled={loading} style={{ alignSelf: "flex-start" }}>
        {loading ? "Saving…" : "Save question"}
      </button>
    </div>
  );
}
