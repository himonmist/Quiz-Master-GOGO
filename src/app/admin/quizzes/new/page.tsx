import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewQuizForm } from "@/components/admin/NewQuizForm";

export default async function NewQuizPage() {
  const user = await requireUser(STAFF_ROLES);

  const [courses, questions] = user.organizationId
    ? await Promise.all([
        prisma.course.findMany({ where: { organizationId: user.organizationId }, orderBy: { title: "asc" } }),
        prisma.question.findMany({
          where: { organizationId: user.organizationId, deletedAt: null, isActive: true },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], []];

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>New Quiz</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Configure the quiz and pick its questions from your question bank.</p>
      <NewQuizForm
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        questions={questions.map((q) => ({ id: q.id, text: q.text, difficulty: q.difficulty, marks: q.marks }))}
      />
    </div>
  );
}
