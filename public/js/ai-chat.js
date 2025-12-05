/**
 * AI Chat Assistant Frontend
 * Handles the AI chat interface interactions
 */

(function() {
  'use strict';

  // State management
  let conversationHistory = [];
  let isWaitingForResponse = false;

  // DOM elements
  let helpButton, chatPanel, closeButton, messagesContainer, input, sendButton, resizeHandle;

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    helpButton = document.getElementById('ai-help-button');
    chatPanel = document.getElementById('ai-chat-panel');
    closeButton = document.getElementById('ai-chat-close');
    messagesContainer = document.getElementById('ai-chat-messages');
    input = document.getElementById('ai-chat-input');
    sendButton = document.getElementById('ai-chat-send');
    resizeHandle = document.getElementById('ai-chat-resize-handle');

    // Check if elements exist
    if (!helpButton || !chatPanel || !closeButton || !messagesContainer || !input || !sendButton) {
      console.error('AI Chat: Required elements not found');
      return;
    }

    // Initialize resize functionality if resize handle exists
    if (resizeHandle) {
      initResizeFunctionality();
    }

    // Event listeners
    helpButton.addEventListener('click', openChat);
    closeButton.addEventListener('click', closeChat);
    sendButton.addEventListener('click', sendMessage);
    
    // Send on Enter, Shift+Enter for new line
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });
  });

  function openChat() {
    chatPanel.classList.add('open');
    input.focus();
  }

  function closeChat() {
    chatPanel.classList.remove('open');
  }

  function sendMessage() {
    if (isWaitingForResponse) return;

    const message = input.value.trim();
    if (!message) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Add user message to UI
    addMessage(message, 'user');

    // Add user message to conversation history
    conversationHistory.push({
      role: 'user',
      content: message
    });

    // Show loading indicator
    const loadingId = showLoading();
    isWaitingForResponse = true;
    sendButton.disabled = true;

    // Send to backend
    fetch('/portal/ai-assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        conversationHistory: conversationHistory
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Failed to get response from AI');
        });
      }
      return response.json();
    })
    .then(data => {
      // Remove loading indicator
      removeLoading(loadingId);

      // Add AI response to UI
      addMessage(data.response, 'ai');

      // Add AI response to conversation history
      conversationHistory.push({
        role: 'assistant',
        content: data.response
      });

      // Limit conversation history to last 20 messages (10 exchanges)
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
      }
    })
    .catch(error => {
      console.error('AI Chat error:', error);
      removeLoading(loadingId);
      addMessage('Sorry, I encountered an error: ' + error.message + '. Please try again.', 'ai', true);
    })
    .finally(() => {
      isWaitingForResponse = false;
      sendButton.disabled = false;
      input.focus();
    });
  }

  function addMessage(content, sender, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
    
    if (isError) {
      messageDiv.classList.add('error-message');
    }

    const avatar = document.createElement('div');
    avatar.className = sender === 'user' ? 'user-message-avatar' : 'ai-message-avatar';
    avatar.textContent = sender === 'user' ? 'You' : 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = sender === 'user' ? 'user-message-content' : 'ai-message-content';
    
    // Convert line breaks to <br> and process the content
    const formattedContent = formatMessage(content);
    contentDiv.innerHTML = formattedContent;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function formatMessage(content) {
    // Use marked library if available for robust Markdown parsing
    if (typeof marked !== 'undefined') {
      try {
        // Configure marked options
        marked.setOptions({
          breaks: true, // Enable GFM line breaks
          gfm: true,
          headerIds: false, // Prevent automatic ID generation for headers
          mangle: false // Prevent email address mangling
        });
        
        // Parse markdown
        let html = marked.parse(content);
        
        // Sanitize HTML if DOMPurify is available to prevent XSS
        if (typeof DOMPurify !== 'undefined') {
          // Allow specific attributes for links (target="_blank")
          html = DOMPurify.sanitize(html, {
            ADD_ATTR: ['target']
          });
        }
        
        return html;
      } catch (e) {
        console.error('Error parsing markdown:', e);
        // Fallback to basic text if parsing fails
      }
    }

    // Fallback if marked is not loaded or fails
    let formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    // Basic line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }

  function showLoading() {
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-message loading-message';
    loadingDiv.id = loadingId;

    const avatar = document.createElement('div');
    avatar.className = 'ai-message-avatar';
    avatar.textContent = 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'ai-message-content';
    contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    loadingDiv.appendChild(avatar);
    loadingDiv.appendChild(contentDiv);

    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return loadingId;
  }

  function removeLoading(loadingId) {
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  // Close chat when clicking outside
  document.addEventListener('click', function(e) {
    if (!chatPanel || !helpButton) return;

    if (chatPanel.classList.contains('open') &&
        !chatPanel.contains(e.target) &&
        !helpButton.contains(e.target)) {
      closeChat();
    }
  });

  // Resize functionality
  function initResizeFunctionality() {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    // Load saved width from localStorage
    const savedWidth = localStorage.getItem('ai-chat-panel-width');
    if (savedWidth) {
      chatPanel.style.width = savedWidth;
    }

    // Mouse down on resize handle
    resizeHandle.addEventListener('mousedown', function(e) {
      isResizing = true;
      startX = e.clientX;
      startWidth = chatPanel.offsetWidth;
      chatPanel.classList.add('resizing');

      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';

      e.preventDefault();
    });

    // Mouse move
    document.addEventListener('mousemove', function(e) {
      if (!isResizing) return;

      const deltaX = startX - e.clientX;
      let newWidth = startWidth + deltaX;

      // Set constraints
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.9;

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      chatPanel.style.width = newWidth + 'px';
    });

    // Mouse up
    document.addEventListener('mouseup', function(e) {
      if (!isResizing) return;

      isResizing = false;
      chatPanel.classList.remove('resizing');

      // Restore normal cursor and selection
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      // Save width to localStorage
      localStorage.setItem('ai-chat-panel-width', chatPanel.style.width);
    });
  }

})();

