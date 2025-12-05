const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');
const { getSystemPrompt } = require('../config/schema-context');
const OpenAI = require('openai');

// Initialize OpenRouter client (compatible with OpenAI SDK)
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || "http://localhost:8080",
    "X-Title": "Ella Rises AI Assistant"
  }
});

// SQL validation - ensure query is read-only
function isValidReadOnlyQuery(sql) {
  if (!sql || typeof sql !== 'string') {
    return { valid: false, error: 'Invalid query format' };
  }

  // Remove comments and normalize whitespace
  const cleanSql = sql
    .replace(/--[^\n]*/g, '') // Remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .trim()
    .toUpperCase();

  // Check for dangerous keywords
  const dangerousKeywords = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
    'TRUNCATE', 'REPLACE', 'MERGE', 'GRANT', 'REVOKE',
    'EXEC', 'EXECUTE', 'CALL', 'PROCEDURE'
  ];

  for (const keyword of dangerousKeywords) {
    // Use word boundaries to avoid false positives
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    if (pattern.test(cleanSql)) {
      return { valid: false, error: `Query contains forbidden keyword: ${keyword}` };
    }
  }

  // Check for semicolons (prevents multiple queries)
  // Remove trailing semicolon first (single trailing semicolon is allowed)
  const sqlWithoutTrailingSemicolon = cleanSql.replace(/;\s*$/, '');
  if (sqlWithoutTrailingSemicolon.includes(';')) {
    return { valid: false, error: 'Multiple queries not allowed' };
  }

  // Must start with SELECT or WITH (for CTEs)
  if (!cleanSql.startsWith('SELECT') && !cleanSql.startsWith('WITH')) {
    return { valid: false, error: 'Query must start with SELECT or WITH' };
  }

  return { valid: true };
}

// Extract SQL query from AI response
function extractSqlQuery(text) {
  const sqlMatch = text.match(/\[SQL_QUERY\]([\s\S]*?)\[\/SQL_QUERY\]/);
  if (sqlMatch && sqlMatch[1]) {
    return sqlMatch[1].trim();
  }
  return null;
}

// Execute SQL query safely
async function executeSafeQuery(sql) {
  const validation = isValidReadOnlyQuery(sql);
  
  if (!validation.valid) {
    throw new Error(`Query validation failed: ${validation.error}`);
  }

  try {
    const results = await db.raw(sql);
    return results.rows || results;
  } catch (error) {
    console.error('Query execution error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

// Main chat endpoint
router.post('/chat', isAuthenticated, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact administrator.' 
      });
    }

    // Build conversation messages
    const messages = [
      { role: 'system', content: getSystemPrompt() }
    ];

    // Add conversation history (limit to last 10 messages to control token usage)
    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory);

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call AI to analyze the question
    const initialResponse = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-sonnet',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500
    });

    let aiResponse = initialResponse.choices[0].message.content;
    let queryResults = null;

    // Check if AI wants to execute a query
    let sqlQuery = extractSqlQuery(aiResponse);
    
    if (sqlQuery) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('AI ASSISTANT - SQL Query Attempt #1');
      console.log('User Question:', message);
      console.log('Generated SQL:', sqlQuery);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      let queryError = null;
      let retryAttempted = false;
      
      try {
        // First attempt to execute the query
        queryResults = await executeSafeQuery(sqlQuery);
        console.log('✓ Query executed successfully');
        console.log('Result rows:', queryResults.length);
      } catch (firstError) {
        queryError = firstError;
        console.error('✗ Query failed:', firstError.message);
        
        // SQL REPAIR LOOP - Give AI one chance to fix the error
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('AI ASSISTANT - Attempting SQL Repair');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        try {
          const repairMessages = [
            ...messages,
            { role: 'assistant', content: aiResponse },
            { 
              role: 'user', 
              content: `The SQL query failed with the following error:\n\n${firstError.message}\n\nPlease revise the SQL to fix ONLY the problem identified in the error message. Do not change the overall logic or intent of the query. Generate the corrected SQL using the [SQL_QUERY]...[/SQL_QUERY] tags.`
            }
          ];

          const repairResponse = await openai.chat.completions.create({
            model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-sonnet',
            messages: repairMessages,
            temperature: 0.5, // Lower temperature for more precise corrections
            max_tokens: 1500
          });

          const repairedAiResponse = repairResponse.choices[0].message.content;
          const repairedSql = extractSqlQuery(repairedAiResponse);
          
          if (repairedSql) {
            retryAttempted = true;
            console.log('Generated Repaired SQL:', repairedSql);
            
            // Try the repaired query
            queryResults = await executeSafeQuery(repairedSql);
            console.log('✓ Repaired query executed successfully');
            console.log('Result rows:', queryResults.length);
            
            // Update the SQL query for logging
            sqlQuery = repairedSql;
            queryError = null; // Clear the error since repair succeeded
          } else {
            console.error('✗ AI did not generate a repaired SQL query');
          }
        } catch (secondError) {
          console.error('✗ Repaired query also failed:', secondError.message);
          queryError = secondError; // Keep the second error for user feedback
        }
      }
      
      // If we have successful query results, interpret them
      if (queryResults !== null) {
        const followUpMessages = [
          ...messages,
          { role: 'assistant', content: aiResponse },
          { 
            role: 'user', 
            content: `Here are the query results:\n\n${JSON.stringify(queryResults, null, 2)}\n\nPlease provide a clear, insightful response based on these results. Do not include SQL queries in your response.`
          }
        ];

        const finalResponse = await openai.chat.completions.create({
          model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-sonnet',
          messages: followUpMessages,
          temperature: 0.7,
          max_tokens: 1000
        });

        aiResponse = finalResponse.choices[0].message.content;
      } else if (queryError) {
        // Both attempts failed - provide clear feedback to user
        if (retryAttempted) {
          console.error('✗ Both query attempts failed. Asking user to rephrase.');
          aiResponse = `I'm having trouble querying the database for that information. The query encountered an error: "${queryError.message}". Could you rephrase your question or ask for something more specific? For example, you could try asking for a simpler metric or a different time period.`;
        } else {
          aiResponse = `I encountered an error while querying the database: ${queryError.message}. Please try rephrasing your question or ask something else.`;
        }
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Remove any remaining SQL query tags from response
    aiResponse = aiResponse.replace(/\[SQL_QUERY\][\s\S]*?\[\/SQL_QUERY\]/g, '').trim();

    res.json({
      response: aiResponse,
      hasData: queryResults !== null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    
    // Handle specific OpenRouter/API errors
    if (error.status === 401) {
      return res.status(500).json({ 
        error: 'AI service authentication failed. Please contact administrator.' 
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait a moment and try again.' 
      });
    }

    res.status(500).json({ 
      error: 'An error occurred while processing your request. Please try again.' 
    });
  }
});

// Health check endpoint
router.get('/health', isAuthenticated, (req, res) => {
  const isConfigured = !!process.env.OPENROUTER_API_KEY;
  res.json({ 
    status: 'ok',
    configured: isConfigured,
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-sonnet'
  });
});

module.exports = router;

