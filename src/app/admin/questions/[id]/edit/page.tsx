import { notFound } from "next/navigation";
import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewQuestionForm } from "@/components/admin/NewQuestionForm";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(STAFF_ROLES);
  const { id } = await params;

  if (!user.organizationId) notFound();

  const [question, courses, categories] = await Promise.all([
    prisma.question.findFirst({
      where: { id, organizationId: user.organizationId, deletedAt: null },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    prisma.course.findMany({ where: { organizationId: user.organizationId }, orderBy: { title: "asc" } }),
    prisma.category.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  if (!question) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Edit Question</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Fix a mistake in this question or its options.</p>
      <NewQuestionForm
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          id: question.id,
          type: question.type as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE",
          text: question.text,
          courseId: question.courseId ?? "",
          categoryId: question.categoryId ?? "",
          difficulty: question.difficulty,
          marks: question.marks,
          timeLimitSeconds: question.timeLimitSeconds,
          negativeMarks: question.negativeMarks,
          explanation: question.explanation ?? "",
          options: question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
        }}
      />
    </div>
  );
}
