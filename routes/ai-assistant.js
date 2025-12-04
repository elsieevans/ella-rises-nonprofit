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
    const sqlQuery = extractSqlQuery(aiResponse);
    
    if (sqlQuery) {
      try {
        // Execute the query
        queryResults = await executeSafeQuery(sqlQuery);

        // Send results back to AI for interpretation
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
      } catch (queryError) {
        console.error('Query execution error:', queryError);
        aiResponse = `I encountered an error while querying the database: ${queryError.message}. Please try rephrasing your question or ask something else.`;
      }
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

