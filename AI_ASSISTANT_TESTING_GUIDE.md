# AI Assistant Testing Guide

## Changes Implemented

### 1. Enhanced System Prompt (config/schema-context.js)

**New Features:**
- ✅ **Structured Reasoning Workflow** with three phases:
  - **CLARIFY Phase**: Detects ambiguous questions and asks for clarification
  - **PLAN Phase**: Internal planning before generating SQL
  - **SQL Phase**: Generates simple, clean SQL with strict constraints

- ✅ **SQL Complexity Constraints**:
  - Maximum 2-3 CTEs
  - No nested aggregates
  - Simple window functions only
  - Simple JSON aggregation (no ORDER BY inside)
  - No correlated subqueries
  - Prefer simple GROUP BY

- ✅ **Semantic Schema Guidance**:
  - Clear relationship explanations
  - Key column meanings (e.g., RegistrationAttendedFlag: 1 = attended, 0 = not attended)
  - Proper join patterns

- ✅ **6 Few-Shot Examples** showing:
  - Simple count query
  - Event attendance analysis
  - Milestone distribution
  - Donation trends by month
  - Repeat event attendance (retention)
  - Ambiguous question handling

### 2. SQL Repair Loop (routes/ai-assistant.js)

**New Features:**
- ✅ **Error Recovery**: When SQL fails, sends the full database error back to AI
- ✅ **Single Retry**: AI gets ONE chance to fix the SQL based on error message
- ✅ **Lower Temperature**: Uses temperature 0.5 for repair attempts (more precise)
- ✅ **Clear User Feedback**: If both attempts fail, explains the issue and asks for rephrasing

### 3. Comprehensive Logging (routes/ai-assistant.js)

**New Features:**
- ✅ Logs user questions
- ✅ Logs generated SQL queries
- ✅ Logs query success/failure
- ✅ Logs repair attempts
- ✅ Logs final outcomes
- ✅ Visual separators for easy reading

## Testing Scenarios

### Test Case 1: Ambiguous Questions (Should Ask for Clarification)

**Questions to Test:**
```
1. "Give me insights about retention"
2. "Analyze milestone performance"
3. "Tell me about our surveys"
4. "What's happening with donations?"
5. "Show me participant data"
```

**Expected Behavior:**
- ❌ Should NOT generate SQL immediately
- ✅ Should ask clarifying questions with 2-4 specific options
- ✅ Should explain what aspects can be analyzed

**What to Check:**
- Response contains questions and options
- No `[SQL_QUERY]` tags in initial response
- User needs to provide more specific request

---

### Test Case 2: Specific Questions (Should Work First Try)

**Questions to Test:**
```
1. "How many participants do we have?"
2. "What's the attendance rate for events in 2024?"
3. "Show me the top 5 milestone types"
4. "How many participants attended more than one event?"
5. "What's the total donation amount?"
```

**Expected Behavior:**
- ✅ Generates simple SQL on first attempt
- ✅ Query executes successfully
- ✅ Provides clear, insightful interpretation with specific numbers

**What to Check in Console:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI ASSISTANT - SQL Query Attempt #1
User Question: [your question]
Generated SQL: [SQL query]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Query executed successfully
Result rows: [number]
```

---

### Test Case 3: Complex Analytical Questions (Should Simplify)

**Questions to Test:**
```
1. "Analyze donation patterns by month and show trends"
2. "What's our NPS score by event type?"
3. "Show participant engagement metrics"
4. "Calculate retention rates for 2024"
```

**Expected Behavior:**
- ✅ Generates SQL with 2-3 CTEs maximum
- ✅ No nested aggregates
- ✅ Clear, readable SQL structure
- ✅ Query executes successfully

**What to Check:**
- SQL is not overly complex (count the CTEs)
- No syntax like `AVG(COUNT(...))` or `SUM(AVG(...))`
- No ORDER BY inside `json_agg()` or `row_to_json()`

---

### Test Case 4: Error Recovery (Should Fix on Retry)

**Questions to Test (Intentionally Tricky):**
```
1. "Show me events by EventName" (might cause ambiguity - is it EventDetails.EventName?)
2. "What's the average of survey scores" (needs proper column names)
3. "List participants who donated" (needs proper join)
```

**Expected Behavior:**
- ❌ First query might fail (syntax or column error)
- ✅ System logs the error
- ✅ AI generates a repaired query
- ✅ Second attempt succeeds
- ✅ User sees final result (not aware of retry)

**What to Check in Console:**
```
✗ Query failed: [error message]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI ASSISTANT - Attempting SQL Repair
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated Repaired SQL: [corrected SQL]
✓ Repaired query executed successfully
```

---

### Test Case 5: Double Failure (Should Ask User to Rephrase)

**Questions to Test (Intentionally Problematic):**
```
1. "Give me nested aggregate analysis" (explicitly requests forbidden SQL)
2. "Show me data from TableThatDoesntExist"
3. "Calculate complex PARTITION BY with aggregates"
```

**Expected Behavior:**
- ❌ First query fails
- ❌ Repair attempt also fails
- ✅ Clear message to user: "I'm having trouble querying the database for that information..."
- ✅ Asks user to rephrase or simplify

**What to Check in Console:**
```
✗ Query failed: [error]
✗ Repaired query also failed: [error]
✗ Both query attempts failed. Asking user to rephrase.
```

**What to Check in UI:**
- Message explains the error
- Suggests rephrasing or being more specific
- No raw SQL or technical jargon (user-friendly)

---

## Console Log Examples

### Successful Query Flow:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI ASSISTANT - SQL Query Attempt #1
User Question: How many participants do we have?
Generated SQL: SELECT COUNT(*) as total_participants FROM "Participant"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Query executed successfully
Result rows: 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Repaired Query Flow:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI ASSISTANT - SQL Query Attempt #1
User Question: What's the average satisfaction?
Generated SQL: SELECT AVG(SatisfactionScore) FROM "Survey"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ Query failed: column "satisfactionscore" does not exist
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI ASSISTANT - Attempting SQL Repair
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated Repaired SQL: SELECT AVG("SurveySatisfactionScore") FROM "Survey"
✓ Repaired query executed successfully
Result rows: 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Success Metrics

After testing, you should see:

✅ **90%+ First-Attempt Success Rate** for specific questions
✅ **Zero Nested Aggregate Errors** (forbidden by constraints)
✅ **Zero Invalid Postgres Syntax** (proper casting, ROUND usage)
✅ **Clear Clarifying Questions** for ambiguous prompts
✅ **Successful Error Recovery** on retry for fixable errors
✅ **User-Friendly Messages** when queries can't be fixed

---

## Quick Test Script

Run these questions in sequence:

1. **Ambiguous**: "Give me insights about retention"
   - Should ask clarifying questions

2. **Simple**: "How many participants do we have?"
   - Should work immediately

3. **Moderate**: "Show event attendance rates by month for 2024"
   - Should generate 2-3 CTEs max

4. **Follow-up**: After #1, respond with: "Show me repeat attendance rates"
   - Should now generate specific SQL

5. **Complex**: "What's our NPS score from surveys?"
   - Should handle NPS calculation properly

---

## Notes

- The server is running with nodemon, so changes are already loaded
- Check the console logs for detailed SQL query tracking
- Test with your actual database data
- If database tables don't exist, seed data first
- The AI will respect the [SQL_QUERY] tag format

---

## Rollback Plan

If issues occur, revert:
1. `git checkout HEAD -- config/schema-context.js`
2. `git checkout HEAD -- routes/ai-assistant.js`
3. Restart server: `npm run dev`

