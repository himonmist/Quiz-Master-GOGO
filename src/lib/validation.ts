import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    password,
    confirmPassword: z.string(),
    mobileNumber: z.string().trim().max(30).optional().or(z.literal("")),
    organizationId: z.string().min(1, "Select an organization"),
    designation: z.string().trim().max(120).optional().or(z.literal("")),
    country: z.string().trim().max(80).optional().or(z.literal("")),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const organizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const courseSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  instructor: z.string().trim().max(120).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
});

export const questionOptionSchema = z.object({
  text: z.string().trim().min(1).max(500),
  isCorrect: z.boolean(),
});

export const questionSchema = z.object({
  courseId: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"]),
  text: z.string().trim().min(3).max(2000),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  marks: z.coerce.number().int().min(1).max(1000),
  timeLimitSeconds: z.coerce.number().int().min(5).max(600),
  negativeMarks: z.coerce.number().int().min(0).max(1000).default(0),
  explanation: z.string().trim().max(2000).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1)).default([]),
  options: z.array(questionOptionSchema).min(2).max(8),
});

export const quizSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  numQuestions: z.coerce.number().int().min(1).max(200),
  perQuestionTimeSeconds: z.coerce.number().int().min(5).max(600),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  attemptLimit: z.coerce.number().int().min(1).max(20),
  passingScore: z.coerce.number().int().min(0).max(100000),
  mode: z.enum(["PRACTICE", "COMPETITION"]),
  competitionMode: z.enum(["STANDARD", "LIVE_COMPETITION", "TIME_ATTACK", "CERTIFICATION_EXAM"]),
  randomQuestionOrder: z.boolean(),
  randomAnswerOrder: z.boolean(),
  negativeMarking: z.boolean(),
  speedBonusEnabled: z.boolean(),
  difficultyWeightingEnabled: z.boolean(),
  accuracyWeightPercent: z.coerce.number().int().min(70).max(95),
  speedWeightPercent: z.coerce.number().int().min(5).max(30),
  leaderboardVisible: z.boolean(),
  resultVisibility: z.enum(["IMMEDIATE", "AFTER_QUIZ", "AFTER_COMPETITION", "NEVER"]),
  questionIds: z.array(z.string()).min(1),
}).refine((data) => data.accuracyWeightPercent + data.speedWeightPercent === 100, {
  message: "Accuracy and speed weights must add up to 100",
  path: ["speedWeightPercent"],
});

export const submitAnswerSchema = z.object({
  selectedOptionIds: z.array(z.string()).default([]),
});

export const suspiciousEventSchema = z.object({
  type: z.enum([
    "TAB_SWITCH",
    "WINDOW_BLUR",
    "COPY_ATTEMPT",
    "PASTE_ATTEMPT",
    "FULLSCREEN_EXIT",
    "RAPID_SUBMIT",
    "MULTIPLE_TABS",
  ]),
  metadata: z.record(z.unknown()).optional(),
});
