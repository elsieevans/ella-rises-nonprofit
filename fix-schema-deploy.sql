-- ============================================================
-- PRODUCTION-SAFE: Add Auto-Increment to Primary Keys
-- ============================================================
-- This script is safe to run on deployed databases (AWS RDS)
-- It handles existing sequences and constraints gracefully
-- ============================================================

-- Begin transaction for safety
BEGIN;

-- ============================================================
-- Step 1: Drop existing sequences if they exist
-- ============================================================
DROP SEQUENCE IF EXISTS "Participant_ParticipantID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "School_SchoolID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "Employer_EmployerID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "ParticipantSchool_ParticipantSchoolID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "ParticipantEmployer_ParticipantEmployerID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "EventFrequency_EventFrequencyID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "EventDetails_EventDetailsID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "Event_EventID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "Registration_RegistrationID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "Survey_SurveyID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "Milestone_MilestoneID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "Donation_DonationID_seq" CASCADE;

-- ============================================================
-- Step 2: Create fresh sequences for each table
-- ============================================================
CREATE SEQUENCE "Participant_ParticipantID_seq";
CREATE SEQUENCE "School_SchoolID_seq";
CREATE SEQUENCE "Employer_EmployerID_seq";
CREATE SEQUENCE "ParticipantSchool_ParticipantSchoolID_seq";
CREATE SEQUENCE "ParticipantEmployer_ParticipantEmployerID_seq";
CREATE SEQUENCE "EventFrequency_EventFrequencyID_seq";
CREATE SEQUENCE "EventDetails_EventDetailsID_seq";
CREATE SEQUENCE "Event_EventID_seq";
CREATE SEQUENCE "Registration_RegistrationID_seq";
CREATE SEQUENCE "Survey_SurveyID_seq";
CREATE SEQUENCE "Milestone_MilestoneID_seq";
CREATE SEQUENCE "Donation_DonationID_seq";

-- ============================================================
-- Step 3: Set sequence values to max existing ID + 1
-- ============================================================
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

-- ============================================================
-- Step 4: Drop existing defaults before adding new ones
-- ============================================================
ALTER TABLE "Participant" ALTER COLUMN "ParticipantID" DROP DEFAULT;
ALTER TABLE "School" ALTER COLUMN "SchoolID" DROP DEFAULT;
ALTER TABLE "Employer" ALTER COLUMN "EmployerID" DROP DEFAULT;
ALTER TABLE "ParticipantSchool" ALTER COLUMN "ParticipantSchoolID" DROP DEFAULT;
ALTER TABLE "ParticipantEmployer" ALTER COLUMN "ParticipantEmployerID" DROP DEFAULT;
ALTER TABLE "EventFrequency" ALTER COLUMN "EventFrequencyID" DROP DEFAULT;
ALTER TABLE "EventDetails" ALTER COLUMN "EventDetailsID" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "EventID" DROP DEFAULT;
ALTER TABLE "Registration" ALTER COLUMN "RegistrationID" DROP DEFAULT;
ALTER TABLE "Survey" ALTER COLUMN "SurveyID" DROP DEFAULT;
ALTER TABLE "Milestone" ALTER COLUMN "MilestoneID" DROP DEFAULT;
ALTER TABLE "Donation" ALTER COLUMN "DonationID" DROP DEFAULT;

-- ============================================================
-- Step 5: Set new defaults using the sequences
-- ============================================================
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

-- ============================================================
-- Step 6: Set sequence ownership (ensures sequences are managed with tables)
-- ============================================================
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

-- Commit the transaction
COMMIT;

-- ============================================================
-- VERIFICATION QUERY (Optional - run after the script)
-- ============================================================
-- SELECT 
--   table_name, 
--   column_name, 
--   column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND column_name LIKE '%ID'
--   AND table_name IN ('Participant', 'School', 'Employer', 'ParticipantSchool', 
--                      'ParticipantEmployer', 'EventFrequency', 'EventDetails', 
--                      'Event', 'Registration', 'Survey', 'Milestone', 'Donation')
-- ORDER BY table_name;

-- ============================================================
-- SUCCESS! Primary keys now have auto-increment behavior
-- ============================================================

