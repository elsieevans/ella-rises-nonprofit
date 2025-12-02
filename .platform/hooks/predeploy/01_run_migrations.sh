#!/bin/bash

# Pre-deploy hook to run database migrations
# This runs after npm install but before the application is switched to current

set -e

echo "Running database migrations..."

# We are already in the staging directory where the app code is
# No need to cd /var/app/current

# Run migrations
npm run migrate

echo "Migrations completed successfully"

