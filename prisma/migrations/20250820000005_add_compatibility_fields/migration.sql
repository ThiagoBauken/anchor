-- AddCompatibilityFields
-- This migration adds all missing fields to make localStorage, Prisma, and PostgreSQL fully compatible

-- Add missing fields to Company table
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "cnpj" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "trialStartDate" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "trialEndDate" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "subscriptionExpiryDate" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "isTrialActive" BOOLEAN DEFAULT false;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "daysRemainingInTrial" INTEGER;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "usersCount" INTEGER DEFAULT 0;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "projectsCount" INTEGER DEFAULT 0;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "pointsCount" INTEGER DEFAULT 0;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "storageUsed" INTEGER DEFAULT 0;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "maxProjects" INTEGER;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "maxStorage" INTEGER;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "lastActivity" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Update User table to match localStorage field names (rename columns)
ALTER TABLE "User" RENAME COLUMN IF EXISTS "created_at" TO "createdAt";
ALTER TABLE "User" RENAME COLUMN IF EXISTS "updated_at" TO "updatedAt";
ALTER TABLE "User" RENAME COLUMN IF EXISTS "last_login_at" TO "lastLogin";

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "Company_email_idx" ON "Company"("email");
CREATE INDEX IF NOT EXISTS "Company_cnpj_idx" ON "Company"("cnpj");
CREATE INDEX IF NOT EXISTS "Company_subscriptionStatus_idx" ON "Company"("subscriptionStatus");
CREATE INDEX IF NOT EXISTS "Company_isActive_idx" ON "Company"("isActive");
CREATE INDEX IF NOT EXISTS "User_lastLogin_idx" ON "User"("lastLogin");

-- Update existing companies with default values
UPDATE "Company" SET 
  "usersCount" = 0 WHERE "usersCount" IS NULL,
  "projectsCount" = 0 WHERE "projectsCount" IS NULL,
  "pointsCount" = 0 WHERE "pointsCount" IS NULL,
  "storageUsed" = 0 WHERE "storageUsed" IS NULL,
  "isTrialActive" = false WHERE "isTrialActive" IS NULL,
  "isActive" = true WHERE "isActive" IS NULL,
  "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN "Company"."email" IS 'Company email for communication';
COMMENT ON COLUMN "Company"."cnpj" IS 'Brazilian company registration number';
COMMENT ON COLUMN "Company"."subscriptionPlan" IS 'Current subscription plan: trial, basic, pro, enterprise';
COMMENT ON COLUMN "Company"."subscriptionStatus" IS 'Subscription status: active, expired, cancelled, suspended';
COMMENT ON COLUMN "Company"."usersCount" IS 'Current number of users in company';
COMMENT ON COLUMN "Company"."projectsCount" IS 'Current number of projects in company';
COMMENT ON COLUMN "Company"."pointsCount" IS 'Current number of anchor points in company';
COMMENT ON COLUMN "Company"."storageUsed" IS 'Storage used in MB';