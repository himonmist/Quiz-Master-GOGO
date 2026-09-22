"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartQuizButton({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start this quiz");
        return;
      }
      router.push(`/quiz/attempt/${data.attemptId}`);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error ? (
        <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 10 }}>
          {error}
        </p>
      ) : null}
      <button className="btn btn-primary btn-block" style={{ fontSize: 15, padding: 13 }} onClick={onStart} disabled={loading}>
        {loading ? "Starting…" : "START QUIZ"}
      </button>
    </div>
  );
}
