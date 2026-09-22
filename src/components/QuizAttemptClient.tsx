"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface QuestionView {
  status: "question" | "completed";
  quizTitle: string;
  questionNumber: number;
  totalQuestions: number;
  score: number;
  questionId?: string;
  text?: string;
  imageUrl?: string | null;
  type?: string;
  options?: { id: string; text: string }[];
  serverNowMs?: number;
  deadlineMs?: number;
}

interface AnswerResult {
  isCorrect: boolean;
  questionScore: number;
  baseScore: number;
  speedScore: number;
  totalScore: number;
  correctOptionIds?: string[];
  attemptCompleted: boolean;
}

function reportSuspiciousEvent(attemptId: string, type: string) {
  fetch(`/api/attempts/${attemptId}/suspicious-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
    keepalive: true,
  }).catch(() => undefined);
}

export function QuizAttemptClient({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [view, setView] = useState<QuestionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [rank, setRank] = useState<number | null>(null);

  const clockOffsetRef = useRef(0);
  const deadlineRef = useRef(0);
  const lockedRef = useRef(false);

  const loadQuestion = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/question`);
      const data: QuestionView & { error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load the question");
        return;
      }
      if (data.status === "completed") {
        router.push(`/quiz/attempt/${attemptId}/result`);
        return;
      }
      setView(data);
      setSelected([]);
      setLocked(false);
      lockedRef.current = false;
      setFeedback(null);
      if (data.serverNowMs && data.deadlineMs) {
        clockOffsetRef.current = data.serverNowMs - Date.now();
        deadlineRef.current = data.deadlineMs;
        setRemainingMs(Math.max(0, data.deadlineMs - data.serverNowMs));
      }
    } catch {
      setError("Could not reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const submit = useCallback(
    async (optionIds: string[]) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      setLocked(true);
      try {
        const res = await fetch(`/api/attempts/${attemptId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedOptionIds: optionIds }),
        });
        const data: AnswerResult & { error?: string } = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Answer submission failed. Please try again.");
          lockedRef.current = false;
          setLocked(false);
          return;
        }
        setFeedback(data);
      } catch {
        setError("Answer submission failed. Please try again.");
        lockedRef.current = false;
        setLocked(false);
      }
    },
    [attemptId]
  );

  // Server-authoritative countdown display: computed from the server's
  // deadline + a one-time clock-offset correction, not a client-owned timer.
  useEffect(() => {
    if (!view || view.status !== "question") return;
    const interval = setInterval(() => {
      const now = Date.now() + clockOffsetRef.current;
      const remaining = Math.max(0, deadlineRef.current - now);
      setRemainingMs(remaining);
      if (remaining <= 0 && !lockedRef.current) {
        submit(selected);
      }
    }, 200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, submit]);

  // Light-weight live rank while taking the quiz.
  useEffect(() => {
    if (!view || view.status !== "question") return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/leaderboard`);
        const data = await res.json();
        if (!cancelled && data.visible) setRank(data.yourRank ?? null);
      } catch {
        // rank display is best-effort
      }
    };
    poll();
    const interval = setInterval(poll, 6000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [attemptId, view]);

  // Anti-cheat: flag tab switches / window blur / copy-paste for admin review.
  // Never blocks or disqualifies on its own (spec §16).
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) reportSuspiciousEvent(attemptId, "TAB_SWITCH");
    };
    const onBlur = () => reportSuspiciousEvent(attemptId, "WINDOW_BLUR");
    const onCopy = () => reportSuspiciousEvent(attemptId, "COPY_ATTEMPT");
    const onPaste = () => reportSuspiciousEvent(attemptId, "PASTE_ATTEMPT");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [attemptId]);

  function toggleOption(optionId: string) {
    if (locked || !view?.type) return;
    if (view.type === "MULTIPLE_CHOICE") {
      setSelected((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
    } else {
      setSelected([optionId]);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-muted">Loading your quiz…</p>
      </div>
    );
  }

  if (error && !view) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="card elev-md" style={{ padding: 32, textAlign: "center", gap: 12 }}>
          <p style={{ color: "var(--color-danger)" }}>{error}</p>
          <button className="btn btn-primary" onClick={loadQuestion}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!view || view.status !== "question") return null;

  const seconds = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", background: "var(--color-neutral-900)", color: "var(--color-bg)" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, letterSpacing: "0.03em" }}>QUIZ MASTER GOGO</div>
        <button
          onClick={() => {
            if (confirm("Exit the quiz? Your progress so far is saved.")) router.push("/dashboard");
          }}
          style={{ color: "var(--color-bg)", opacity: 0.7, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}
        >
          Exit quiz
        </button>
      </div>

      <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ marginBottom: 2 }}>{view.quizTitle}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span className="tag tag-neutral">
            Question {view.questionNumber} of {view.totalQuestions}
          </span>
          <span className="tag tag-accent-2">Score: {Math.round(view.score)}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>
          <div className="card elev-md" style={{ padding: "28px 30px", gap: 16 }}>
            {!feedback ? (
              <>
                <h3 style={{ marginBottom: 4 }}>{view.text}</h3>
                {view.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-supplied URL, outside next/image's remote-pattern allowlist
                  <img src={view.imageUrl} alt="" className="washed" style={{ borderRadius: 16, marginBottom: 8 }} />
                ) : null}
                {(view.options ?? []).map((opt, i) => {
                  const isSelected = selected.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className="option-btn"
                      data-selected={isSelected}
                      onClick={() => toggleOption(opt.id)}
                      disabled={locked}
                    >
                      <span className="option-badge">{letters[i] ?? i + 1}</span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
                {error ? (
                  <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13 }}>
                    {error}
                  </p>
                ) : null}
                <button
                  className="btn btn-primary btn-block"
                  style={{ fontSize: 15, padding: 13, marginTop: 6 }}
                  disabled={selected.length === 0 || locked}
                  onClick={() => submit(selected)}
                >
                  {locked ? "Submitting…" : "Submit Answer →"}
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontSize: 15, marginBottom: 6 }}>✓ Answer Submitted</p>
                <h3 style={{ color: feedback.isCorrect ? "var(--color-accent-2-700)" : "var(--color-danger)", marginBottom: 4 }}>
                  {feedback.isCorrect ? "Correct Answer!" : "Not quite"}
                </h3>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: "var(--color-accent-700)", marginBottom: 4 }}>
                  +{Math.round(feedback.questionScore)} Points
                </p>
                <p className="text-muted" style={{ fontSize: 12, marginBottom: 20 }}>
                  Correctness {Math.round(feedback.baseScore)} + Speed bonus {Math.round(feedback.speedScore)}
                </p>
                {rank ? <p className="text-muted" style={{ fontSize: 13, marginBottom: 18 }}>Your Rank: #{rank}</p> : null}
                <button className="btn btn-primary btn-block" style={{ fontSize: 15, padding: 13 }} onClick={loadQuestion}>
                  {view.questionNumber >= view.totalQuestions ? "See Result →" : "Next Question →"}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card elev-sm" style={{ textAlign: "center", padding: "20px 16px" }}>
              <div className="card-kicker" style={{ textAlign: "center" }}>Time Remaining</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 36, color: remainingMs < 5000 ? "var(--color-danger)" : "var(--color-accent-700)" }}>
                {mm}:{ss}
              </div>
            </div>
            <a
              className="card elev-sm"
              style={{ textAlign: "center", padding: "20px 16px", cursor: "pointer", textDecoration: "none", color: "inherit" }}
              href={`/quiz/attempt/${attemptId}/leaderboard`}
              target="_blank"
              rel="noreferrer"
            >
              <div className="card-kicker" style={{ textAlign: "center" }}>Live Leaderboard</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: "var(--color-accent-700)" }}>{rank ? `#${rank}` : "—"}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>Current score {Math.round(view.score)}</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
