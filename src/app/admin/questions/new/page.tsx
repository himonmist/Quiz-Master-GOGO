import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewQuestionForm } from "@/components/admin/NewQuestionForm";

export default async function NewQuestionPage() {
  const user = await requireUser(STAFF_ROLES);
  const [courses, categories] = user.organizationId
    ? await Promise.all([
        prisma.course.findMany({ where: { organizationId: user.organizationId }, orderBy: { title: "asc" } }),
        prisma.category.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
      ])
    : [[], []];

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>New Question</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Add a question to your organization&apos;s question bank.</p>
      <NewQuestionForm
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
