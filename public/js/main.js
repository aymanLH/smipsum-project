// main.js - Enhanced Main JavaScript

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  initializeAnimations();
});

function initializeApp() {
  // Set current year in footer
  const currentYear = new Date().getFullYear();
  const yearElements = document.querySelectorAll('.current-year');
  yearElements.forEach(el => el.textContent = currentYear);

  // Initialize scroll-based navbar
  initNavbarScroll();
  
  // Initialize smooth scrolling
  initSmoothScrolling();
  
  // Initialize mobile menu
  initMobileMenu();
  
  // Initialize counter animations
  initCounterAnimations();
  
  // Initialize form enhancements
  initFormEnhancements();
}

// --- NAVBAR SCROLL EFFECT ---
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScrollY = window.scrollY;
  let isScrollingDown = false;

  window.addEventListener('scroll', throttle(() => {
    const currentScrollY = window.scrollY;
    
    // Add/remove scrolled class
    if (currentScrollY > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Hide/show navbar on scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > 200) {
      // Scrolling down
      if (!isScrollingDown) {
        navbar.style.transform = 'translateY(-100%)';
        isScrollingDown = true;
      }
    } else {
      // Scrolling up
      if (isScrollingDown) {
        navbar.style.transform = 'translateY(0)';
        isScrollingDown = false;
      }
    }

    lastScrollY = currentScrollY;
  }, 100));
}

// --- MOBILE MENU ---
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (!mobileMenuBtn || !mobileMenu) return;

  mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // Close mobile menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
    }
  });
}

function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const isOpen = mobileMenu.style.display === 'block';
  
  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

function openMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  
  mobileMenu.style.display = 'block';
  mobileMenuBtn.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  
  mobileMenu.style.display = 'none';
  mobileMenuBtn.classList.remove('active');
  document.body.style.overflow = '';
}

// --- SMOOTH SCROLLING ---
function initSmoothScrolling() {
  // Handle anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const targetId = href.substring(1);
      scrollToSection(targetId);
    });
  });
}

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (!element) return;

  const navbar = document.getElementById('navbar');
  const navbarHeight = navbar ? navbar.offsetHeight : 0;
  const offsetTop = element.offsetTop - navbarHeight - 20;

  window.scrollTo({
    top: offsetTop,
    behavior: 'smooth'
  });

  // Close mobile menu if open
  closeMobileMenu();
}

// --- COUNTER ANIMATIONS ---
function initCounterAnimations() {
  const observeStats = () => {
    const statsElements = document.querySelectorAll('.stat-number');
    if (statsElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
          const target = parseInt(entry.target.dataset.target) || 0;
          animateCounter(entry.target, target);
          entry.target.classList.add('animated');
        }
      });
    }, { threshold: 0.5 });

    statsElements.forEach(stat => observer.observe(stat));
  };

  // Initialize with a delay to ensure DOM is ready
  setTimeout(observeStats, 100);
}

function animateCounter(element, target) {
  let current = 0;
  const increment = Math.ceil(target / 200); // Animation duration ~1 second at 60fps
  const isPercentage = element.textContent.includes('%');
  const hasPlus = element.textContent.includes('+');

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    
    let displayValue = Math.floor(current);
    if (isPercentage) displayValue += '%';
    if (hasPlus && current >= target) displayValue += '+';
    
    element.textContent = displayValue;
  }, 16); // ~60fps
}

// --- FORM ENHANCEMENTS ---
function initFormEnhancements() {
  // Floating labels
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    // Add focus/blur events for better UX
    input.addEventListener('focus', (e) => {
      e.target.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', (e) => {
      if (!e.target.value) {
        e.target.parentElement.classList.remove('focused');
      }
    });
  });

  // File upload enhancements
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', handleFileUpload);
  });
}

function handleFileUpload(event) {
  const files = event.target.files;
  const fileListContainer = document.getElementById('fileList');
  
  if (!fileListContainer) return;

  fileListContainer.innerHTML = '';
  
  Array.from(files).forEach((file, index) => {
    const fileItem = createFileItem(file, index);
    fileListContainer.appendChild(fileItem);
  });
}

function createFileItem(file, index) {
  const div = document.createElement('div');
  div.className = 'file-item';
  
  const fileName = document.createElement('span');
  fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.innerHTML = '<i data-lucide="x"></i>';
  removeBtn.className = 'btn-remove-file';
  removeBtn.onclick = () => removeFile(index);
  
  div.appendChild(fileName);
  div.appendChild(removeBtn);
  
  // Re-initialize lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  return div;
}

