#!/bin/bash

# Post-deploy hook to run database migrations
# This runs after the application is deployed

set -e

echo "Running database migrations..."

cd /var/app/current

# Run migrations
npm run migrate

echo "Migrations completed successfully"

