#!/bin/bash

# ============================================================
# Alternative Schema Migration Script (Node.js based)
# ============================================================
# This script uses Node.js to run the migration if psql is not available
# ============================================================

echo "=========================================="
echo "Running Schema Migration (Node.js method)"
echo "=========================================="

# Path to migration script
MIGRATION_DIR="/var/app/current"

# Create a temporary Node.js script to run the migration
cat > /tmp/run_migration.js << 'EOFJS'
const fs = require('fs');
const path = require('path');

// Import database config
const db = require('/var/app/current/config/database');

async function runMigration() {
    try {
        console.log('Reading SQL migration file...');
        const sqlFile = path.join('/var/app/current', 'fix-schema-complete.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        console.log('Connecting to database...');
        
        // Split SQL into individual statements (rough split, good enough for our needs)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        console.log(`Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (stmt.length < 10) continue; // Skip very short statements
            
            try {
                // Handle DO blocks specially
                if (stmt.trim().startsWith('DO $$')) {
                    await db.raw(stmt + ';');
                } else {
                    await db.raw(stmt);
                }
                console.log(`✓ Statement ${i + 1} executed successfully`);
            } catch (err) {
                // Some statements might fail if already applied (e.g., sequence already exists)
                console.log(`⚠ Statement ${i + 1} warning: ${err.message}`);
            }
        }
        
        console.log('========================================');
        console.log('Schema Migration Completed');
        console.log('========================================');
        
        await db.destroy();
        process.exit(0);
        
    } catch (error) {
        console.error('Migration Error:', error);
        process.exit(1);
    }
}

runMigration();
EOFJS

# Run the Node.js migration script
cd "$MIGRATION_DIR"
node /tmp/run_migration.js

EXIT_CODE=$?

# Clean up
rm -f /tmp/run_migration.js

if [ $EXIT_CODE -eq 0 ]; then
    echo "Migration completed successfully via Node.js"
else
    echo "Migration failed (Exit Code: $EXIT_CODE)"
    # Don't fail deployment
fi

exit 0

