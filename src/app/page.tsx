import Link from "next/link";

const FEATURES = [
  { title: "Live Competition", body: "Real-time leaderboards update the instant an answer is submitted — everyone sees where they stand, every question." },
  { title: "Smart Scoring", body: "80% accuracy, 20% speed by default, and fully configurable per quiz. A fast wrong answer never beats a correct one." },
  { title: "Real-Time Leaderboard", body: "Server-authoritative ranking with deterministic tie-breaking — correct answers, then accuracy, then response time." },
  { title: "Analytics", body: "Question-level difficulty, accuracy and response-time breakdowns for every course and competition." },
  { title: "Certificates", body: "Auto-generated, QR-verifiable certificates for every completed course or competition." },
  { title: "Security", body: "Server-side timers, tamper-proof scoring, tenant isolation and full audit logging throughout." },
];

const STEPS = [
  { n: "01", title: "Join a quiz", body: "Sign in, see your assigned quizzes, and join when the competition opens." },
  { n: "02", title: "Answer, one question at a time", body: "Each question has its own server-enforced timer. Submit and lock in your answer." },
  { n: "03", title: "Watch the leaderboard move", body: "Your rank updates live after every submission — accuracy and speed both count." },
  { n: "04", title: "Get your result", body: "Final score, accuracy, rank, percentile and a certificate if you've earned one." },
];

const FAQS = [
  { q: "How is the winner decided?", a: "By total score: accuracy is weighted at 80% and speed at 20% by default. A correct, slower answer will always outscore an incorrect fast guess." },
  { q: "Can we run this for a private organization?", a: "Yes — Quiz Master GOGO is multi-tenant. Every organization's courses, quizzes and results are fully isolated from every other." },
  { q: "Is the timer trustworthy?", a: "All timing is recorded server-side from the moment a question is served to the moment an answer is submitted. The browser&apos;s countdown is a display only." },
  { q: "What happens if I lose connection mid-quiz?", a: "Your progress and answers already submitted are safe. Reconnect and you'll resume exactly where you left off, with the server clock still authoritative." },
];

export default function LandingPage() {
  return (
    <div>
      <header className="nav" style={{ position: "sticky", top: 0, background: "var(--color-bg)", zIndex: 10 }}>
        <span className="nav-brand">QUIZ MASTER GOGO</span>
        <Link href="#how-it-works">How it works</Link>
        <Link href="#features">Features</Link>
        <Link href="#faq">FAQ</Link>
        <Link href="/login" className="btn btn-secondary" style={{ marginLeft: 8 }}>
          Sign in
        </Link>
        <Link href="/register" className="btn btn-primary">
          Start Quiz
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section style={{ padding: "64px 24px 48px", maxWidth: 900, margin: "0 auto", textAlign: "left" }}>
          <span className="tag tag-accent-2" style={{ marginBottom: 18 }}>
            Real-time competitive quiz platform
          </span>
          <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)", marginBottom: 14 }}>Think Fast. Answer Right. Rise to the Top.</h1>
          <p className="text-muted" style={{ fontSize: 18, maxWidth: 640, marginBottom: 28 }}>
            Real-time competitive quizzes powered by accuracy, speed, and intelligent scoring — built for training programs,
            universities, certification exams and live events.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/register" className="btn btn-primary" style={{ fontSize: 15, padding: "12px 24px" }}>
              Start Quiz →
            </Link>
            <Link href="#features" className="btn btn-secondary" style={{ fontSize: 15, padding: "12px 24px" }}>
              Explore Competitions
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
          <h6 style={{ color: "var(--color-accent-700)", marginBottom: 6 }}>How it works</h6>
          <h2 style={{ marginBottom: 28 }}>From join to leaderboard in four steps</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {STEPS.map((s) => (
              <div key={s.n} className="card elev-sm" style={{ padding: 22 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: "var(--color-accent-700)" }}>{s.n}</div>
                <div className="card-title">{s.title}</div>
                <p className="card-body">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring explainer */}
        <section style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
          <div className="card elev-md" style={{ padding: 32, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, alignItems: "center" }}>
            <div>
              <h6 style={{ color: "var(--color-accent-700)", marginBottom: 6 }}>Smart scoring</h6>
              <h3 style={{ marginBottom: 10 }}>Accuracy always comes first</h3>
              <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 0 }}>
                Every question is worth up to 80 points for a correct answer, plus up to 20 points for speed. Answer
                incorrectly and speed earns nothing — so a lucky fast click can never outscore real knowledge.
              </p>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <div className="card elev-sm" style={{ padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13 }}>Correct · answered in 5s</span>
                <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent-700)" }}>96 pts</span>
              </div>
              <div className="card elev-sm" style={{ padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13 }}>Correct · answered in 15s</span>
                <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent-700)" }}>88 pts</span>
              </div>
              <div className="card elev-sm" style={{ padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13 }}>Incorrect · answered in 2s</span>
                <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-danger)" }}>0 pts</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
          <h6 style={{ color: "var(--color-accent-700)", marginBottom: 6 }}>Features</h6>
          <h2 style={{ marginBottom: 28 }}>Everything a fair, fast competition needs</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="card elev-sm" style={{ padding: 22 }}>
                <div className="card-title">{f.title}</div>
                <p className="card-body">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Organizations */}
        <section style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
          <div className="card elev-md" style={{ padding: 32, textAlign: "center", alignItems: "center" }}>
            <h6 style={{ color: "var(--color-accent-700)" }}>Built for organizations</h6>
            <h3 style={{ marginBottom: 10 }}>Government · Universities · Corporates · Training academies</h3>
            <p className="text-muted" style={{ maxWidth: 560, marginBottom: 0 }}>
              Every organization&apos;s courses, quizzes, participants and results are fully isolated — Quiz Master GOGO is
              multi-tenant by design, credible enough for regulated and enterprise training programs.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ padding: "32px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
          <h6 style={{ color: "var(--color-accent-700)", marginBottom: 6 }}>FAQ</h6>
          <h2 style={{ marginBottom: 28 }}>Frequently asked questions</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {FAQS.map((f) => (
              <div key={f.q} className="card elev-sm" style={{ padding: 20 }}>
                <div className="card-title">{f.q}</div>
                <p className="card-body">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "0 24px 80px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div className="card elev-lg" style={{ padding: "40px 32px", alignItems: "center" }}>
            <h3 style={{ marginBottom: 8 }}>Ready to rise to the top?</h3>
            <p className="text-muted" style={{ marginBottom: 20 }}>Create a free account and join your first live competition today.</p>
            <Link href="/register" className="btn btn-primary" style={{ fontSize: 15, padding: "12px 28px" }}>
              Start Quiz →
            </Link>
          </div>
        </section>
      </main>

      <footer style={{ padding: "24px", textAlign: "center", borderTop: "1px solid var(--color-divider)" }}>
        <p className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Quiz Master GOGO — Fast + Fair + Secure + Competitive + Scalable + Enterprise-ready.</p>
        <Link href="/verify" className="text-muted" style={{ fontSize: 12 }}>
          Verify a certificate →
        </Link>
      </footer>
    </div>
  );
}
