# Schema Fix Deployment Guide

## Problem Summary

Your application has two database schema issues in production:

1. **Missing Columns**: The `Registration` table is missing:
   - `RegistrationCheckInTime` (TIMESTAMP)
   - `RegistrationAttendedFlag` (INTEGER)

2. **Missing Auto-Increment**: Primary key columns don't auto-increment, causing insert failures

## Solution Overview

This deployment includes:
- Complete SQL migration script (`fix-schema-complete.sql`)
- Automatic post-deployment hook (`.platform/hooks/postdeploy/01_run_schema_migration.sh`)
- Full application code

## Deployment Steps

### Option 1: Automatic Migration (Recommended)

The deployment package includes a post-deployment hook that will automatically run the schema migration after deployment.

1. **Deploy the application**:
   ```bash
   eb deploy
   ```

2. **Monitor the deployment**:
   - The hook will run automatically after deployment
   - Check logs: `eb logs` and look for "Running Schema Migration"

3. **Verify the fix**:
   - Visit your application
   - Try viewing a participant profile
   - Try creating a new participant

### Option 2: Manual Migration (If Automatic Fails)

If the automatic migration doesn't work, you can run it manually:

1. **SSH into your EC2 instance**:
   ```bash
   eb ssh
   ```

2. **Run the migration script**:
   ```bash
   cd /var/app/current
   
   # Set database credentials
   export PGPASSWORD="your-rds-password"
   
   # Run the migration
   psql -h your-rds-hostname \
        -p 5432 \
        -U ebroot \
        -d ebdb \
        -f fix-schema-complete.sql
   ```

3. **Check the output** for success messages

### Option 3: Direct Database Access

If you have direct access to the RDS database:

1. **Connect using pgAdmin or psql**
2. **Run the SQL script**: `fix-schema-complete.sql`
3. **Redeploy the application** (if needed)

## What the Migration Does

### Part 1: Add Missing Columns
```sql
ALTER TABLE "Registration" ADD COLUMN "RegistrationCheckInTime" TIMESTAMP NULL;
ALTER TABLE "Registration" ADD COLUMN "RegistrationAttendedFlag" INTEGER DEFAULT 0;
```

### Part 2: Add Auto-Increment Sequences
- Creates sequences for all primary key columns
- Sets sequence values to current max ID + 1
- Alters columns to use sequences as defaults
- Sets sequence ownership

## Verification

After deployment, verify the fix:

1. **Check columns exist**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Registration';
   ```

2. **Check sequences exist**:
   ```sql
   SELECT sequence_name 
   FROM information_schema.sequences 
   WHERE sequence_name LIKE '%_seq';
   ```

3. **Test auto-increment**:
   ```sql
   INSERT INTO "Participant" ("ParticipantFirstName", "ParticipantLastName") 
   VALUES ('Test', 'User');
   -- Should succeed without specifying ParticipantID
   ```

## Troubleshooting

### Migration Hook Doesn't Run

Check if `psql` is installed on the EC2 instance:
```bash
eb ssh
which psql
```

If not installed, you'll need to install PostgreSQL client or use the manual migration method.

### Permission Errors

Ensure the RDS user (`ebroot`) has permissions to:
- CREATE SEQUENCE
- ALTER TABLE
- ALTER SEQUENCE

### Migration Already Applied

The script is idempotent - it checks if columns/sequences exist before creating them. Running it multiple times is safe.

## Files Included

- `fix-schema-complete.sql` - Complete SQL migration script
- `.platform/hooks/postdeploy/01_run_schema_migration.sh` - Auto-run script
- All application files (server.js, routes/, views/, etc.)

## Support

If you encounter issues:
1. Check deployment logs: `eb logs`
2. Check the post-deploy hook output in `/var/log/eb-hooks.log`
3. Check application logs in `/var/log/web.stdout.log`

