# Quick Deployment Instructions

## What's Fixed in This Package

✅ **Complete application code** (server.js, Procfile, package.json, etc.)
✅ **Schema migration script** (fix-schema-complete.sql)
✅ **Automatic migration hook** (.platform/hooks/postdeploy/01_run_schema_migration.sh)

## Deploy Now

### Step 1: Upload to Elastic Beanstalk

Use the AWS Console:
1. Go to Elastic Beanstalk console
2. Select your environment
3. Click "Upload and deploy"
4. Choose file: `ella-rises-schema-fix-deploy.zip`
5. Click "Deploy"

OR use the EB CLI:
```bash
eb deploy
```

### Step 2: Monitor Deployment

Watch the deployment logs:
```bash
eb logs
```

Look for these success messages:
- "Running Schema Migration"
- "Schema Migration Completed Successfully"

### Step 3: Verify

1. Visit your website: https://ellarisessola.is404.net
2. Log in to the portal
3. Try viewing a participant (this was failing before)
4. Try creating a new participant (this will test auto-increment)

## What Happens During Deployment

1. **Application deploys** - All files are copied to `/var/app/current/`
2. **Node.js starts** - Server starts on port 8080
3. **Post-deploy hook runs** - Schema migration executes automatically
4. **Database is fixed** - Missing columns added, auto-increment enabled

## If Automatic Migration Fails

The post-deploy hook requires `psql` to be installed on the EC2 instance. If it's not installed, you can:

### Option A: Install psql and redeploy
```bash
eb ssh
sudo yum install postgresql -y
exit
eb deploy
```

### Option B: Run migration manually
```bash
eb ssh
cd /var/app/current

export PGPASSWORD="your-rds-password"
psql -h your-rds-hostname -p 5432 -U ebroot -d ebdb -f fix-schema-complete.sql
```

### Option C: Use the web-based fix route
1. Log in to your portal as a manager
2. Visit: https://ellarisessola.is404.net/portal/fix-db-schema
3. This will add the missing columns (but not the auto-increment sequences)

## Current Errors Being Fixed

### Error 1: Missing Column
```
column Registration.RegistrationCheckInTime does not exist
```
**Fixed by**: Adding `RegistrationCheckInTime` and `RegistrationAttendedFlag` columns

### Error 2: Auto-increment Not Working
**Fixed by**: Creating sequences and setting them as default values for primary keys

## Need Help?

Check these logs:
- Deployment: `eb logs`
- Post-deploy hooks: `/var/log/eb-hooks.log`
- Application: `/var/log/web.stdout.log`
- Database errors: `/var/log/eb-engine.log`

## Files in This Package

- `ella-rises-schema-fix-deploy.zip` - Complete deployment package
- `fix-schema-complete.sql` - SQL migration script
- `.platform/hooks/postdeploy/01_run_schema_migration.sh` - Auto-run script
- `SCHEMA_FIX_DEPLOYMENT.md` - Detailed deployment guide
- All application files (routes, views, public assets, etc.)

