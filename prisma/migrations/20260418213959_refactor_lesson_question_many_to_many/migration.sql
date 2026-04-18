/*
  Warnings:

  - You are about to drop the column `courseId` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `questions` table. All the data in the column will be lost.
  - Added the required column `courseId` to the `questions` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add courseId column to questions table WITH default value
-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_lessonId_fkey";

-- Add courseId column with default value from lessons
ALTER TABLE "questions" ADD COLUMN "courseId" TEXT;

-- Step 2: Migrate data - Set courseId in questions from lessons.courseId
UPDATE "questions" q
SET "courseId" = l."courseId"
FROM "lessons" l
WHERE q."lessonId" = l."id" AND q."courseId" IS NULL;

-- Step 3: Make courseId NOT NULL now that it has values
ALTER TABLE "questions" ALTER COLUMN "courseId" SET NOT NULL;

-- Step 4: Create lesson_questions table with data
CREATE TABLE "lesson_questions" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_questions_pkey" PRIMARY KEY ("id")
);

-- Step 5: Migrate existing data into lesson_questions
INSERT INTO "lesson_questions" (id, "lessonId", "questionId", "orderIndex", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "lessonId",
    id,
    ROW_NUMBER() OVER (PARTITION BY "lessonId" ORDER BY "createdAt") - 1,
    NOW(),
    NOW()
FROM "questions"
WHERE "lessonId" IS NOT NULL;

-- Step 6: Drop lessonId from questions
ALTER TABLE "questions" DROP COLUMN "lessonId";

-- Step 7: Drop courseId from lessons
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_courseId_fkey";
ALTER TABLE "lessons" DROP COLUMN "courseId";

-- Step 8: Add lessonType to lessons
ALTER TABLE "lessons" ADD COLUMN "lessonType" TEXT NOT NULL DEFAULT 'GENERIC';

-- Step 9: Add indexes and constraints to lesson_questions
CREATE INDEX "lesson_questions_lessonId_idx" ON "lesson_questions"("lessonId");
CREATE INDEX "lesson_questions_questionId_idx" ON "lesson_questions"("questionId");
CREATE UNIQUE INDEX "lesson_questions_lessonId_questionId_key" ON "lesson_questions"("lessonId", "questionId");

-- Step 10: Create index on questions.courseId
CREATE INDEX "questions_courseId_idx" ON "questions"("courseId");

-- Step 11: Add foreign keys
ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
