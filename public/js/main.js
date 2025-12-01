/**
 * Ella Rises - Main JavaScript
 * Handles navigation, flash messages, and form interactions
 */

document.addEventListener('DOMContentLoaded', function() {
  // ============================================
  // Mobile Navigation Toggle
  // ============================================
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      const isExpanded = navMenu.classList.contains('active');
      navToggle.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }
  
  // ============================================
  // Flash Messages Auto-dismiss
  // ============================================
  const flashMessages = document.querySelectorAll('.flash-message');
  
  flashMessages.forEach(function(message) {
    // Auto-dismiss after 5 seconds
    setTimeout(function() {
      message.style.opacity = '0';
      message.style.transform = 'translateY(-10px)';
      setTimeout(function() {
        message.remove();
      }, 300);
    }, 5000);
    
    // Manual close button
    const closeBtn = message.querySelector('.flash-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        message.style.opacity = '0';
        message.style.transform = 'translateY(-10px)';
        setTimeout(function() {
          message.remove();
        }, 300);
      });
    }
  });
  
  // ============================================
  // Donation Amount Buttons
  // ============================================
  const amountButtons = document.querySelectorAll('.amount-btn');
  const customAmountInput = document.querySelector('#custom-amount');
  
  if (amountButtons.length && customAmountInput) {
    amountButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        // Remove active class from all buttons
        amountButtons.forEach(function(b) {
          b.classList.remove('active');
        });
        // Add active class to clicked button
        btn.classList.add('active');
        // Set the amount in the hidden/custom input
        customAmountInput.value = btn.dataset.amount;
      });
    });
    
    // Clear button selection when custom amount is entered
    customAmountInput.addEventListener('input', function() {
      if (this.value) {
        amountButtons.forEach(function(btn) {
          btn.classList.remove('active');
        });
      }
    });
  }
  
  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // ============================================
  // Form Validation Enhancement
  // ============================================
  const forms = document.querySelectorAll('form');
  
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;
      
      requiredFields.forEach(function(field) {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');
          
          // Remove error class on input
          field.addEventListener('input', function() {
            this.classList.remove('error');
          }, { once: true });
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        // Focus first invalid field
        const firstError = form.querySelector('.error');
        if (firstError) {
          firstError.focus();
        }
      }
    });
  });
  
  // ============================================
  // Accessible Dropdown Enhancement
  // ============================================
  const selects = document.querySelectorAll('select');
  
  selects.forEach(function(select) {
    select.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        // Trigger change event on Enter
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
      }
    });
  });
  
  // ============================================
  // Video Placeholder Click
  // ============================================
  const videoPlaceholder = document.querySelector('.video-placeholder');
  
  if (videoPlaceholder) {
    videoPlaceholder.addEventListener('click', function() {
      // In a real implementation, this would open a video modal or embed
      alert('Video player would open here. In production, this would embed a YouTube or Vimeo player.');
    });
    
    videoPlaceholder.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
    
    videoPlaceholder.setAttribute('role', 'button');
    videoPlaceholder.setAttribute('tabindex', '0');
  }
  
  // ============================================
  // Scroll-based Navigation Styling
  // ============================================
  const navbar = document.querySelector('.navbar');
  
  if (navbar) {
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      
      lastScroll = currentScroll;
    });
  }
  
  // ============================================
  // Animate on Scroll (Simple Implementation)
  // ============================================
  const animateElements = document.querySelectorAll('.stat-card, .program-card, .team-card, .impact-card');
  
  if (animateElements.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    animateElements.forEach(function(el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    });
  }
});

