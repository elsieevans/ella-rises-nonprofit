# AI Assistant - Quick Start Guide

## What Was Implemented

A fully functional AI-powered chat assistant has been added to your portal! Here's what you got:

### ✅ Backend (Completed)
- **AI Route** (`routes/ai-assistant.js`): Handles chat requests, generates SQL queries, validates security
- **Schema Context** (`config/schema-context.js`): Provides database schema information to the AI
- **SQL Validation**: Blocks dangerous queries (INSERT, UPDATE, DELETE, etc.)
- **OpenRouter Integration**: Uses OpenAI-compatible SDK to communicate with AI models

### ✅ Frontend (Completed)
- **Help Button**: Purple button in the sidebar footer (with question mark icon)
- **Chat Panel**: Slides in from the right side when clicked
- **Message Interface**: Clean chat UI with user and AI message bubbles
- **Loading Indicators**: Animated typing indicator while AI thinks
- **Auto-scroll**: Automatically scrolls to show new messages

### ✅ Styling (Completed)
- **Modern Design**: Matches your existing portal theme
- **Responsive**: Works on desktop and mobile
- **Animations**: Smooth slide-in transitions and message animations
- **Color Scheme**: Uses your brand colors (teal, magenta, sage green)

## 🚀 How to Use (3 Easy Steps)

### Step 1: Get Your API Key

1. Go to https://openrouter.ai/
2. Sign up for a free account
3. Click "API Keys" in the dashboard
4. Create a new key and copy it

### Step 2: Add to Environment Variables

Open your `.env` file and add these three lines:

```env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=anthropic/claude-3-sonnet
APP_URL=http://localhost:8080
```

**Replace `your_key_here` with your actual API key from Step 1.**

### Step 3: Restart Your Server

```bash
npm start
```

That's it! 🎉

## 📱 Using the AI Assistant

1. **Open the portal** (log in if needed)
2. **Look for the purple "AI Assistant" button** in the left sidebar (near the bottom)
3. **Click it** to open the chat panel
4. **Ask a question** like:
   - "How many participants do we have?"
   - "What were our donations last month?"
   - "Show me upcoming events"
   - "Which schools have the most participants?"

## 💰 Cost Information

OpenRouter charges based on usage:
- **Claude 3 Sonnet** (recommended): ~$3 per million tokens
- **GPT-3.5 Turbo** (cheaper): ~$0.50 per million tokens
- **GPT-4** (most powerful): ~$30 per million tokens

**What's a million tokens?** A typical conversation exchange is 500-2000 tokens, so:
- Claude 3 Sonnet: ~$0.0015 - $0.006 per question
- Roughly 200-500 questions for $1

💡 **Tip**: Start with Claude 3 Sonnet (default) for the best balance of cost and quality.

## 🔒 Security Features

Your data is safe:
- ✅ **Read-only access**: AI can only SELECT data, never modify
- ✅ **Authenticated users only**: Must be logged into portal
- ✅ **SQL validation**: All queries checked before execution
- ✅ **No SQL injection**: Queries are validated and sanitized

## 📂 Files Created/Modified

**New Files:**
- `/routes/ai-assistant.js` - Backend API endpoint
- `/config/schema-context.js` - Database schema for AI
- `/public/js/ai-chat.js` - Frontend chat functionality
- `/AI_ASSISTANT_README.md` - Full documentation
- `/AI_ASSISTANT_QUICK_START.md` - This file

**Modified Files:**
- `/server.js` - Added AI route
- `/package.json` - Added openai and axios dependencies
- `/views/partials/portal-header.ejs` - Added chat UI
- `/public/css/portal.css` - Added chat styles

## ❓ Troubleshooting

### "AI service not configured" error
→ Make sure `OPENROUTER_API_KEY` is in your `.env` file and restart the server

### Button doesn't appear
→ Clear cache and reload, or check that you're logged into the portal

### Slow responses
→ Normal! AI can take 5-15 seconds to respond. Consider using GPT-3.5 for faster (but less accurate) responses

### Query errors
→ Try rephrasing your question. The AI might have tried an invalid operation.

## 📖 Need More Help?

- See **AI_ASSISTANT_README.md** for complete documentation
- Check server logs for error details
- Verify your `.env` file has the correct API key

---

**Enjoy your new AI assistant!** 🤖✨

