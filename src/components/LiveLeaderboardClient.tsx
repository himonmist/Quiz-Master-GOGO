"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Row {
  rank: number;
  displayName: string;
  score: number;
  accuracy: number;
  avgResponseSeconds: number;
  isYou: boolean;
}

export function LiveLeaderboardClient({ attemptId }: { attemptId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/leaderboard`);
        const data = await res.json();
        if (cancelled) return;
        setVisible(data.visible !== false);
        setRows(data.rows ?? []);
        setQuizTitle(data.quizTitle ?? "");
        setTotalQuestions(data.totalQuestions ?? 0);
      } catch {
        // keep showing the last known leaderboard on a transient failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [attemptId]);

  return (
    <div style={{ minHeight: "100vh", padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <Link href={`/quiz/attempt/${attemptId}`} className="text-muted" style={{ fontSize: 13, textDecoration: "none" }}>
        ← Back
      </Link>
      <h2 style={{ marginTop: 14, marginBottom: 2 }}>Live Leaderboard</h2>
      <p className="text-muted" style={{ marginBottom: 6 }}>{quizTitle}</p>
      {totalQuestions ? <p className="text-muted" style={{ fontSize: 13, marginBottom: 24 }}>{totalQuestions} questions</p> : null}

      {!visible ? (
        <div className="card elev-sm" style={{ padding: 24 }}>
          <p className="card-body" style={{ margin: 0 }}>The leaderboard is hidden for this quiz until it ends.</p>
        </div>
      ) : (
        <div className="card elev-sm" style={{ padding: "8px 16px" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Participant</th>
                <th style={{ textAlign: "right" }}>Score</th>
                <th style={{ textAlign: "right" }}>Accuracy</th>
                <th style={{ textAlign: "right" }}>Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rank} style={row.isYou ? { background: "var(--color-accent-100)", fontWeight: 700 } : undefined}>
                  <td>#{row.rank}</td>
                  <td>{row.isYou ? "You" : row.displayName}</td>
                  <td style={{ textAlign: "right" }}>{row.score}</td>
                  <td style={{ textAlign: "right" }}>{row.accuracy}%</td>
                  <td style={{ textAlign: "right" }}>{row.avgResponseSeconds.toFixed(1)}s</td>
                </tr>
              ))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No participants yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
