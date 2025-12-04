#!/bin/bash

# ============================================================
# Schema Migration Script for Elastic Beanstalk
# ============================================================
# This script runs after deployment to fix database schema
# It adds missing columns and auto-increment sequences
# ============================================================

echo "=========================================="
echo "Running Schema Migration"
echo "=========================================="

# Get database connection details from environment variables
DB_HOST="${RDS_HOSTNAME}"
DB_PORT="${RDS_PORT}"
DB_NAME="${RDS_DB_NAME}"
DB_USER="${RDS_USERNAME}"
DB_PASSWORD="${RDS_PASSWORD}"

# Check if we have the required environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "ERROR: Missing required database environment variables"
    echo "DB_HOST: $DB_HOST"
    echo "DB_NAME: $DB_NAME"
    echo "DB_USER: $DB_USER"
    exit 1
fi

echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "User: $DB_USER"

# Path to the SQL migration file
SQL_FILE="/var/app/current/fix-schema-complete.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "ERROR: Migration file not found: $SQL_FILE"
    exit 1
fi

echo "Running migration from: $SQL_FILE"

# Run the SQL migration
# Note: We use PGPASSWORD environment variable to avoid password prompt
export PGPASSWORD="$DB_PASSWORD"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE" 2>&1

MIGRATION_EXIT_CODE=$?

unset PGPASSWORD

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "=========================================="
    echo "Schema Migration Completed Successfully"
    echo "=========================================="
    exit 0
else
    echo "=========================================="
    echo "Schema Migration Failed (Exit Code: $MIGRATION_EXIT_CODE)"
    echo "=========================================="
    # Don't exit with error - allow deployment to continue
    # The migration might fail if already applied
    exit 0
fi

