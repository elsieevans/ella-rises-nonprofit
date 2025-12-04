# AI Assistant Setup Guide

## Overview

The AI Assistant is a chat-based helper that can analyze your Ella Rises database and provide insights. It appears as a button in the portal sidebar and opens a chat panel on the right side of the screen.

## Features

- Natural language queries about your data
- Read-only database access (cannot modify data)
- Real-time SQL query generation and execution
- Conversational interface with message history
- Insights and analysis of participants, events, donations, surveys, and milestones

## Setup Instructions

### 1. Get an OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the API key

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```env
# AI Assistant Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-3-sonnet
APP_URL=http://localhost:8080
```

**Environment Variable Descriptions:**

- `OPENROUTER_API_KEY` (required): Your OpenRouter API key
- `OPENROUTER_MODEL` (optional): The AI model to use. Defaults to `anthropic/claude-3-sonnet`
  - Available models: `anthropic/claude-3-sonnet`, `openai/gpt-4`, `openai/gpt-3.5-turbo`, etc.
  - See [OpenRouter Models](https://openrouter.ai/models) for full list
- `APP_URL` (optional): Your application URL for API tracking

### 3. Restart the Server

After adding the environment variables, restart your server:

```bash
npm start
```

## Usage

### Accessing the AI Assistant

1. Log in to the portal
2. Look for the "AI Assistant" button in the left sidebar (purple button with a question mark icon)
3. Click the button to open the chat panel
4. Type your question and press Enter or click the send button

### Example Questions

Here are some questions you can ask:

- "How many participants do we have?"
- "What were our total donations last month?"
- "Show me upcoming events"
- "Which schools have the most participants?"
- "What's the average satisfaction score from surveys?"
- "How many events did we have in 2024?"
- "Who are our top 5 donors?"
- "What types of events are most popular?"

### Tips for Best Results

1. **Be specific**: Include details like date ranges, event types, or specific metrics
2. **Ask one question at a time**: The AI works best with focused queries
3. **Use conversational language**: You don't need to know SQL - just ask naturally
4. **Follow up**: You can ask clarifying questions based on previous responses

## Security

### Data Access

- The AI can only **read** data from the database
- All queries are validated to ensure they're read-only (SELECT statements only)
- INSERT, UPDATE, DELETE, DROP, and other destructive operations are blocked
- The AI cannot modify your data or database structure

### Authentication

- Only authenticated portal users can access the AI Assistant
- All requests require a valid session

### SQL Validation

The system performs multiple security checks:
- Blocks dangerous SQL keywords (INSERT, UPDATE, DELETE, DROP, etc.)
- Prevents multiple queries (no semicolons allowed)
- Validates all queries before execution
- Uses parameterized queries to prevent SQL injection

## Troubleshooting

### AI Assistant Button Not Appearing

- Ensure you're logged into the portal
- Clear your browser cache and reload the page
- Check that the JavaScript file is loading: `/js/ai-chat.js`

### "AI service not configured" Error

- Verify that `OPENROUTER_API_KEY` is set in your `.env` file
- Restart the server after adding environment variables
- Check the server logs for any startup errors

### Slow Responses

- OpenRouter API calls can take 5-15 seconds depending on the model
- Complex queries may take longer to process
- Consider using a faster model like `openai/gpt-3.5-turbo` for quicker responses

### Query Errors

- If you get a "Query validation failed" error, the AI attempted a prohibited operation
- Try rephrasing your question in a different way
- Check the console logs for specific error details

## Cost Considerations

OpenRouter charges per API call based on token usage. Typical costs:
- Claude 3 Sonnet: ~$3-15 per million tokens
- GPT-3.5 Turbo: ~$0.50-1.50 per million tokens
- GPT-4: ~$30-60 per million tokens

A typical conversation exchange uses 500-2000 tokens, depending on:
- Length of your question
- Amount of data returned
- Length of the AI's response

**Recommendations:**
- Start with a lower-cost model for testing
- Monitor your OpenRouter dashboard for usage
- Consider implementing rate limiting for production use

## Technical Details

### File Structure

```
/config/schema-context.js     # Database schema description for AI
/routes/ai-assistant.js        # Backend API route
/public/js/ai-chat.js          # Frontend chat interface
/public/css/portal.css         # Chat UI styles (at the end)
/views/partials/portal-header.ejs # Chat panel HTML
```

### API Endpoint

`POST /portal/ai-assistant/chat`

**Request:**
```json
{
  "message": "How many participants do we have?",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "response": "You currently have 150 participants in your database.",
  "hasData": true,
  "timestamp": "2024-12-04T10:30:00.000Z"
}
```

## Future Enhancements

Potential improvements for future versions:
- Rate limiting per user
- Export chat history
- Visualization generation (charts/graphs)
- Scheduled report generation
- Multi-language support
- Voice input/output
- Custom data analysis scripts

## Support

For issues or questions about the AI Assistant:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Verify environment variables are correctly set
4. Ensure database connection is working

## Version

- Current Version: 1.0.0
- Last Updated: December 2024
- Compatible with: Node.js 14+, PostgreSQL 12+

