# AI Assistant Markdown Formatting Update

## Summary of Changes

The AI Assistant's output formatting has been upgraded from a custom regex-based parser to a robust, standard Markdown library.

### 1. New Libraries Added
We have added two lightweight, battle-tested libraries via CDN to the portal header (`views/partials/portal-header.ejs`):

- **Marked.js** (`marked`): A fast, lightweight Markdown parser.
  - Handles all standard Markdown syntax (bold, italic, lists, headers, code blocks, tables, blockquotes, etc.).
  - Configured to support GitHub Flavored Markdown (GFM).
  - Handles line breaks correctly (`breaks: true`).

- **DOMPurify**: A DOM-only, super-fast, uber-tolerant XSS sanitizer for HTML.
  - Ensures that the HTML generated from the Markdown is safe to render.
  - Prevents Cross-Site Scripting (XSS) attacks if the AI were to generate malicious scripts (though unlikely, it's a security best practice).

### 2. Frontend Updates
The `public/js/ai-chat.js` file has been updated to use these libraries:

- **Robust Parsing**: Replaced the brittle `formatMessage` function with `marked.parse()`.
- **Security**: Added `DOMPurify.sanitize()` to clean the output before rendering.
- **Fallbacks**: If for some reason the libraries fail to load (e.g., CDN issues), the system falls back to a basic text escaper to ensure the chat remains functional.

### 3. Styling
The existing CSS in `public/css/portal.css` was already well-structured to handle standard HTML elements (tables, lists, code blocks, etc.), so it works seamlessly with the output from `marked`.

## Benefits
- **Better Formatting**: Tables, nested lists, and code blocks will now render perfectly.
- **Fewer Bugs**: Edge cases that broke the custom regex (like line breaks in code blocks or complex nested formatting) are now handled correctly.
- **Security**: Output is sanitized against XSS.

