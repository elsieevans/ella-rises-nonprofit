# Elastic Beanstalk Deployment Guide

## Changes Made to Fix Deployment Timeout

### 1. **Updated server.js**
- Changed default port from 3000 to 8080 (Elastic Beanstalk standard)
- Server now listens on `0.0.0.0` to accept external connections
- Database connection is tested but doesn't block server startup
- Added graceful shutdown handling
- Added `/health` endpoint for health checks

### 2. **Added .ebextensions/01_nodecommand.config**
- Sets NODE_ENV to production
- Configures health check to use `/health` endpoint
- Sets appropriate timeouts and thresholds

## Required Environment Variables in Elastic Beanstalk

You MUST configure these environment variables in your Elastic Beanstalk environment:

### Database Configuration (RDS)
If you have an RDS PostgreSQL database:
```
RDS_HOSTNAME=your-database.xxxxx.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB_NAME=ella_rises
RDS_USERNAME=your_db_username
RDS_PASSWORD=your_db_password
```

OR if using custom database:
```
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=ella_rises
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_SSL=true
```

### Application Configuration
```
NODE_ENV=production
SESSION_SECRET=your-random-secret-key-here-make-it-long-and-secure
```

## How to Set Environment Variables in Elastic Beanstalk

### Using AWS Console:
1. Go to your Elastic Beanstalk environment
2. Click **Configuration** in the left sidebar
3. Under **Software**, click **Edit**
4. Scroll to **Environment properties**
5. Add each variable as a key-value pair
6. Click **Apply**

### Using EB CLI:
```bash
eb setenv RDS_HOSTNAME=your-host RDS_PORT=5432 RDS_DB_NAME=ella_rises RDS_USERNAME=your_user RDS_PASSWORD=your_password NODE_ENV=production SESSION_SECRET=your-secret
```

## Deployment Steps

1. **Set up your RDS database** (if not already done):
   - Go to AWS RDS console
   - Create a PostgreSQL database
   - Make sure the security group allows connections from your Elastic Beanstalk environment
   - Note down the hostname, port, database name, username, and password

2. **Configure environment variables** (see above)

3. **Upload the deployment package**:
   - Use `ella-rises-beanstalk-deploy-fixed.zip`
   - Upload via AWS Console or EB CLI

4. **Monitor the deployment**:
   - Watch the Events tab in Elastic Beanstalk console
   - Check the Logs if deployment fails
   - The health check endpoint is `/health`

## Database Setup

After successful deployment, you need to run migrations:

### Option 1: Using SSH to the instance
```bash
eb ssh
cd /var/app/current
npm run migrate
```

### Option 2: Add to .ebextensions
Create a file `.ebextensions/05_run_migrations.config`:
```yaml
container_commands:
  01_migrate:
    command: "npm run migrate"
    leader_only: true
```

## Troubleshooting

### Deployment still timing out?
1. Check CloudWatch logs:
   - Go to Elastic Beanstalk → Logs → Request Logs → Full Logs
   - Look for database connection errors
   - Check if environment variables are set correctly

2. Verify database connectivity:
   - Make sure RDS security group allows inbound traffic from EB security group
   - Test connection from EB instance: `eb ssh` then try connecting to database

3. Check health:
   - After deployment, test: `curl http://your-app-url.elasticbeanstalk.com/health`
   - Should return: `{"status":"healthy","timestamp":"..."}`

### Common Issues:

**Database connection timeout:**
- Verify RDS security group allows traffic from EB
- Check RDS is in available state
- Verify environment variables are correct

**502 Bad Gateway:**
- App isn't listening on port 8080
- Check logs for startup errors

**App keeps restarting:**
- Check for uncaught exceptions in logs
- Verify all required npm packages are in dependencies (not devDependencies)

## Files Included in Deployment

✅ Included:
- All application code
- `package.json` and `package-lock.json`
- `.ebextensions/` configuration
- `.platform/` hooks
- Public assets
- Views

❌ Excluded:
- `node_modules/` (installed during deployment)
- `.env` file (use environment variables instead)
- `.git/` directory
- Existing `.zip` files

## Next Steps After Deployment

1. Test the `/health` endpoint
2. Run database migrations
3. Test the application functionality
4. Set up SSL certificate (if using HTTPS)
5. Configure domain name (if needed)

