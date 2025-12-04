# Deployment Fix

The previous deployment failed because the `Procfile` could not be parsed by the AWS Elastic Beanstalk rsyslog generator. This is typically due to trailing newlines or incorrect formatting.

## Changes Made
- Cleaned up `Procfile` to contain a single line: `web: node server.js`
- Verified `server.js` listens on `process.env.PORT`.

## Update v3 (Database Debugging)
- Added detailed error messages to "Error loading participant details" and "Error loading event details".
- Added a debug route `/portal/debug-schema` to inspect the database tables and columns.

## Update v4 (Database Auto-Fix)
- Identified that `Registration` table is missing `RegistrationCheckInTime` and `RegistrationAttendedFlag` columns in production.
- Added a one-time fix route: `/portal/fix-db-schema`.

## How to Fix the Production Database
1. Deploy `ella-rises-beanstalk-deploy-fixed-v4.zip`.
2. Log in to the portal as an Admin.
3. Navigate to: `https://your-site-url.com/portal/fix-db-schema`
4. You should see a success message indicating the columns were added.
5. Try accessing the participant/event details again.

## How to Deploy
1. Upload `ella-rises-beanstalk-deploy-fixed-v4.zip` to AWS Elastic Beanstalk.
