"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
}
interface QuestionRow {
  id: string;
  text: string;
  difficulty: string;
  marks: number;
}

export function NewQuizForm({ courses, questions }: { courses: Course[]; questions: QuestionRow[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [perQuestionTimeSeconds, setPerQuestionTimeSeconds] = useState(20);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [passingScore, setPassingScore] = useState(0);
  const [mode, setMode] = useState<"PRACTICE" | "COMPETITION">("COMPETITION");
  const [competitionMode, setCompetitionMode] = useState<"STANDARD" | "LIVE_COMPETITION" | "TIME_ATTACK" | "CERTIFICATION_EXAM">("LIVE_COMPETITION");
  const [randomQuestionOrder, setRandomQuestionOrder] = useState(true);
  const [randomAnswerOrder, setRandomAnswerOrder] = useState(true);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [speedBonusEnabled, setSpeedBonusEnabled] = useState(true);
  const [difficultyWeightingEnabled, setDifficultyWeightingEnabled] = useState(false);
  const [accuracyWeightPercent, setAccuracyWeightPercent] = useState(80);
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);
  const [resultVisibility, setResultVisibility] = useState<"IMMEDIATE" | "AFTER_QUIZ" | "AFTER_COMPETITION" | "NEVER">("AFTER_QUIZ");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const speedWeightPercent = 100 - accuracyWeightPercent;

  const filtered = useMemo(
    () => questions.filter((q) => q.text.toLowerCase().includes(search.toLowerCase())),
    [questions, search]
  );

  function toggleQuestion(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit() {
    setError(null);
    if (!courseId) return setError("Select a course");
    if (selectedIds.length === 0) return setError("Select at least one question");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          courseId,
          difficulty,
          numQuestions: selectedIds.length,
          perQuestionTimeSeconds,
          startAt: startAt ? new Date(startAt).toISOString() : "",
          endAt: endAt ? new Date(endAt).toISOString() : "",
          attemptLimit,
          passingScore,
          mode,
          competitionMode,
          randomQuestionOrder,
          randomAnswerOrder,
          negativeMarking,
          speedBonusEnabled,
          difficultyWeightingEnabled,
          accuracyWeightPercent,
          speedWeightPercent,
          leaderboardVisible,
          resultVisibility,
          questionIds: selectedIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create quiz");
        return;
      }
      router.push("/admin/quizzes");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
      <div className="card elev-sm" style={{ padding: 22, gap: 12 }}>
        <div className="card-title">Details</div>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field">
            <label htmlFor="courseId">Course</label>
            <select id="courseId" className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
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
            <label htmlFor="perQuestionTimeSeconds">Time per question (sec)</label>
            <input id="perQuestionTimeSeconds" type="number" min={5} className="input" value={perQuestionTimeSeconds} onChange={(e) => setPerQuestionTimeSeconds(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="attemptLimit">Attempt limit</label>
            <input id="attemptLimit" type="number" min={1} className="input" value={attemptLimit} onChange={(e) => setAttemptLimit(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="startAt">Start</label>
            <input id="startAt" type="datetime-local" className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="endAt">End</label>
            <input id="endAt" type="datetime-local" className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="passingScore">Passing score</label>
            <input id="passingScore" type="number" min={0} className="input" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="mode">Mode</label>
            <select id="mode" className="input" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              <option value="PRACTICE">Practice (no ranking)</option>
              <option value="COMPETITION">Competition</option>
            </select>
          </div>
        </div>

        {mode === "COMPETITION" ? (
          <div className="field">
            <label htmlFor="competitionMode">Competition mode</label>
            <select id="competitionMode" className="input" value={competitionMode} onChange={(e) => setCompetitionMode(e.target.value as typeof competitionMode)}>
              <option value="STANDARD">Standard</option>
              <option value="LIVE_COMPETITION">Live competition</option>
              <option value="TIME_ATTACK">Time attack</option>
              <option value="CERTIFICATION_EXAM">Certification exam</option>
            </select>
          </div>
        ) : null}

        <div className="card-title" style={{ marginTop: 8 }}>Scoring</div>
        <div className="field">
          <label htmlFor="accuracyWeightPercent">
            Accuracy weight: {accuracyWeightPercent}% · Speed weight: {speedWeightPercent}%
          </label>
          <input
            id="accuracyWeightPercent"
            type="range"
            min={70}
            max={95}
            value={accuracyWeightPercent}
            onChange={(e) => setAccuracyWeightPercent(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <p className="hint">Kept within 70–95% so speed can never overpower correctness.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <label className="checkbox">
            <input type="checkbox" checked={randomQuestionOrder} onChange={(e) => setRandomQuestionOrder(e.target.checked)} />
            <span className="box">{randomQuestionOrder ? "✓" : ""}</span> Randomize question order
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={randomAnswerOrder} onChange={(e) => setRandomAnswerOrder(e.target.checked)} />
            <span className="box">{randomAnswerOrder ? "✓" : ""}</span> Randomize answer order
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={speedBonusEnabled} onChange={(e) => setSpeedBonusEnabled(e.target.checked)} />
            <span className="box">{speedBonusEnabled ? "✓" : ""}</span> Speed bonus enabled
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={difficultyWeightingEnabled} onChange={(e) => setDifficultyWeightingEnabled(e.target.checked)} />
            <span className="box">{difficultyWeightingEnabled ? "✓" : ""}</span> Difficulty weighting
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={negativeMarking} onChange={(e) => setNegativeMarking(e.target.checked)} />
            <span className="box">{negativeMarking ? "✓" : ""}</span> Negative marking
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={leaderboardVisible} onChange={(e) => setLeaderboardVisible(e.target.checked)} />
            <span className="box">{leaderboardVisible ? "✓" : ""}</span> Leaderboard visible
          </label>
        </div>

        <div className="field">
          <label htmlFor="resultVisibility">Reveal correct answers</label>
          <select id="resultVisibility" className="input" value={resultVisibility} onChange={(e) => setResultVisibility(e.target.value as typeof resultVisibility)}>
            <option value="IMMEDIATE">Immediately after each question</option>
            <option value="AFTER_QUIZ">After the quiz ends</option>
            <option value="AFTER_COMPETITION">After the competition ends</option>
            <option value="NEVER">Never</option>
          </select>
        </div>

        {error ? <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{error}</p> : null}
        <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>
          {loading ? "Creating…" : `Create quiz with ${selectedIds.length} question(s)`}
        </button>
      </div>

      <div className="card elev-sm" style={{ padding: 20, gap: 10, maxHeight: 640, overflow: "auto" }}>
        <div className="card-title">Question bank ({selectedIds.length} selected)</div>
        <input className="input" placeholder="Search questions…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div style={{ display: "grid", gap: 6 }}>
          {filtered.map((q) => (
            <label key={q.id} className="checkbox" style={{ alignItems: "flex-start", fontSize: 13, padding: "6px 4px" }}>
              <input type="checkbox" checked={selectedIds.includes(q.id)} onChange={() => toggleQuestion(q.id)} />
              <span className="box" style={{ marginTop: 2 }}>
                {selectedIds.includes(q.id) ? "✓" : ""}
              </span>
              <span>
                {q.text} <span className="text-muted">· {q.difficulty} · {q.marks} pts</span>
              </span>
            </label>
          ))}
          {filtered.length === 0 ? <p className="text-muted">No questions match. Add some in the Question Bank first.</p> : null}
        </div>
      </div>
    </div>
  );
}