function removeFile(index) {
  const fileInput = document.getElementById('file');
  const fileListContainer = document.getElementById('fileList');
  
  if (!fileInput || !fileListContainer) return;

  // Remove the file item from display
  const fileItems = fileListContainer.querySelectorAll('.file-item');
  if (fileItems[index]) {
    fileItems[index].remove();
  }
  
  // Create new file list without the removed file
  const dt = new DataTransfer();
  const files = Array.from(fileInput.files);
  
  files.forEach((file, i) => {
    if (i !== index) {
      dt.items.add(file);
    }
  });
  
  fileInput.files = dt.files;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// --- CONTACT FORM SUBMISSION ---
async function handleSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitBtn = form.querySelector('.submit-btn') || form.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');

  if (!submitBtn) return;

  // Show loading state
  if (btnText && btnLoading) {
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
  }
  submitBtn.disabled = true;

  try {
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.focus();
        showNotification('Veuillez remplir tous les champs requis.', 'error');
        isValid = false;
        return;
      }
    });

    if (!isValid) throw new Error('Validation failed');

    // Simulate API call
    await simulateAPICall(data);
    
    // Show success message
    showNotification('✅ Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.', 'success');
    
    // Reset form
    form.reset();
    
    // Clear file list if exists
    const fileListContainer = document.getElementById('fileList');
    if (fileListContainer) {
      fileListContainer.innerHTML = '';
    }

  } catch (error) {
    console.error('Form submission error:', error);
    showNotification('❌ Une erreur s\'est produite. Veuillez réessayer.', 'error');
  } finally {
    // Reset button state
    if (btnText && btnLoading) {
      btnText.style.display = 'flex';
      btnLoading.style.display = 'none';
    }
    submitBtn.disabled = false;
  }
}

// --- UTILITY FUNCTIONS ---
async function simulateAPICall(data) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  // Simulate occasional failures for testing
  if (Math.random() < 0.1) {
    throw new Error('Simulated network error');
  }
  
  console.log('Form data would be sent to API:', data);
  return { success: true, message: 'Message sent successfully' };
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
        <i data-lucide="x"></i>
      </button>
    </div>
  `;

  // Add styles if they don't exist
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
      }
      .notification-success { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
      .notification-error { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
      .notification-warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
      .notification-info { background: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8; }
      .notification-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .notification-message { flex: 1; font-weight: 500; }
      .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
        padding: 0;
        display: flex;
        align-items: center;
      }
      .notification-close:hover { opacity: 1; }
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styles);
  }

  // Add to DOM
  document.body.appendChild(notification);

  // Re-initialize lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Debounce function for search/input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- ANIMATIONS ---
function initializeAnimations() {
  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animateElements = document.querySelectorAll('.service-card, .project-card, .about-text, .contact-item');
  animateElements.forEach(el => {
    el.classList.add('animate-element');
    observer.observe(el);
  });

  // Add CSS for animations if not present
  if (!document.querySelector('#animate-styles')) {
    const animateStyles = document.createElement('style');
    animateStyles.id = 'animate-styles';
    animateStyles.textContent = `
      .animate-element {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
      }
      .animate-element.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .service-card.animate-element { transition-delay: 0.1s; }
      .service-card:nth-child(2).animate-element { transition-delay: 0.2s; }
      .service-card:nth-child(3).animate-element { transition-delay: 0.3s; }
      .project-card.animate-element { transition-delay: 0.15s; }
      .project-card:nth-child(2).animate-element { transition-delay: 0.3s; }
      .project-card:nth-child(3).animate-element { transition-delay: 0.45s; }
    `;
    document.head.appendChild(animateStyles);
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Handle all forms with the enhanced submit handler
  document.addEventListener('submit', (e) => {
    if (e.target.tagName === 'FORM' && !e.target.hasAttribute('data-no-enhance')) {
      e.preventDefault();
      handleSubmit(e);
    }
  });

  // Handle escape key for modals and menus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      // Close any open modals
      const modals = document.querySelectorAll('.modal[style*="block"]');
      modals.forEach(modal => modal.style.display = 'none');
    }
  });

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Close mobile menu on resize to desktop
      if (window.innerWidth > 768) {
        closeMobileMenu();
      }
    }, 250);
  });

  // Handle visibility change (tab switching)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Tab became visible - could refresh data or restart animations
      console.log('Page became visible');
    }
  });
}

// --- PERFORMANCE MONITORING ---
function logPerformance() {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page Load Performance:', {
          'DOM Content Loaded': perfData.domContentLoadedEventEnd - perfData.fetchStart,
          'Full Load Time': perfData.loadEventEnd - perfData.fetchStart,
          'First Paint': performance.getEntriesByType('paint')[0]?.startTime || 'N/A'
        });
      }, 0);
    });
  }
}

// Initialize performance monitoring in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  logPerformance();
}

// --- ACCESSIBILITY ENHANCEMENTS ---
function initAccessibility() {
  // Skip to main content link
  if (!document.querySelector('.skip-link')) {
    const skipLink = document.createElement('a');
    skipLink.className = 'skip-link';
    skipLink.href = '#main';
    skipLink.textContent = 'Aller au contenu principal';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 10000;
      transition: top 0.3s;
    `;
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Add keyboard navigation for dropdowns and menus
  const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
  interactiveElements.forEach(element => {
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && element.tagName === 'A') {
        element.click();
      }
    });
  });
}

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', initAccessibility);

// --- GLOBAL ERROR HANDLER ---
window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error);
  
  // Show user-friendly error message for critical errors
  if (e.error && e.error.message && !e.error.message.includes('Script error')) {
    showNotification('Une erreur inattendue s\'est produite. Veuillez actualiser la page.', 'error');
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

// Export functions for global access
window.SMIPSUM = {
  scrollToSection,
  toggleMobileMenu,
  closeMobileMenu,
  showNotification,
  handleSubmit
};
