-- ============================================================
-- COMPLETE SCHEMA FIX: Auto-Increment + Missing Columns
-- ============================================================
-- Run this script in your PostgreSQL database (ebdb on AWS RDS)
-- This fixes both auto-increment and missing columns issues
-- ============================================================

-- ============================================================
-- PART 1: Add Missing Columns to Registration Table
-- ============================================================

-- Add RegistrationCheckInTime column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Registration' 
        AND column_name = 'RegistrationCheckInTime'
    ) THEN
        ALTER TABLE "Registration" ADD COLUMN "RegistrationCheckInTime" TIMESTAMP NULL;
        RAISE NOTICE 'Added column: RegistrationCheckInTime';
    ELSE
        RAISE NOTICE 'Column already exists: RegistrationCheckInTime';
    END IF;
END $$;

-- Add RegistrationAttendedFlag column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Registration' 
        AND column_name = 'RegistrationAttendedFlag'
    ) THEN
        ALTER TABLE "Registration" ADD COLUMN "RegistrationAttendedFlag" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added column: RegistrationAttendedFlag';
    ELSE
        RAISE NOTICE 'Column already exists: RegistrationAttendedFlag';
    END IF;
END $$;

-- ============================================================
-- PART 2: Add Auto-Increment to Primary Keys
-- ============================================================

-- Step 1: Create sequences for each table
CREATE SEQUENCE IF NOT EXISTS "Participant_ParticipantID_seq";
CREATE SEQUENCE IF NOT EXISTS "School_SchoolID_seq";
CREATE SEQUENCE IF NOT EXISTS "Employer_EmployerID_seq";
CREATE SEQUENCE IF NOT EXISTS "ParticipantSchool_ParticipantSchoolID_seq";
CREATE SEQUENCE IF NOT EXISTS "ParticipantEmployer_ParticipantEmployerID_seq";
CREATE SEQUENCE IF NOT EXISTS "EventFrequency_EventFrequencyID_seq";
CREATE SEQUENCE IF NOT EXISTS "EventDetails_EventDetailsID_seq";
CREATE SEQUENCE IF NOT EXISTS "Event_EventID_seq";
CREATE SEQUENCE IF NOT EXISTS "Registration_RegistrationID_seq";
CREATE SEQUENCE IF NOT EXISTS "Survey_SurveyID_seq";
CREATE SEQUENCE IF NOT EXISTS "Milestone_MilestoneID_seq";
CREATE SEQUENCE IF NOT EXISTS "Donation_DonationID_seq";

-- Step 2: Set sequence values to max existing ID + 1
SELECT setval('"Participant_ParticipantID_seq"', COALESCE((SELECT MAX("ParticipantID") FROM "Participant"), 0) + 1, false);
SELECT setval('"School_SchoolID_seq"', COALESCE((SELECT MAX("SchoolID") FROM "School"), 0) + 1, false);
SELECT setval('"Employer_EmployerID_seq"', COALESCE((SELECT MAX("EmployerID") FROM "Employer"), 0) + 1, false);
SELECT setval('"ParticipantSchool_ParticipantSchoolID_seq"', COALESCE((SELECT MAX("ParticipantSchoolID") FROM "ParticipantSchool"), 0) + 1, false);
SELECT setval('"ParticipantEmployer_ParticipantEmployerID_seq"', COALESCE((SELECT MAX("ParticipantEmployerID") FROM "ParticipantEmployer"), 0) + 1, false);
SELECT setval('"EventFrequency_EventFrequencyID_seq"', COALESCE((SELECT MAX("EventFrequencyID") FROM "EventFrequency"), 0) + 1, false);
SELECT setval('"EventDetails_EventDetailsID_seq"', COALESCE((SELECT MAX("EventDetailsID") FROM "EventDetails"), 0) + 1, false);
SELECT setval('"Event_EventID_seq"', COALESCE((SELECT MAX("EventID") FROM "Event"), 0) + 1, false);
SELECT setval('"Registration_RegistrationID_seq"', COALESCE((SELECT MAX("RegistrationID") FROM "Registration"), 0) + 1, false);
SELECT setval('"Survey_SurveyID_seq"', COALESCE((SELECT MAX("SurveyID") FROM "Survey"), 0) + 1, false);
SELECT setval('"Milestone_MilestoneID_seq"', COALESCE((SELECT MAX("MilestoneID") FROM "Milestone"), 0) + 1, false);
SELECT setval('"Donation_DonationID_seq"', COALESCE((SELECT MAX("DonationID") FROM "Donation"), 0) + 1, false);

