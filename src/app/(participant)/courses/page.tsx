import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function CoursesPage() {
  const user = await requireUser();

  const courses = user.organizationId
    ? await prisma.course.findMany({
        where: { organizationId: user.organizationId, deletedAt: null, status: { not: "DRAFT" } },
        include: { _count: { select: { quizzes: true, participants: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>My Courses</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Courses available in your organization.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {courses.map((c) => (
          <div key={c.id} className="card elev-sm" style={{ padding: 20 }}>
            <div className="card-kicker">{c.status}</div>
            <div className="card-title">{c.title}</div>
            <p className="card-body">{c.description ?? "No description yet."}</p>
            <div className="card-meta">
              {c._count.quizzes} quizzes · {c._count.participants} participants
              {c.instructor ? <> · {c.instructor}</> : null}
            </div>
          </div>
        ))}
        {courses.length === 0 ? <p className="text-muted">No courses available yet.</p> : null}
      </div>
    </div>
  );
}
