/**
 * Demo/dev seed data (spec §51). Run with `npx prisma db seed` (requires a
 * reachable DATABASE_URL — this needs direct Postgres access, which the
 * build sandbox that first populated Neon didn't have; see README).
 */
import { PrismaClient, Difficulty } from "@prisma/client";
import bcrypt from "bcryptjs";
import { scoreQuestion } from "../src/lib/scoring";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123";

const PARTICIPANT_NAMES = [
  "Nadia Rahman", "Arif Hasan", "M. Karim", "S. Ahmed", "Tanvir Islam",
  "Farhana Akter", "Rezaul Karim", "Shamima Nasrin", "Mahfuzur Rahman", "Nusrat Jahan",
  "Kamrul Hasan", "Sabbir Ahmed", "Ruma Begum", "Ashraful Islam", "Tahmina Akter",
  "Zahidul Islam", "Sultana Razia", "Mizanur Rahman", "Ayesha Siddiqua", "Jahangir Alam",
];

const QUESTIONS: { text: string; options: string[]; correct: number; difficulty: Difficulty; explanation: string }[] = [
  { text: "Which technology is commonly used to build large language models?", options: ["Machine Learning", "FTP", "DNS", "CSS"], correct: 0, difficulty: "EASY", explanation: "LLMs are a class of machine learning models trained on large text corpora." },
  { text: "What does \"fine-tuning\" mean in machine learning?", options: ["Adjusting a pretrained model on a specific dataset", "Compressing an image file", "Configuring a firewall", "Formatting a spreadsheet"], correct: 0, difficulty: "MEDIUM", explanation: "Fine-tuning continues training a pretrained model on a narrower, task-specific dataset." },
  { text: "Which metric is commonly used to measure a language model's prediction quality?", options: ["Perplexity", "Voltage", "Latency only", "Pixel density"], correct: 0, difficulty: "HARD", explanation: "Perplexity measures how well a probability model predicts a sample." },
  { text: "What is a \"token\" in the context of large language models?", options: ["A unit of text the model processes", "A hardware security key", "A blockchain currency", "A network port"], correct: 0, difficulty: "EASY", explanation: "Tokens are the sub-word units models split text into before processing." },
  { text: "What is \"prompt engineering\"?", options: ["Designing inputs to get better model outputs", "Writing firmware for GPUs", "A database indexing technique", "A network security protocol"], correct: 0, difficulty: "MEDIUM", explanation: "Prompt engineering is the practice of crafting inputs to steer a model's output." },
  { text: "Which of these is a generative AI model type?", options: ["Diffusion model", "Bubble sort", "Round-robin scheduler", "B-tree index"], correct: 0, difficulty: "MEDIUM", explanation: "Diffusion models generate data (often images) by reversing a noising process." },
  { text: "What does \"hallucination\" mean for an AI model?", options: ["Generating plausible but incorrect information", "A GPU overheating", "A model refusing to respond", "A type of data compression"], correct: 0, difficulty: "MEDIUM", explanation: "Hallucination is when a model states something false with apparent confidence." },
  { text: "Which company developed the Transformer architecture paper \"Attention Is All You Need\"?", options: ["Google", "Amazon", "IBM", "Intel"], correct: 0, difficulty: "HARD", explanation: "The Transformer architecture was introduced by Google researchers in 2017." },
  { text: "What is the primary purpose of an embedding in NLP?", options: ["Representing text as numeric vectors", "Encrypting a password", "Compressing video files", "Routing network packets"], correct: 0, difficulty: "MEDIUM", explanation: "Embeddings map words or text into a numeric vector space capturing meaning." },
  { text: "What does \"RAG\" stand for in AI systems?", options: ["Retrieval-Augmented Generation", "Rapid Application Gateway", "Random Access Graph", "Resource Allocation Group"], correct: 0, difficulty: "HARD", explanation: "RAG combines a retrieval step with a generative model to ground its answers." },
  { text: "Which of these is an example of supervised learning?", options: ["Training a spam classifier on labeled emails", "Clustering customers with no labels", "Randomly shuffling a dataset", "Compressing a file with gzip"], correct: 0, difficulty: "EASY", explanation: "Supervised learning uses labeled examples to train a model." },
  { text: "What is \"overfitting\" in machine learning?", options: ["A model memorizing training data instead of generalizing", "A model running out of memory", "A dataset being too small to load", "A network cable being unplugged"], correct: 0, difficulty: "MEDIUM", explanation: "Overfitting happens when a model fits noise in training data and generalizes poorly." },
  { text: "Which of these best describes \"AI ethics\"?", options: ["Principles guiding the responsible use of AI", "A programming language", "A hardware standard", "A type of firewall rule"], correct: 0, difficulty: "EASY", explanation: "AI ethics covers fairness, transparency, accountability and safety in AI systems." },
  { text: "What is a common risk of biased training data?", options: ["The model produces unfair or skewed outputs", "The model runs faster", "The dataset becomes smaller", "The model requires less storage"], correct: 0, difficulty: "MEDIUM", explanation: "Biased data can cause a model to systematically disadvantage certain groups." },
  { text: "What does \"HITL\" stand for in AI governance?", options: ["Human-In-The-Loop", "High-Intensity Task List", "Hardware Interface Test Layer", "Hosted Inference Training Log"], correct: 0, difficulty: "HARD", explanation: "HITL means keeping a human reviewer in the decision-making loop." },
  { text: "Which of these is a foundation model provider?", options: ["Anthropic", "Cisco", "Oracle Financials", "Adobe Flash"], correct: 0, difficulty: "EASY", explanation: "Anthropic develops the Claude family of foundation models." },
  { text: "What is \"zero-shot\" prompting?", options: ["Asking a model to perform a task with no examples given", "Training a model with zero data", "Running a model with zero latency", "A model that never responds"], correct: 0, difficulty: "MEDIUM", explanation: "Zero-shot prompting relies on the model's general knowledge without example demonstrations." },
  { text: "What is \"few-shot\" prompting?", options: ["Providing a small number of examples in the prompt", "Training with very little compute", "A model with limited vocabulary", "Running only a few inference steps"], correct: 0, difficulty: "MEDIUM", explanation: "Few-shot prompting includes a handful of examples to guide the model's output." },
  { text: "Which of these is a common use case for AI in government services?", options: ["Automating routine document processing", "Replacing all elected officials", "Eliminating the need for data privacy laws", "Removing human oversight entirely"], correct: 0, difficulty: "EASY", explanation: "AI is commonly used to speed up repetitive administrative tasks." },
  { text: "What is \"model context window\"?", options: ["The maximum amount of text a model can consider at once", "The physical screen size of a device", "A model's training budget in dollars", "The number of GPUs used for inference"], correct: 0, difficulty: "MEDIUM", explanation: "The context window limits how much input (and recent output) a model can attend to." },
  { text: "Which of the following is true about API rate limits?", options: ["They cap how many requests can be made in a time window", "They increase model accuracy", "They are unrelated to cost control", "They only apply to free accounts"], correct: 0, difficulty: "EASY", explanation: "Rate limits protect services from overload and manage cost." },
  { text: "What is \"chain-of-thought\" prompting?", options: ["Asking a model to reason step by step before answering", "Linking multiple APIs together", "A blockchain-based prompting technique", "Chaining several unrelated models randomly"], correct: 0, difficulty: "HARD", explanation: "Chain-of-thought prompting encourages a model to show intermediate reasoning steps." },
  { text: "What does \"inference\" mean for a deployed AI model?", options: ["Using a trained model to make predictions", "Training a model from scratch", "Deleting a model's weights", "Compressing training data"], correct: 0, difficulty: "EASY", explanation: "Inference is running a trained model to produce outputs on new inputs." },
  { text: "Which practice helps reduce AI hallucinations in production systems?", options: ["Grounding answers in retrieved, verified sources", "Disabling all logging", "Increasing the temperature to maximum", "Removing all guardrails"], correct: 0, difficulty: "HARD", explanation: "Grounding responses in verified retrieved content reduces fabricated answers." },
  { text: "What is a \"guardrail\" in an AI system?", options: ["A safety constraint that filters or blocks unwanted outputs", "A physical server rack rail", "A type of GPU cooling fan", "A network firewall port"], correct: 0, difficulty: "MEDIUM", explanation: "Guardrails are checks that keep model behavior within safe, intended bounds." },
  { text: "Which of these best supports data privacy when using AI tools?", options: ["Avoiding sharing sensitive personal data in prompts", "Posting all prompts publicly", "Disabling encryption", "Sharing API keys openly"], correct: 0, difficulty: "EASY", explanation: "Minimizing sensitive data in prompts reduces privacy risk." },
  { text: "What is the main benefit of using an AI-generated first draft with human review?", options: ["Faster output with a human quality check", "Eliminating the need for any review", "Guaranteed zero errors", "Removing the need for domain expertise"], correct: 0, difficulty: "MEDIUM", explanation: "AI drafts speed up work, while human review catches errors and adds judgment." },
  { text: "Which of these describes \"multimodal\" AI models?", options: ["Models that process more than one type of input, like text and images", "Models that only run on multiple GPUs", "Models with multiple passwords", "Models that only work offline"], correct: 0, difficulty: "MEDIUM", explanation: "Multimodal models can accept and reason across different data types." },
  { text: "What is a key reason to log and audit AI system usage in an organization?", options: ["To ensure accountability and support governance", "To slow down the system intentionally", "To increase storage costs with no benefit", "To make debugging harder"], correct: 0, difficulty: "MEDIUM", explanation: "Audit logs support accountability, compliance and incident investigation." },
  { text: "Which of these is an appropriate first step before rolling out AI tools organization-wide?", options: ["Running a pilot program with clear success metrics", "Deploying to every department simultaneously with no plan", "Skipping any staff training", "Ignoring data governance policies"], correct: 0, difficulty: "EASY", explanation: "A measured pilot reduces risk and builds an evidence base before wider rollout." },
];

