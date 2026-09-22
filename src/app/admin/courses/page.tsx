import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewCourseForm } from "@/components/admin/NewCourseForm";
import { CourseStatusActions } from "@/components/admin/CourseStatusActions";

export default async function AdminCoursesPage() {
  const user = await requireUser(STAFF_ROLES);
  const courses = user.organizationId
    ? await prisma.course.findMany({
        where: { organizationId: user.organizationId },
        include: { _count: { select: { quizzes: true, participants: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Course Management</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Create courses and manage their lifecycle.</p>

      <NewCourseForm />

      <div className="card elev-sm" style={{ padding: "8px 16px", marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Status</th>
              <th>Quizzes</th>
              <th>Participants</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td>
                  <span className="tag tag-accent-2">{c.status}</span>
                </td>
                <td>{c._count.quizzes}</td>
                <td>{c._count.participants}</td>
                <td>
                  <CourseStatusActions courseId={c.id} status={c.status} />
                </td>
              </tr>
            ))}
            {courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No courses yet — create one above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
