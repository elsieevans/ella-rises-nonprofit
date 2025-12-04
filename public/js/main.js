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
  // Dropdown Navigation
  // ============================================
  const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
  
  dropdownToggles.forEach(function(toggle) {
    const dropdown = toggle.closest('.nav-dropdown');
    
    // Toggle dropdown on click
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Close other dropdowns
      document.querySelectorAll('.nav-dropdown').forEach(function(otherDropdown) {
        if (otherDropdown !== dropdown) {
          otherDropdown.classList.remove('active');
          const otherToggle = otherDropdown.querySelector('.nav-dropdown-toggle');
          if (otherToggle) {
            otherToggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
      
      // Toggle current dropdown
      dropdown.classList.toggle('active');
      const isExpanded = dropdown.classList.contains('active');
      toggle.setAttribute('aria-expanded', isExpanded);
    });
    
    // Keyboard navigation
    toggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown').forEach(function(dropdown) {
        dropdown.classList.remove('active');
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  });
  
  // Close dropdowns on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav-dropdown').forEach(function(dropdown) {
        dropdown.classList.remove('active');
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      });
    }
  });
  
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
  // Enhanced Dropdown/Select Styling & Interaction
  // ============================================
  const selects = document.querySelectorAll('select');
  
  selects.forEach(function(select) {
    // Add keyboard support
    select.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        // Trigger change event on Enter
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
      }
    });
    
    // Add visual feedback on change
    select.addEventListener('change', function() {
      // Add brief success animation
      this.classList.add('success');
      setTimeout(function() {
        select.classList.remove('success');
      }, 800);
    });
    
    // Wrap select in a styled container if not already wrapped
    if (!select.parentElement.classList.contains('select-wrapper') && 
        !select.parentElement.classList.contains('filter-group') &&
        !select.parentElement.classList.contains('form-group')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'select-wrapper';
      select.parentNode.insertBefore(wrapper, select);
      wrapper.appendChild(select);
    }
    
    // Add focus class to parent for styling
    select.addEventListener('focus', function() {
      if (this.parentElement.classList.contains('form-group')) {
        this.parentElement.classList.add('focused');
      }
    });
    
    select.addEventListener('blur', function() {
      if (this.parentElement.classList.contains('form-group')) {
        this.parentElement.classList.remove('focused');
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

  // ============================================
  // Image Carousel
  // ============================================
  const track = document.querySelector('.carousel-track');
  
  if (track) {
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.next-btn');
    const prevButton = document.querySelector('.prev-btn');
    
    // Function to update slide display
    const updateSlides = (currentSlide, targetSlide) => {
      currentSlide.classList.remove('current-slide');
      targetSlide.classList.add('current-slide');
    }
    
    // Next button click
    nextButton.addEventListener('click', e => {
      const currentSlide = track.querySelector('.current-slide');
      let nextSlide = currentSlide.nextElementSibling;
      
      // Loop back to start if at end
      if (!nextSlide) {
        nextSlide = slides[0];
      }
      
      updateSlides(currentSlide, nextSlide);
    });
    
    // Previous button click
    prevButton.addEventListener('click', e => {
      const currentSlide = track.querySelector('.current-slide');
      let prevSlide = currentSlide.previousElementSibling;
      
      // Loop to end if at start
      if (!prevSlide) {
        prevSlide = slides[slides.length - 1];
      }
      
      updateSlides(currentSlide, prevSlide);
    });
    
    // Auto advance every 5 seconds
    let autoAdvance = setInterval(() => {
      nextButton.click();
    }, 5000);
    
    // Pause auto-advance on interaction
    const carouselContainer = document.querySelector('.carousel-container');
    carouselContainer.addEventListener('mouseenter', () => {
      clearInterval(autoAdvance);
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
      autoAdvance = setInterval(() => {
        nextButton.click();
      }, 5000);
    });
  }
});