-- Step 3: Alter columns to use sequences as defaults
ALTER TABLE "Participant" ALTER COLUMN "ParticipantID" SET DEFAULT nextval('"Participant_ParticipantID_seq"');
ALTER TABLE "School" ALTER COLUMN "SchoolID" SET DEFAULT nextval('"School_SchoolID_seq"');
ALTER TABLE "Employer" ALTER COLUMN "EmployerID" SET DEFAULT nextval('"Employer_EmployerID_seq"');
ALTER TABLE "ParticipantSchool" ALTER COLUMN "ParticipantSchoolID" SET DEFAULT nextval('"ParticipantSchool_ParticipantSchoolID_seq"');
ALTER TABLE "ParticipantEmployer" ALTER COLUMN "ParticipantEmployerID" SET DEFAULT nextval('"ParticipantEmployer_ParticipantEmployerID_seq"');
ALTER TABLE "EventFrequency" ALTER COLUMN "EventFrequencyID" SET DEFAULT nextval('"EventFrequency_EventFrequencyID_seq"');
ALTER TABLE "EventDetails" ALTER COLUMN "EventDetailsID" SET DEFAULT nextval('"EventDetails_EventDetailsID_seq"');
ALTER TABLE "Event" ALTER COLUMN "EventID" SET DEFAULT nextval('"Event_EventID_seq"');
ALTER TABLE "Registration" ALTER COLUMN "RegistrationID" SET DEFAULT nextval('"Registration_RegistrationID_seq"');
ALTER TABLE "Survey" ALTER COLUMN "SurveyID" SET DEFAULT nextval('"Survey_SurveyID_seq"');
ALTER TABLE "Milestone" ALTER COLUMN "MilestoneID" SET DEFAULT nextval('"Milestone_MilestoneID_seq"');
ALTER TABLE "Donation" ALTER COLUMN "DonationID" SET DEFAULT nextval('"Donation_DonationID_seq"');

-- Step 4: Set sequence ownership (optional but recommended)
ALTER SEQUENCE "Participant_ParticipantID_seq" OWNED BY "Participant"."ParticipantID";
ALTER SEQUENCE "School_SchoolID_seq" OWNED BY "School"."SchoolID";
ALTER SEQUENCE "Employer_EmployerID_seq" OWNED BY "Employer"."EmployerID";
ALTER SEQUENCE "ParticipantSchool_ParticipantSchoolID_seq" OWNED BY "ParticipantSchool"."ParticipantSchoolID";
ALTER SEQUENCE "ParticipantEmployer_ParticipantEmployerID_seq" OWNED BY "ParticipantEmployer"."ParticipantEmployerID";
ALTER SEQUENCE "EventFrequency_EventFrequencyID_seq" OWNED BY "EventFrequency"."EventFrequencyID";
ALTER SEQUENCE "EventDetails_EventDetailsID_seq" OWNED BY "EventDetails"."EventDetailsID";
ALTER SEQUENCE "Event_EventID_seq" OWNED BY "Event"."EventID";
ALTER SEQUENCE "Registration_RegistrationID_seq" OWNED BY "Registration"."RegistrationID";
ALTER SEQUENCE "Survey_SurveyID_seq" OWNED BY "Survey"."SurveyID";
ALTER SEQUENCE "Milestone_MilestoneID_seq" OWNED BY "Milestone"."MilestoneID";
ALTER SEQUENCE "Donation_DonationID_seq" OWNED BY "Donation"."DonationID";

-- ============================================================
-- DONE! Schema is now fixed
-- ============================================================

