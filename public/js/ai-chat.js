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
  let helpButton, chatPanel, closeButton, messagesContainer, input, sendButton;

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    helpButton = document.getElementById('ai-help-button');
    chatPanel = document.getElementById('ai-chat-panel');
    closeButton = document.getElementById('ai-chat-close');
    messagesContainer = document.getElementById('ai-chat-messages');
    input = document.getElementById('ai-chat-input');
    sendButton = document.getElementById('ai-chat-send');

    // Check if elements exist
    if (!helpButton || !chatPanel || !closeButton || !messagesContainer || !input || !sendButton) {
      console.error('AI Chat: Required elements not found');
      return;
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
    // Simple formatting: convert line breaks and create basic HTML
    let formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert bullet points
    formatted = formatted.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive list items in <ul>
    formatted = formatted.replace(/(<li>.*<\/li>(?:<br>)?)+/g, function(match) {
      return '<ul>' + match.replace(/<br>/g, '') + '</ul>';
    });

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

})();