async function main() {
  console.log("Seeding Quiz Master GOGO demo data…");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const org = await prisma.organization.upsert({
    where: { slug: "bangladesh-digital-learning-institute" },
    update: {},
    create: {
      name: "Bangladesh Digital Learning Institute",
      slug: "bangladesh-digital-learning-institute",
      description: "A leading training academy for government and professional digital-skills programs.",
    },
  });

  await prisma.user.upsert({
    where: { email: "super.admin@quizmastergogo.demo" },
    update: {},
    create: {
      organizationId: org.id,
      email: "super.admin@quizmastergogo.demo",
      passwordHash,
      fullName: "Platform Super Admin",
      role: "SUPER_ADMIN",
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
    },
  });

  const orgAdmin = await prisma.user.upsert({
    where: { email: "admin@bdli.demo" },
    update: {},
    create: {
      organizationId: org.id,
      email: "admin@bdli.demo",
      passwordHash,
      fullName: "MD Hasan Mahfuz",
      designation: "Training Director",
      role: "ORG_ADMIN",
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "quizmanager@bdli.demo" },
    update: {},
    create: {
      organizationId: org.id,
      email: "quizmanager@bdli.demo",
      passwordHash,
      fullName: "Farida Yasmin",
      designation: "Quiz Manager",
      role: "QUIZ_MANAGER",
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
    },
  });

  const course = await prisma.course.upsert({
    where: { id: (await prisma.course.findFirst({ where: { organizationId: org.id, title: "AI for Government Officers" } }))?.id ?? "__none__" },
    update: {},
    create: {
      organizationId: org.id,
      title: "AI for Government Officers",
      description: "A practical introduction to AI fundamentals, generative AI, ethics and prompt engineering for public-sector teams.",
      instructor: "MD Hasan Mahfuz",
      status: "ACTIVE",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    },
  });

  const category = await prisma.category.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "AI Fundamentals" } },
    update: {},
    create: { organizationId: org.id, name: "AI Fundamentals" },
  });

  const questionRecords = [];
  for (const q of QUESTIONS) {
    const existing = await prisma.question.findFirst({
      where: { organizationId: org.id, text: q.text },
      include: { options: true },
    });
    if (existing) {
      questionRecords.push(existing);
      continue;
    }
    const created = await prisma.question.create({
      data: {
        organizationId: org.id,
        courseId: course.id,
        categoryId: category.id,
        type: "SINGLE_CHOICE",
        text: q.text,
        difficulty: q.difficulty,
        marks: 10,
        timeLimitSeconds: 20,
        explanation: q.explanation,
        createdById: orgAdmin.id,
        options: {
          create: q.options.map((text, i) => ({ text, isCorrect: i === q.correct, order: i })),
        },
      },
      include: { options: true },
    });
    questionRecords.push(created);
  }

  const quizQuestionPool = questionRecords.slice(0, 20);

  let quiz = await prisma.quiz.findFirst({ where: { organizationId: org.id, title: "AI Fundamentals Challenge 2026" } });
  if (!quiz) {
    quiz = await prisma.quiz.create({
      data: {
        organizationId: org.id,
        courseId: course.id,
        title: "AI Fundamentals Challenge 2026",
        description: "A 20-question live competition covering AI fundamentals, generative AI and responsible use.",
        difficulty: "MEDIUM",
        numQuestions: quizQuestionPool.length,
        perQuestionTimeSeconds: 20,
        attemptLimit: 1,
        passingScore: 500,
        mode: "COMPETITION",
        competitionMode: "LIVE_COMPETITION",
        randomQuestionOrder: true,
        randomAnswerOrder: true,
        speedBonusEnabled: true,
        accuracyWeightPercent: 80,
        speedWeightPercent: 20,
        leaderboardVisible: true,
        resultVisibility: "AFTER_QUIZ",
        status: "LIVE",
        createdById: orgAdmin.id,
        quizQuestions: {
          create: quizQuestionPool.map((q, i) => ({ questionId: q.id, order: i })),
        },
      },
    });
  }

  // Two additional quiz shells for variety in the admin list.
  await prisma.quiz.upsert({
    where: { id: (await prisma.quiz.findFirst({ where: { organizationId: org.id, title: "Prompt Engineering Practice" } }))?.id ?? "__none__" },
    update: {},
    create: {
      organizationId: org.id,
      courseId: course.id,
      title: "Prompt Engineering Practice",
      description: "Self-paced practice quiz — no live ranking.",
      difficulty: "EASY",
      numQuestions: Math.min(10, questionRecords.length),
      perQuestionTimeSeconds: 25,
      attemptLimit: 3,
      passingScore: 0,
      mode: "PRACTICE",
      leaderboardVisible: false,
      resultVisibility: "IMMEDIATE",
      status: "DRAFT",
      createdById: orgAdmin.id,
      quizQuestions: { create: questionRecords.slice(10, 20).map((q, i) => ({ questionId: q.id, order: i })) },
    },
  });

  await prisma.quiz.upsert({
    where: { id: (await prisma.quiz.findFirst({ where: { organizationId: org.id, title: "Generative AI Sprint" } }))?.id ?? "__none__" },
    update: {},
    create: {
      organizationId: org.id,
      courseId: course.id,
      title: "Generative AI Sprint",
      description: "Scheduled live competition — opens next week.",
      difficulty: "MEDIUM",
      numQuestions: Math.min(15, questionRecords.length),
      perQuestionTimeSeconds: 20,
      attemptLimit: 1,
      passingScore: 400,
      mode: "COMPETITION",
      competitionMode: "TIME_ATTACK",
      accuracyWeightPercent: 75,
      speedWeightPercent: 25,
      leaderboardVisible: true,
      resultVisibility: "AFTER_QUIZ",
      status: "SCHEDULED",
      startAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      createdById: orgAdmin.id,
      quizQuestions: { create: questionRecords.slice(0, 15).map((q, i) => ({ questionId: q.id, order: i })) },
    },
  });

  // 20 demo participants with a completed, realistically-scored attempt each.
  for (let i = 0; i < PARTICIPANT_NAMES.length; i++) {
    const name = PARTICIPANT_NAMES[i];
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${i}@bdli.demo`;

    const participant = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        organizationId: org.id,
        email,
        passwordHash,
        fullName: name,
        role: "PARTICIPANT",
        country: "Bangladesh",
        emailVerifiedAt: new Date(),
        termsAcceptedAt: new Date(),
      },
    });

    await prisma.courseParticipant.upsert({
      where: { courseId_userId: { courseId: course.id, userId: participant.id } },
      update: {},
      create: { courseId: course.id, userId: participant.id },
    });

    const existingAttempt = await prisma.quizAttempt.findFirst({ where: { quizId: quiz.id, userId: participant.id } });
    if (existingAttempt) continue;

    // Skill varies per participant so the leaderboard has a realistic spread.
    const skill = 0.55 + (Math.random() * 0.43); // ~55%-98% accuracy
    const speedFactor = 0.3 + Math.random() * 0.6; // fraction of the time budget typically used

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: participant.id,
        attemptNumber: 1,
        status: "IN_PROGRESS",
        questionOrder: quizQuestionPool.map((q) => q.id),
        startedAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    });

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let totalResponseTimeMs = 0;

    for (let qi = 0; qi < quizQuestionPool.length; qi++) {
      const question = quizQuestionPool[qi];
      const isCorrect = Math.random() < skill;
      const maxTimeMs = question.timeLimitSeconds * 1000;
      const responseTimeMs = Math.max(800, Math.min(maxTimeMs - 200, Math.round(maxTimeMs * speedFactor * (0.6 + Math.random() * 0.8))));

      const result = scoreQuestion({
        isCorrect,
        responseTimeMs,
        maxTimeMs,
        accuracyWeight: quiz.accuracyWeightPercent,
        speedWeight: quiz.speedWeightPercent,
        difficulty: question.difficulty,
        difficultyWeightingEnabled: quiz.difficultyWeightingEnabled,
        speedBonusEnabled: quiz.speedBonusEnabled,
      });

      const correctOption = question.options.find((o) => o.isCorrect)!;
      const wrongOption = question.options.find((o) => !o.isCorrect)!;
      const selectedOptionIds = isCorrect ? [correctOption.id] : [wrongOption.id];

      const aq = await prisma.quizAttemptQuestion.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          order: qi,
          optionOrder: question.options.map((o) => o.id),
          serverStartedAt: new Date(attempt.startedAt!.getTime() + qi * maxTimeMs),
          serverDeadlineAt: new Date(attempt.startedAt!.getTime() + qi * maxTimeMs + maxTimeMs),
          submittedAt: new Date(attempt.startedAt!.getTime() + qi * maxTimeMs + responseTimeMs),
          status: "ANSWERED",
        },
      });

      await prisma.answer.create({
        data: {
          attemptId: attempt.id,
          attemptQuestionId: aq.id,
          questionId: question.id,
          selectedOptionIds,
          isCorrect,
          responseTimeMs,
          baseScore: result.baseScore,
          speedScore: result.speedScore,
          difficultyMultiplier: result.difficultyMultiplier,
          questionScore: result.questionScore,
        },
      });

      totalScore += result.questionScore;
      if (isCorrect) correctCount += 1;
      else incorrectCount += 1;
      totalResponseTimeMs += responseTimeMs;
    }

    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "COMPLETED",
        currentQuestionIndex: quizQuestionPool.length,
        completedAt: new Date(attempt.startedAt!.getTime() + totalResponseTimeMs),
        totalScore,
        correctCount,
        incorrectCount,
        totalResponseTimeMs: BigInt(Math.round(totalResponseTimeMs)),
      },
    });

    if (totalScore >= quiz.passingScore) {
      const rankedAbove = await prisma.quizAttempt.count({
        where: { quizId: quiz.id, status: "COMPLETED", totalScore: { gt: totalScore } },
      });
      await prisma.certificate.upsert({
        where: { attemptId: attempt.id },
        update: {},
        create: {
          certificateCode: `CERT-2026-${String(100000 + i).slice(-6)}`,
          organizationId: org.id,
          userId: participant.id,
          courseId: course.id,
          quizId: quiz.id,
          attemptId: attempt.id,
          score: totalScore,
          rank: rankedAbove + 1,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log(`Demo login password for every seeded account: ${DEMO_PASSWORD}`);
  console.log(`  Super admin:  super.admin@quizmastergogo.demo`);
  console.log(`  Org admin:    admin@bdli.demo`);
  console.log(`  Quiz manager: quizmanager@bdli.demo`);
  console.log(`  Participant:  nadia.rahman0@bdli.demo (or any of the 20 seeded participants)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
