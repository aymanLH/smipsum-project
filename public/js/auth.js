// ==========================================
// auth.js - Complete Authentication & UI Logic
// ==========================================

const API_URL = "https://smipsum-project-production.up.railway.app";

// ==========================================
// INITIALIZATION
// ==========================================
// ==========================================
// MAIN INITIALIZATION 
// ==========================================

// Track if we're already redirecting to prevent loops
let isRedirecting = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM Content Loaded");

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }

  // Initialize based on current page
  initializeAuth();
});

function initializeAuth() {
  const currentPage = window.location.pathname;
  console.log("📍 Current page:", currentPage);

  // Prevent multiple initializations
  if (isRedirecting) {
    console.log("⏳ Already redirecting, skipping initialization");
    return;
  }

  if (currentPage.includes("login.html")) {
    console.log("🔐 Initializing login page");
    initLoginPage();
  }
  else if (currentPage.includes("admin-dashboard.html")) {
    console.log("👑 Initializing admin dashboard");
    initAdminDashboard();
  }
  else if (currentPage.includes("dashboard.html")) {
    console.log("👤 Initializing user dashboard");
    initDashboard();
  }
  else {
    console.log("🏠 Public page, no auth needed");
  }
}

// ==========================================
// USER DASHBOARD INITIALIZATION
// ==========================================

function initDashboard() {
  console.log("🔧 Initializing User Dashboard...");

  if (!checkAuthentication()) {
    console.warn("❌ Not authenticated, redirecting to login");
    redirectTo("login.html");
    return;
  }

  const user = getCurrentUser();
  console.log("👤 Current user:", user);

  // If admin tries to access user dashboard, redirect to admin
  if (user && user.role === 'admin') {
    console.log("👑 Admin detected, redirecting to admin dashboard");
    redirectTo("admin-dashboard.html");
    return;
  }

  console.log("✅ User authenticated, setting up dashboard");

  setupUserInterface();
  setupNavigation();
  setupDemandManagement();
  loadDemands();
  loadStatistics();
}
// ==========================================
// USER DASHBOARD FUNCTIONS
// Add these to your auth.js after the initDashboard function
// ==========================================

// ==========================================
// SETUP USER INTERFACE
// ==========================================

async function setupUserInterface() {
  const user = getCurrentUser();

  console.log("🎨 Setting up user interface for:", user?.email);

  // Update user email in topbar
  const userEmailEl = document.getElementById('userEmail');
  if (userEmailEl) {
    userEmailEl.textContent = user?.email || 'User';
  }

  try {
    // Load full profile from server
    const res = await fetch(`${API_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (res.ok) {
      const profile = await res.json();
      console.log("👤 Profile loaded:", profile);
      updateProfileDisplay(profile);
    } else {
      console.warn("Failed to load profile, using cached data");
      if (user) {
        updateProfileDisplay(user);
      }
    }
  } catch (err) {
    console.error("Error loading profile:", err);
    // Fallback to user data from token
    if (user) {
      updateProfileDisplay(user);
    }
  }

  console.log("✅ User interface setup complete");
}

// ==========================================
// UPDATE PROFILE DISPLAY
// ==========================================

function updateProfileDisplay(profile) {
  const profileFields = {
    'profileEmail': profile.email || 'N/A',
    'profileName': profile.name || 'N/A',
    'profilePhone': profile.phone || 'Non renseigné',
    'memberSince': profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A'
  };

  Object.entries(profileFields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  });

  console.log("✅ Profile display updated");
}

// ==========================================
// SETUP NAVIGATION
// ==========================================

function setupNavigation() {
  console.log("🧭 Setting up navigation...");

  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const pageTitle = document.getElementById('pageTitle');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Handle logout separately
      if (link.id === 'logoutBtn') {
        handleLogout(e);
        return;
      }

      // Get section to show
      const sectionId = link.getAttribute('data-section');
      if (!sectionId) return;

      console.log("📄 Switching to section:", sectionId);

      // Update active states
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show the selected section
      showSection(sectionId);

      // Update page title
      const sectionTitle = link.querySelector('span')?.textContent || 'Dashboard';
      if (pageTitle) {
        pageTitle.textContent = sectionTitle;
      }

      // Refresh Lucide icons
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    });
  });

  // Show default section (profile)
  showSection('profile');

  console.log("✅ Navigation setup complete");
}

// ==========================================
// SHOW SECTION
// ==========================================

function showSection(sectionId) {
  const sections = document.querySelectorAll('.dashboard-section');
  sections.forEach(section => section.classList.remove('active'));

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    console.log("✅ Section shown:", sectionId);
  } else {
    console.warn("⚠️ Section not found:", sectionId);
  }
}

// ==========================================
// SETUP DEMAND MANAGEMENT
// ==========================================


// ==========================================
// FIXED HANDLE DEMAND SUBMISSION
// Replace your existing handleDemandSubmission function
// ==========================================

async function handleDemandSubmission(e) {
  e.preventDefault();

  console.log("📤 Submitting demand...");

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!submitBtn) {
    console.error("❌ Submit button not found");
    return;
  }

  // Get button elements (with null checks)
  const btnText = submitBtn.querySelector('.btn-text') || submitBtn.querySelector('span');
  const btnIcon = submitBtn.querySelector('i');

  // Store original button content
  const originalHTML = submitBtn.innerHTML;

  // Disable button and show loading
  submitBtn.disabled = true;

  // Update button appearance
  if (btnIcon && typeof lucide !== 'undefined') {
    btnIcon.setAttribute('data-lucide', 'loader-2');
    btnIcon.classList.add('animate-spin');
    lucide.createIcons();
  } else {
    // Fallback: just change button text
    submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Envoi en cours...';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  try {
    const formData = new FormData(form);
    const demandData = {
      title: formData.get('title'),
      category: formData.get('category'),
      description: formData.get('description'),
      budget: formData.get('budget') || '',
      deadline: formData.get('deadline') || '',
      contactPreference: formData.get('contact-preference') || 'email'
    };

    console.log("📋 Demand data:", demandData);

    // Validate required fields
    if (!demandData.title || !demandData.category || !demandData.description) {
      throw new Error('Veuillez remplir tous les champs requis (titre, catégorie, description)');
    }

    // Send to server
    const res = await fetch(`${API_URL}/demands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(demandData)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.msg || 'Erreur lors de la soumission');
    }

    console.log("✅ Demand submitted successfully:", data);

    // Show success message
    showSuccessMessage('✅ Demande soumise avec succès ! Nous examinerons<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;votre projet et vous contacterons bientôt.');

    // Reset form
    form.reset();

    // Reload demands and statistics
    await loadDemands();
    await loadStatistics();

    // Switch to demands list after a short delay
    setTimeout(() => {
      showSection('demand-list');

      // Update navigation
      const demandListLink = document.querySelector('[data-section="demand-list"]');
      if (demandListLink) {
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        demandListLink.classList.add('active');

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'Mes Demandes';
      }
    }, 1500);

  } catch (error) {
    console.error('❌ Demand submission error:', error);
    showErrorMessage('❌ ' + (error.message || 'Une erreur est survenue lors de la soumission.'));
  } finally {
    // Re-enable button and restore original appearance
    submitBtn.disabled = false;

    if (btnIcon && typeof lucide !== 'undefined') {
      btnIcon.setAttribute('data-lucide', 'send');
      btnIcon.classList.remove('animate-spin');
      lucide.createIcons();
    } else {
      // Restore original HTML
      submitBtn.innerHTML = originalHTML;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }
}

// ==========================================
// HELPER FUNCTIONS FOR USER FEEDBACK
// ==========================================

function showSuccessMessage(message) {
  // Try to use your existing alert system
  const alertEl = document.getElementById('alertMessage') || document.getElementById('demandAlertMessage');

  if (alertEl) {
    alertEl.innerHTML = `
      <span class="alert-msg">${message}</span>
    `;
    alertEl.className = 'alert success';
    alertEl.style.display = 'flex';

    setTimeout(() => {
      alertEl.style.display = 'none';
    }, 5000);
  } else {
    // Fallback to browser alert
    alert(message);
  }
}

function showErrorMessage(message) {
  const alertEl = document.getElementById('alertMessage') || document.getElementById('demandAlertMessage');

  if (alertEl) {
    alertEl.innerHTML = `
      <span class="alert-icon">⚠️</span>
      <span class="alert-msg">${message}</span>
    `;
    alertEl.className = 'alert error';
    alertEl.style.display = 'flex';

    setTimeout(() => {
      alertEl.style.display = 'none';
    }, 5000);
  } else {
    // Fallback to browser alert
    alert(message);
  }
}

// ==========================================
// ALTERNATIVE: If you want a toast notification
// ==========================================

function showToast(message, type = 'success') {
  // Remove any existing toasts
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${type === 'success' ? '' : ''}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;

  // Add styles if not already present
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        min-width: 300px;
        max-width: 500px;
        backdrop-filter: blur(8px);         
        border: 1px solid rgba(0,0,0,0.05);  
      }
      
      .toast-success {
        border-left: 4px solid #4CAF50;
      }
      
      .toast-error {
        border-left: 4px solid #f44336;
      }
      
      .toast-content {
        display: flex;
        align-items: center; 
        
      }

      .toast-icon {
        font-size: 22px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }    

      .toast-message {
        flex: 1;
        font-weight: 500;
        color: #333;
        margin: 0;             
        line-height: 1.5;  
        gap: 10px;
        line-height: 1.4;    
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// ==========================================
// UPDATE showSuccessMessage and showErrorMessage to use toast
// (Optional - uncomment if you prefer toast notifications)
// ==========================================


function showSuccessMessage(message) {
  showToast(message, 'success');
}

function showErrorMessage(message) {
  showToast(message, 'error');
}

// ==========================================
// LOAD DEMANDS
// ==========================================

async function loadDemands() {
  console.log("📋 Loading user demands...");

  try {
    const res = await fetch(`${API_URL}/demands`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const demands = await res.json();
    console.log(`📋 Loaded ${demands.length} demands`);

    renderDemands(demands);
    updateDemandCount(demands.length);
  } catch (err) {
    console.error('❌ Error loading demands:', err);

    const tableBody = document.querySelector('.demand-table tbody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem;">
            <div class="alert error">
              <span class="alert-icon">⚠️</span>
              <span class="alert-msg">Erreur lors du chargement des demandes</span>
            </div>
          </td>
        </tr>
      `;
    }
  }
}

// ==========================================
// RENDER DEMANDS
// ==========================================

function renderDemands(demands) {
  const tableBody = document.querySelector('.demand-table tbody');

  if (!tableBody) {
    console.warn("⚠️ Demands table body not found");
    return;
  }

  tableBody.innerHTML = '';

  if (!demands || demands.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <i data-lucide="inbox"></i>
            <h3>Aucune demande</h3>
            <p>Vous n'avez pas encore soumis de demande</p>
            <button class="btn-primary" onclick="showSection('demand-form'); document.querySelector('[data-section=demand-form]').click();">
              <i data-lucide="plus"></i> Créer une demande
            </button>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  demands.forEach((demand) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${escapeHtml(demand.title)}</strong></td>
      <td><span class="category-badge">${escapeHtml(demand.category)}</span></td>
      <td>${formatDate(demand.createdAt)}</td>
      <td>
        <span class="status-badge status-${demand.status}">
          ${getStatusLabel(demand.status)}
        </span>
      </td>
      <td>
        <button class="btn-sm btn-secondary" onclick="viewDemand('${demand._id}')">
          <i data-lucide="eye"></i> Voir
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
  console.log("✅ Demands rendered");
}

// ==========================================
// VIEW DEMAND DETAILS
// ==========================================

async function viewDemand(demandId) {
  console.log("👁️ Viewing demand:", demandId);

  try {
    const res = await fetch(`${API_URL}/demands/${demandId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) throw new Error('Failed to load demand details');

    const demand = await res.json();
    showDemandModal(demand);
  } catch (err) {
    console.error('❌ Error loading demand details:', err);
    alert('Erreur lors du chargement des détails');
  }
}

// ==========================================
// SHOW DEMAND MODAL
// ==========================================

function showDemandModal(demand) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${escapeHtml(demand.title)}</h3>
        <button onclick="this.closest('.modal-overlay').remove()">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="detail-row">
          <strong>Catégorie:</strong>
          <span>${escapeHtml(demand.category)}</span>
        </div>
        <div class="detail-row">
          <strong>Statut:</strong>
          <span class="status-badge status-${demand.status}">
            ${getStatusLabel(demand.status)}
          </span>
        </div>
        <div class="detail-row">
          <strong>Budget:</strong>
          <span>${demand.budget || 'Non spécifié'}</span>
        </div>
        <div class="detail-row">
          <strong>Date limite:</strong>
          <span>${demand.deadline ? formatDate(demand.deadline) : 'Flexible'}</span>
        </div>
        <div class="detail-row">
          <strong>Contact préféré:</strong>
          <span>${escapeHtml(demand.contactPreference || 'Email')}</span>
        </div>
        <div class="detail-row">
          <strong>Date de soumission:</strong>
          <span>${formatDate(demand.createdAt)}</span>
        </div>
        <div class="detail-row">
          <strong>Description:</strong>
          <p style="margin-top: 0.5rem; white-space: pre-wrap;">${escapeHtml(demand.description)}</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// ==========================================
// FILTER DEMANDS
// ==========================================

function filterDemands() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('statusFilter')?.value || '';

  console.log("🔍 Filtering demands:", { searchTerm, statusFilter });

  const rows = document.querySelectorAll('.demand-table tbody tr');

  rows.forEach(row => {
    // Skip empty state rows
    if (row.querySelector('.empty-state')) return;

    const title = row.cells[0]?.textContent.toLowerCase() || '';
    const category = row.cells[1]?.textContent.toLowerCase() || '';
    const statusBadge = row.querySelector('.status-badge');
    const rowStatus = statusBadge?.className.split('status-')[1]?.split(' ')[0] || '';

    const matchesSearch = title.includes(searchTerm) || category.includes(searchTerm);
    const matchesStatus = !statusFilter || statusFilter === rowStatus;

    row.style.display = matchesSearch && matchesStatus ? '' : 'none';
  });
}

// ==========================================
// LOAD STATISTICS
// ==========================================

async function loadStatistics() {
  console.log("📊 Loading user statistics...");

  try {
    const res = await fetch(`${API_URL}/statistics`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const stats = await res.json();
    console.log("📊 Statistics loaded:", stats);

    updateStatisticsDisplay(stats);
  } catch (err) {
    console.error('❌ Error loading statistics:', err);
  }
}

// ==========================================
// UPDATE STATISTICS DISPLAY
// ==========================================
function updateStatisticsDisplay(stats) {
  const statElements = {
    'statTotal': stats.total || 0,
    'statPending': stats.pending || 0,
    'statCompleted': stats.completed || 0
  };

  Object.entries(statElements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  });

  // Also update the sidebar badge with total count
  const demandBadge = document.getElementById('demandCount');
  if (demandBadge && stats.total !== undefined) {
    demandBadge.textContent = stats.total;
  }

  console.log("✅ Statistics display updated");
}

// ==========================================
// UPDATE DEMAND COUNT BADGE
// ==========================================

function updateDemandCount(count) {
  const badge = document.getElementById('demandCount');
  if (badge) {
    badge.textContent = count;
    console.log(`📊 Demand count badge updated to: ${count}`);
  } else {
    console.warn('⚠️ Demand count badge element not found');
  }
}

// ==========================================
// DEBOUNCE UTILITY
// ==========================================

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

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function getStatusLabel(status) {
  const statuses = {
    'en-attente': 'En attente',
    'en-cours': 'En cours',
    'terminee': 'Terminée',
    'annulee': 'Annulée'
  };
  return statuses[status] || status;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
// ==========================================
// SAFE REDIRECT FUNCTION
// ==========================================

function redirectTo(page) {
  if (isRedirecting) {
    console.log("⏳ Already redirecting, ignoring new redirect request");
    return;
  }

  isRedirecting = true;
  console.log(`🔄 Redirecting to ${page}...`);

  // Small delay to ensure console logs are visible
  setTimeout(() => {
    window.location.href = page;
  }, 100);
}

// ==========================================
// FIXED LOGOUT HANDLER
// ==========================================

function handleLogout(e) {
  if (e) e.preventDefault();

  if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
    console.log("👋 Logging out...");

    // Clear ALL authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('admin_page_loaded');

    // Clear any other session flags
    sessionStorage.clear();

    // Log to verify
    console.log("🗑️ Auth data cleared");
    console.log("Token after clear:", localStorage.getItem('token'), sessionStorage.getItem('token'));
    console.log("User after clear:", localStorage.getItem('user'), sessionStorage.getItem('user'));

    // Force redirect
    window.location.href = 'login.html';
  }
}

// ==========================================
// IMPROVED CLEAR AUTH DATA FUNCTION
// ==========================================

function clearAuthData() {
  // Remove specific items
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("admin_page_loaded");

  // Also clear any potential remnants
  Object.keys(localStorage).forEach(key => {
    if (key.includes('token') || key.includes('user') || key.includes('auth')) {
      localStorage.removeItem(key);
    }
  });

  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('token') || key.includes('user') || key.includes('auth')) {
      sessionStorage.removeItem(key);
    }
  });

  console.log("🗑️ Complete auth data cleared");
}
// ==========================================
// LOGIN PAGE
// ==========================================

function initLoginPage() {
  const authContainer = document.getElementById("authContainer");
  if (!authContainer) return;

  setupPasswordToggles();
  setupAuthSwitching();

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (registerForm) registerForm.addEventListener("submit", handleRegister);
}

function setupAuthSwitching() {
  const authContainer = document.getElementById("authContainer");
  const switchToRegisterBtn = document.getElementById("switchToRegister");
  const mobileToRegisterBtn = document.getElementById("mobileToRegister");
  const mobileToLoginBtn = document.getElementById("mobileToLogin");
  const welcomeTitle = document.querySelector(".welcome-title");
  const welcomeText = document.querySelector(".welcome-text");

  if (!switchToRegisterBtn) return;

  function switchToRegister() {
    authContainer.classList.add("register-mode");
    welcomeTitle.textContent = "Welcome Back!";
    welcomeText.textContent = "Already have an account?";
    switchToRegisterBtn.textContent = "Login";
  }

  function switchToLogin() {
    authContainer.classList.remove("register-mode");
    welcomeTitle.textContent = "Hello, Welcome!";
    welcomeText.textContent = "Don't have an account?";
    switchToRegisterBtn.textContent = "Register";
  }

  switchToRegisterBtn.addEventListener("click", () => {
    if (authContainer.classList.contains("register-mode")) {
      switchToLogin();
    } else {
      switchToRegister();
    }
  });

  mobileToRegisterBtn?.addEventListener("click", switchToRegister);
  mobileToLoginBtn?.addEventListener("click", switchToLogin);
}

function setupPasswordToggles() {
  ["Login", "Register"].forEach((type) => {
    const toggle = document.getElementById(`toggle${type}Password`);
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      const input = document.getElementById(`${type.toLowerCase()}Password`);
      const icon = toggle.querySelector("i");
      const isPassword = input.type === "password";

      input.type = isPassword ? "text" : "password";
      icon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");
      lucide?.createIcons();
    });
  });
}

function showAlert(elementId, msg, type = "error") {
  const alertEl = document.getElementById(elementId);
  if (!alertEl) return;

  alertEl.innerHTML = `
    <span class="alert-icon">${type === "success" ? "✔️" : "⚠️"}</span>
    <span class="alert-msg">${msg}</span>
  `;

  alertEl.className = `alert ${type}`;
  alertEl.style.display = "flex";

  setTimeout(() => {
    alertEl.style.display = "none";
  }, 4000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrength(password) {
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const passed = Object.values(rules).filter(Boolean).length;
  let strength = "weak";

  if (passed >= 4) strength = "strong";
  else if (passed >= 3) strength = "medium";

  return { strength, rules };
}

function validateField(field) {
  const value = field.value?.trim();
  if (!value) return false;

  if (field.type === "email" && !isValidEmail(value)) return false;

  if (field.type === "password") {
    const { strength } = getPasswordStrength(value);
    if (strength === "weak") {
      showAlert(
        "registerAlertMessage",
        "Your password is too weak. Use at least 8 characters, a number, an uppercase letter, and a symbol."
      );
      return false;
    }
  }

  return true;
}

// ==========================================
// IMPROVED LOGIN HANDLER - REPLACE YOUR EXISTING ONE
// ==========================================

async function handleLogin(e) {
  e.preventDefault();

  const form = e.target;
  const btn = form.querySelector(".submit-btn");
  const btnText = form.querySelector(".btn-text");
  const btnLoading = form.querySelector(".btn-loading");

  if (!btn || !btnText || !btnLoading) {
    console.error("Button elements not found");
    return;
  }

  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";
  btn.disabled = true;

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const remember = document.getElementById("remember")?.checked;

  if (!isValidEmail(email) || password.length < 6) {
    showAlert("alertMessage", "Please enter a valid email and password.", "error");
    resetButton(btn, btnText, btnLoading);
    return;
  }

  try {
    // ⭐ CRITICAL: Clear ALL old auth data before login
    console.log("🧹 Clearing old auth data before new login...");
    clearAuthData();

    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert("alertMessage", data.msg || "Login failed", "error");
      resetButton(btn, btnText, btnLoading);
      return;
    }

    // Validate response structure
    if (!data.token || !data.user) {
      console.error("Invalid login response:", data);
      showAlert("alertMessage", "Invalid server response", "error");
      resetButton(btn, btnText, btnLoading);
      return;
    }

    // Validate user object has required fields
    if (!data.user.email || !data.user.role) {
      console.error("User data missing required fields:", data.user);
      showAlert("alertMessage", "Invalid user data received", "error");
      resetButton(btn, btnText, btnLoading);
      return;
    }

    // ⭐ CRITICAL: Store NEW authentication data
    const storage = remember ? localStorage : sessionStorage;

    console.log("💾 Storing new auth data:");
    console.log("  - Token:", data.token.substring(0, 20) + "...");
    console.log("  - User:", data.user);
    console.log("  - Role:", data.user.role);
    console.log("  - Storage:", remember ? "localStorage" : "sessionStorage");

    // Clear opposite storage to prevent conflicts
    if (remember) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));
    }

    showAlert("alertMessage", "Login successful! Redirecting...", "success");

    // ⭐ Redirect based on role with proper validation
    setTimeout(() => {
      const userRole = data.user.role;
      console.log(`🔄 Redirecting user with role: ${userRole}`);

      if (userRole === 'admin') {
        console.log("👑 Redirecting to admin dashboard");
        window.location.href = "admin-dashboard.html";
      } else {
        console.log("👤 Redirecting to user dashboard");
        window.location.href = "dashboard.html";
      }
    }, 1000);

  } catch (err) {
    console.error("Login error:", err);
    showAlert("alertMessage", "Server connection failed. Please try again.", "error");
    resetButton(btn, btnText, btnLoading);
  }
}

// ==========================================
// HELPER FUNCTION TO RESET BUTTON STATE
// ==========================================

function resetButton(btn, btnText, btnLoading) {
  if (btnText) btnText.style.display = "inline";
  if (btnLoading) btnLoading.style.display = "none";
  if (btn) btn.disabled = false;
}
// Fixed setupPasswordToggles with null checks
function setupPasswordToggles() {
  ["Login", "Register"].forEach((type) => {
    const toggle = document.getElementById(`toggle${type}Password`);
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      const input = document.getElementById(`${type.toLowerCase()}Password`);
      const icon = toggle.querySelector("i");

      // CRITICAL: Add null checks
      if (!input || !icon) {
        console.error(`Password toggle elements not found for ${type}`);
        return;
      }

      const isPassword = input.type === "password";

      input.type = isPassword ? "text" : "password";
      icon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");

      // Safely reinitialize icons
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    });
  });
}

// ==========================================
// SAFEST GET CURRENT USER - REPLACE YOUR EXISTING ONE
// ==========================================

function getCurrentUser() {
  // Priority 1: Check sessionStorage (temporary login)
  let userJson = sessionStorage.getItem("user");
  let source = "sessionStorage";

  // Priority 2: Check localStorage (remember me)
  if (!userJson) {
    userJson = localStorage.getItem("user");
    source = "localStorage";
  }

  if (userJson) {
    try {
      const user = JSON.parse(userJson);

      // Validate user object structure
      if (user && typeof user === 'object' && user.email) {
        // Ensure role exists
        if (!user.role) {
          console.warn("⚠️ User object missing role, defaulting to 'user'");
          user.role = 'user';
        }

        console.log(`📦 User from ${source}:`, {
          email: user.email,
          role: user.role,
          name: user.name
        });

        return user;
      } else {
        console.warn("⚠️ Invalid user data structure in storage");
        clearAuthData();
      }
    } catch (err) {
      console.error("❌ Error parsing user data:", err);
      clearAuthData();
    }
  }

  // Fallback: Decode from token
  const token = getToken();
  if (!token) {
    console.log("ℹ️ No token available");
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error("❌ Invalid token format");
      clearAuthData();
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn("⚠️ Token expired");
      clearAuthData();
      return null;
    }

    const user = {
      id: payload.id,
      email: payload.email || "unknown@example.com",
      role: payload.role || "user",
      name: payload.name || "User"
    };

    console.log("🎫 User decoded from token:", {
      email: user.email,
      role: user.role,
      name: user.name
    });

    // ⭐ DON'T save back to storage - let next login handle it

    return user;

  } catch (err) {
    console.error("❌ Error decoding token:", err);
    clearAuthData();
    return null;
  }
}

// ==========================================
// GET TOKEN FUNCTION
// ==========================================

function getToken() {
  // Priority: sessionStorage first (temporary), then localStorage (remember me)
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}


async function handleRegister(e) {
  e.preventDefault();

  const form = e.target;
  const btn = form.querySelector(".submit-btn");
  const btnText = form.querySelector(".btn-text");
  const btnLoading = form.querySelector(".btn-loading");

  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";
  btn.disabled = true;

  const name = form.querySelector("#registerName").value.trim();
  const email = form.querySelector("#registerEmail").value.trim();
  const password = form.querySelector("#registerPassword").value;

  if (!validateField(form.querySelector("#registerPassword"))) {
    resetButton(btn, btnText, btnLoading);
    return;
  }

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert("registerAlertMessage", data.msg || "Registration failed", "error");
      resetButton(btn, btnText, btnLoading);
      return;
    }

    showAlert("registerAlertMessage", data.msg || "Registration successful! Please login.", "success");

    setTimeout(() => {
      const authContainer = document.getElementById("authContainer");
      authContainer?.classList.remove("register-mode");
      resetButton(btn, btnText, btnLoading);
      form.reset();
    }, 1500);
  } catch (err) {
    console.error("Registration error:", err);
    showAlert("registerAlertMessage", "Server connection failed", "error");
    resetButton(btn, btnText, btnLoading);
  }
}

function resetButton(btn, textEl, loadingEl) {
  textEl.style.display = "inline";
  loadingEl.style.display = "none";
  btn.disabled = false;
}

// ==========================================
// USER DASHBOARD
// ==========================================

function updateProfileDisplay(profile) {
  const profileFields = {
    'profileEmail': profile.email,
    'profileName': profile.name,
    'profilePhone': profile.phone || '+212 6 12 34 56 78',
    'memberSince': new Date(profile.createdAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long'
    })
  };

  Object.entries(profileFields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function setupNavigation() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const pageTitle = document.getElementById('pageTitle');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (link.id === 'logoutBtn') {
        handleLogout(e);
        return;
      }

      e.preventDefault();

      const sectionId = link.getAttribute('data-section');
      if (sectionId) {
        showSection(sectionId);

        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const sectionTitle = link.querySelector('span').textContent;
        if (pageTitle) pageTitle.textContent = sectionTitle;

        lucide?.createIcons();
      }
    });
  });

  showSection('profile');
}

function showSection(sectionId) {
  const sections = document.querySelectorAll('.dashboard-section');
  sections.forEach(section => section.classList.remove('active'));

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }
}

function setupDemandManagement() {
  const demandForm = document.getElementById('demandForm');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  if (demandForm) {
    demandForm.addEventListener('submit', handleDemandSubmission);
  }

  if (searchInput) {
    searchInput.addEventListener('input', debounce(filterDemands, 300));
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', filterDemands);
  }
}

async function loadDemands() {
  console.log("📋 Loading user demands...");

  try {
    const res = await fetch(`${API_URL}/demands`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const demands = await res.json();
    console.log(`📋 Loaded ${demands.length} demands`);
    console.log('📦 Demands data:', demands); // ADD THIS LINE

    renderDemands(demands);
    updateDemandCount(demands.length);
  } catch (err) {
    console.error('❌ Error loading demands:', err);

    const tableBody = document.querySelector('.demand-table tbody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem;">
            <div class="alert error">
              <span class="alert-icon">⚠️</span>
              <span class="alert-msg">Erreur lors du chargement des demandes</span>
            </div>
          </td>
        </tr>
      `;
    }
  }
}

async function viewDemand(demandId) {
  try {
    const res = await fetch(`${API_URL}/demands/${demandId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) throw new Error('Failed to load demand details');

    const demand = await res.json();
    showDemandModal(demand);
  } catch (err) {
    console.error('Error loading demand details:', err);
    alert('Erreur lors du chargement des détails');
  }
}

function showDemandModal(demand) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${escapeHtml(demand.title)}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="demand-details">
          <div class="detail-row">
            <strong>Catégorie:</strong>
            <span>${escapeHtml(getCategoryLabel(demand.category))}</span>
          </div>
          <div class="detail-row">
            <strong>Statut:</strong>
            <span class="badge badge-${getStatusClass(demand.status)}">
              ${getStatusLabel(demand.status)}
            </span>
          </div>
          <div class="detail-row">
            <strong>Budget:</strong>
            <span>${demand.budget ? escapeHtml(demand.budget) : 'Non spécifié'}</span>
          </div>
          <div class="detail-row">
            <strong>Date limite:</strong>
            <span>${demand.deadline ? formatDate(demand.deadline) : 'Flexible'}</span>
          </div>
          <div class="detail-row">
            <strong>Contact préféré:</strong>
            <span>${escapeHtml(demand.contactPreference || 'Email')}</span>
          </div>
          <div class="detail-row">
            <strong>Date de soumission:</strong>
            <span>${formatDate(demand.createdAt)}</span>
          </div>
          <div class="detail-full">
            <strong>Description:</strong>
            <p>${escapeHtml(demand.description)}</p>
          </div>
          ${demand.status === 'pending' ? `
            <div class="admin-actions">
              <textarea id="adminResponseText" placeholder="Ajouter une réponse (optionnel)" rows="3"></textarea>
              <div class="button-group">
                <button class="btn btn-success" onclick="updateDemandStatusWithResponse('${demand._id}', 'approved')">
                  <i data-lucide="check"></i> Approuver
                </button>
                <button class="btn btn-danger" onclick="updateDemandStatusWithResponse('${demand._id}', 'rejected')">
                  <i data-lucide="x"></i> Rejeter
                </button>
              </div>
            </div>
          ` : demand.adminResponse ? `
            <div class="admin-response">
              <strong>Réponse de l'administrateur:</strong>
              <p>${escapeHtml(demand.adminResponse)}</p>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  lucide?.createIcons();

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

async function updateDemandStatus(demandId, status) {
  await updateDemandStatusWithResponse(demandId, status, '');
}

async function updateDemandStatusWithResponse(demandId, status, responseText) {
  const response = responseText || document.getElementById('adminResponseText')?.value || '';

  try {
    const res = await fetch(`${API_URL}/admin/demands/${demandId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status, adminResponse: response })
    });

    if (!res.ok) throw new Error('Failed to update demand');

    const statusLabel = status === 'approved' ? 'approuvée' : 'rejetée';
    alert(`✅ Demande ${statusLabel} avec succès`);

    document.querySelector('.modal-overlay')?.remove();
    loadAllDemands();
    loadAdminStatistics();
  } catch (err) {
    console.error('Error updating demand:', err);
    alert('❌ Erreur lors de la mise à jour');
  }
}

async function loadAllUsers() {
  try {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) throw new Error('Failed to load users');

    const data = await res.json(); // data is probably { users: [...] }
    renderAdminUsers(data.users || []); // pass the array to render function
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

function renderAdminUsers(users) {
  const tableBody = document.querySelector('#admin-users .demand-table tbody');

  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (users.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 3rem;">
          <div class="empty-state">
            <i data-lucide="users" style="width: 64px; height: 64px; margin: 0 auto 1rem; color: var(--gray-300);"></i>
            <h3>Aucun utilisateur</h3>
          </div>
        </td>
      </tr>
    `;
    lucide?.createIcons();
    return;
  }

  users.forEach((user) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${escapeHtml(user.name)}</strong></td>
      <td>${escapeHtml(user.email)}</td>
      <td>
        <span class="badge badge-${user.role === 'admin' ? 'warning' : 'info'}">
          ${escapeHtml(user.role)}
        </span>
      </td>
      <td>${user.demandsCount || 0}</td>
      <td>${formatDate(user.createdAt)}</td>
    `;
    tableBody.appendChild(row);
  });

  lucide?.createIcons();
}

async function loadAdminStatistics() {
  try {
    const res = await fetch(`${API_URL}/admin/statistics`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) throw new Error('Failed to load statistics');

    const stats = await res.json();
    updateAdminStatisticsDisplay(stats);
  } catch (err) {
    console.error('Error loading statistics:', err);
  }
}

function updateAdminStatisticsDisplay(stats) {
  const statElements = {
    'adminTotalUsers': stats.totalUsers || 0,
    'adminTotalDemands': stats.totalDemands || 0,
    'adminPendingDemands': stats.pendingDemands || 0,
    'adminApprovedDemands': stats.approvedDemands || 0
  };

  Object.entries(statElements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function handleLogout(e) {
  e.preventDefault();

  if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    window.location.href = 'login.html';
  }
}

function getCategoryLabel(category) {
  const categories = {
    'web': 'Développement Web',
    'mobile': 'Application Mobile',
    'design': 'Design Graphique',
    'marketing': 'Marketing Digital',
    'other': 'Autre'
  };
  return categories[category] || category;
}

function getStatusLabel(status) {
  const statuses = {
    'pending': 'En attente',
    'approved': 'Approuvée',
    'rejected': 'Rejetée',
    'in-progress': 'En cours',
    'completed': 'Terminée'
  };
  return statuses[status] || status;
}

function getStatusClass(status) {
  const classes = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'in-progress': 'info',
    'completed': 'success'
  };
  return classes[status] || 'secondary';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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

async function deleteDemand(demandId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;

  try {
    const res = await fetch(`${API_URL}/demands/${demandId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) throw new Error('Failed to delete demand');

    alert('✅ Demande supprimée avec succès');
    loadDemands();
    loadStatistics();
  } catch (err) {
    console.error('Error deleting demand:', err);
    alert('❌ Erreur lors de la suppression');
  }
}

// ==========================================
// FIXED FILTER DEMANDS FUNCTION
// Replace the existing filterDemands function in auth.js
// ==========================================


function filterDemands() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  if (!searchInput || !statusFilter) {
    console.error('Search input or status filter not found');
    return;
  }

  const searchTerm = searchInput.value.toLowerCase().trim();
  const statusValue = statusFilter.value.trim(); // Don't lowercase yet

  console.log("🔍 Filtering demands:", {
    searchTerm,
    statusValue,
    hasSearchTerm: searchTerm.length > 0,
    hasStatusFilter: statusValue.length > 0
  });

  const rows = document.querySelectorAll('.demand-table tbody tr');
  let visibleCount = 0;

  rows.forEach(row => {
    // Skip empty state rows
    if (row.querySelector('.empty-state')) {
      return;
    }

    // Use data attributes if available (more reliable)
    let rowStatus = row.getAttribute('data-status');

    // Fallback: extract from badge class if data attribute not available
    if (!rowStatus) {
      const statusCell = row.cells[3];
      const statusBadge = statusCell?.querySelector('.status-badge');

      if (statusBadge) {
        const statusClasses = statusBadge.className.split(' ');
        const statusClass = statusClasses.find(cls => cls.startsWith('status-'));

        if (statusClass) {
          rowStatus = statusClass.replace('status-', '');
        }
      }
    }

    // Get cell values for search
    const titleCell = row.cells[0];
    const categoryCell = row.cells[1];

    if (!titleCell || !categoryCell) {
      console.warn('Missing cells in row:', row);
      return;
    }

    const title = titleCell.textContent.toLowerCase().trim();
    const category = categoryCell.textContent.toLowerCase().trim();

    console.log('Row data:', { title, category, rowStatus, filterStatus: statusValue });

    // Check search match
    const matchesSearch = !searchTerm ||
      title.includes(searchTerm) ||
      category.includes(searchTerm);

    // Check status match (exact match, case-sensitive)
    const matchesStatus = !statusValue || rowStatus === statusValue;

    // Show/hide row
    const shouldShow = matchesSearch && matchesStatus;
    row.style.display = shouldShow ? '' : 'none';

    if (shouldShow) {
      visibleCount++;
    }
  });

  console.log(`✅ Filtered: ${visibleCount} visible rows`);

  // Show "no results" message if needed
  showNoResultsMessage(visibleCount);
}

// ==========================================
// SHOW NO RESULTS MESSAGE
// ==========================================

function showNoResultsMessage(visibleCount) {
  const tableBody = document.querySelector('.demand-table tbody');
  if (!tableBody) return;

  // Remove existing "no results" row
  const existingNoResults = tableBody.querySelector('.no-results-row');
  if (existingNoResults) {
    existingNoResults.remove();
  }

  // If no visible rows and we have some rows (not initial empty state)
  const totalRows = tableBody.querySelectorAll('tr:not(.no-results-row)').length;
  const hasEmptyState = tableBody.querySelector('.empty-state') !== null;

  if (visibleCount === 0 && totalRows > 0 && !hasEmptyState) {
    const noResultsRow = document.createElement('tr');
    noResultsRow.className = 'no-results-row';
    noResultsRow.innerHTML = `
      <td colspan="5">
        <div class="empty-state">
          <i data-lucide="search-x" style="width: 64px; height: 64px; margin: 0 auto 1rem; color: var(--gray-300);"></i>
          <h3>Aucun résultat</h3>
          <p>Aucune demande ne correspond à vos critères de recherche</p>
          <button class="btn-secondary btn-sm" onclick="clearFilters()">
            <i data-lucide="x"></i> Effacer les filtres
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(noResultsRow);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ==========================================
// CLEAR FILTERS FUNCTION
// ==========================================

function clearFilters() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  if (searchInput) searchInput.value = '';
  if (statusFilter) statusFilter.value = '';

  filterDemands();
}

// Make it globally accessible
window.clearFilters = clearFilters;

// ==========================================
// IMPROVED SETUP DEMAND MANAGEMENT
// Replace the existing setupDemandManagement function
// ==========================================

function setupDemandManagement() {
  console.log("📋 Setting up demand management...");

  // Setup demand form submission
  const demandForm = document.getElementById('demandForm');
  if (demandForm) {
    demandForm.addEventListener('submit', handleDemandSubmission);
    console.log("✅ Demand form listener added");
  }

  // Setup search input with debounce
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    // Remove any existing listeners
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    // Add new listener
    newSearchInput.addEventListener('input', debounce(filterDemands, 300));
    console.log("✅ Search input listener added");
  } else {
    console.warn("⚠️ Search input not found");
  }

  // Setup status filter
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    // Remove any existing listeners
    const newStatusFilter = statusFilter.cloneNode(true);
    statusFilter.parentNode.replaceChild(newStatusFilter, statusFilter);

    // Add new listener
    newStatusFilter.addEventListener('change', filterDemands);
    console.log("✅ Status filter listener added");
  } else {
    console.warn("⚠️ Status filter not found");
  }

  // Setup search button click (if it exists)
  const searchButton = document.querySelector('.search-icon');
  if (searchButton) {
    searchButton.addEventListener('click', () => {
      console.log("🔍 Search button clicked");
      filterDemands();
    });
    console.log("✅ Search button listener added");
  }

  console.log("✅ Demand management setup complete");
}

// ==========================================
// IMPROVED RENDER DEMANDS
// Add data attributes for easier filtering
// ==========================================

function renderDemands(demands) {
  const tableBody = document.querySelector('.demand-table tbody');

  if (!tableBody) {
    console.warn("⚠️ Demands table body not found");
    return;
  }

  tableBody.innerHTML = '';

  if (!demands || demands.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <i data-lucide="inbox"></i>
            <h3>Aucune demande</h3>
            <p>Vous n'avez pas encore soumis de demande</p>
            <button class="btn-primary" onclick="showSection('demand-form'); document.querySelector('[data-section=demand-form]').click();">
              <i data-lucide="plus"></i> Créer une demande
            </button>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  demands.forEach((demand) => {
    const row = document.createElement('tr');

    // Add data attributes for easier filtering
    row.setAttribute('data-title', demand.title.toLowerCase());
    row.setAttribute('data-email', (demand.user?.email || '').toLowerCase());
    row.setAttribute('data-category', (demand.category || '').toLowerCase());
    row.setAttribute('data-status', demand.status || ''); // Keep original case
    console.log('📝 Rendering row with data:', {
      title: demand.title,
      status: demand.status,
      dataStatus: row.getAttribute('data-status')
    });
    row.innerHTML = `
      <td><strong>${escapeHtml(demand.title)}</strong></td>
      <td><span class="category-badge">${escapeHtml(demand.category)}</span></td>
      <td>${formatDate(demand.createdAt)}</td>
      <td>
        <span class="status-badge status-${demand.status}">
          ${getStatusLabel(demand.status)}
        </span>
      </td>
      <td>
        <button class="btn-sm btn-secondary" onclick="viewDemand('${demand._id}')">
          <i data-lucide="eye"></i> Voir
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
  console.log("✅ Demands rendered");

  // Clear any active filters
  clearFilters();
}
async function loadStatistics() {
  try {
    const res = await fetch(`${API_URL}/statistics`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) throw new Error('Failed to load statistics');

    const stats = await res.json();
    updateStatisticsDisplay(stats);
  } catch (err) {
    console.error('Error loading statistics:', err);
  }
}

function updateStatisticsDisplay(stats) {
  const statElements = {
    'totalDemands': stats.totalDemands || 0,
    'pendingDemands': stats.pendingDemands || 0,
    'approvedDemands': stats.approvedDemands || 0,
    'rejectedDemands': stats.rejectedDemands || 0
  };

  Object.entries(statElements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}


// ==========================================
// FIXED ADMIN DASHBOARD INITIALIZATION
// ==========================================

function initAdminDashboard() {
  console.log("🔧 Initializing Admin Dashboard...");

  // Check authentication first
  if (!checkAuthentication()) {
    console.warn("❌ Not authenticated, redirecting to login");
    window.location.href = "login.html";
    return;
  }

  // Get user and check role
  const user = getCurrentUser();
  console.log("👤 Current user:", user);

  if (!user || user.role !== 'admin') {
    console.warn("❌ Not admin, redirecting to user dashboard");
    window.location.href = "dashboard.html";
    return;
  }

  console.log("✅ Admin authenticated, setting up dashboard");

  // Setup admin interface
  setupAdminInterface();
  setupAdminNavigation();

  // Load data
  loadAdminStatistics();
  loadAllDemands();
  loadAllUsers();
}

// ==========================================
// IMPROVED AUTHENTICATION CHECK
// ==========================================

function checkAuthentication() {
  const token = getToken();

  if (!token) {
    console.log("No token found");
    return false;
  }

  try {
    // Decode JWT payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error("Invalid token format");
      clearAuthData();
      return false;
    }

    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (payload.exp && payload.exp < now) {
      console.warn("Token expired");
      clearAuthData();
      return false;
    }

    console.log("✅ Token valid, expires:", new Date(payload.exp * 1000).toLocaleString());
    return true;

  } catch (err) {
    console.error("Token validation error:", err);
    clearAuthData();
    return false;
  }
}

// ==========================================
// IMPROVED GET CURRENT USER
// ==========================================



// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function clearAuthData() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  console.log("🗑️ Auth data cleared");
}

// ==========================================
// SETUP ADMIN INTERFACE
// ==========================================

function setupAdminInterface() {
  const user = getCurrentUser();

  if (!user) {
    console.error("Cannot setup interface: no user");
    return;
  }

  // Update user email display
  const userEmailEl = document.getElementById('userEmail');
  if (userEmailEl) {
    userEmailEl.textContent = user.email;
  }

  // Update any admin name displays
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) {
    adminNameEl.textContent = user.name || 'Admin';
  }

  console.log("✅ Admin interface setup complete");
}

// ==========================================
// SETUP ADMIN NAVIGATION
// ==========================================

function setupAdminNavigation() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const pageTitle = document.getElementById('pageTitle');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Handle logout
      if (link.id === 'logoutBtn') {
        handleLogout(e);
        return;
      }

      // Get section to show
      const sectionId = link.getAttribute('data-section');
      if (!sectionId) return;

      // Update active states
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show section
      showSection(sectionId);

      // Update page title
      const sectionTitle = link.querySelector('span')?.textContent || 'Dashboard';
      if (pageTitle) {
        pageTitle.textContent = sectionTitle;
      }

      // Refresh icons
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    });
  });

  // Show default section
  showSection('admin-overview');
  console.log("✅ Admin navigation setup complete");
}

// ==========================================
// SHOW SECTION
// ==========================================

function showSection(sectionId) {
  const sections = document.querySelectorAll('.dashboard-section');
  sections.forEach(section => section.classList.remove('active'));

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    console.log("📄 Showing section:", sectionId);
  } else {
    console.warn("Section not found:", sectionId);
  }
}

// ==========================================
// LOAD ADMIN STATISTICS
// ==========================================

async function loadAdminStatistics() {
  console.log("📊 Loading admin statistics...");

  try {
    const res = await fetch(`${API_URL}/admin/statistics`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const stats = await res.json();
    console.log("📊 Statistics loaded:", stats);

    // Update UI
    updateAdminStatisticsDisplay(stats);

  } catch (err) {
    console.error('❌ Error loading statistics:', err);
    // Show user-friendly message
    const overview = document.getElementById('admin-overview');
    if (overview) {
      const alert = document.createElement('div');
      alert.className = 'alert error';
      alert.innerHTML = `
        <span class="alert-icon">⚠️</span>
        <span class="alert-msg">Failed to load statistics. Please refresh the page.</span>
      `;
      overview.insertBefore(alert, overview.firstChild);
    }
  }
}

function updateAdminStatisticsDisplay(stats) {
  const statElements = {
    'adminTotalDemands': stats.totalDemands || 0,
    'adminTotalUsers': stats.totalUsers || 0,
    'adminPendingDemands': stats.pendingDemands || 0,
    'adminInProgressDemands': stats.inProgressDemands || 0,
    'adminCompletedDemands': stats.completedDemands || 0,
    'adminRecentDemands': stats.recentDemands || 0
  };

  Object.entries(statElements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    } else {
      console.warn(`Element not found: ${id}`);
    }
  });

  console.log("✅ Statistics display updated");
}

// ==========================================
// LOAD ALL DEMANDS
// ==========================================

async function loadAllDemands() {
  console.log("📋 Loading all demands...");

  const tableBody = document.querySelector('#adminDemandsTable tbody');
  if (!tableBody) {
    console.warn("Demands table not found");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/admin/demands`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const demands = data.demands || data; // Handle both response formats

    console.log(`📋 Loaded ${demands.length} demands`);
    renderAdminDemands(demands);

    // Setup search and filters after demands are loaded
    setupAdminSearchAndFilters();

  } catch (err) {
    console.error('❌ Error loading demands:', err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem;">
          <div class="alert error">
            <span class="alert-icon">⚠️</span>
            <span class="alert-msg">Failed to load demands. Please refresh the page.</span>
          </div>
        </td>
      </tr>
    `;
  }
}
// ==========================================
// SETUP ADMIN SEARCH AND FILTERS
// ==========================================

function setupAdminSearchAndFilters() {
  console.log("🔍 Setting up admin search and filters...");

  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const searchButton = document.querySelector('.search-icon');

  if (searchInput) {
    // Remove any existing listeners
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    // Add new listener
    newSearchInput.addEventListener('input', debounce(filterAdminDemands, 300));
    console.log("✅ Admin search input listener added");
  }

  if (statusFilter) {
    // Remove any existing listeners
    const newStatusFilter = statusFilter.cloneNode(true);
    statusFilter.parentNode.replaceChild(newStatusFilter, statusFilter);

    // Add new listener
    newStatusFilter.addEventListener('change', filterAdminDemands);
    console.log("✅ Admin status filter listener added");
  }

  if (searchButton) {
    searchButton.addEventListener('click', () => {
      console.log("🔍 Admin search button clicked");
      filterAdminDemands();
    });
    console.log("✅ Admin search button listener added");
  }

  console.log("✅ Admin search and filters setup complete");
}

// ==========================================
// FILTER ADMIN DEMANDS
// ==========================================

function filterAdminDemands() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  if (!searchInput || !statusFilter) {
    console.error('Admin search input or status filter not found');
    return;
  }

  const searchTerm = searchInput.value.toLowerCase().trim();
  const statusValue = statusFilter.value.trim();

  console.log("🔍 Filtering admin demands:", {
    searchTerm,
    statusValue,
    hasSearchTerm: searchTerm.length > 0,
    hasStatusFilter: statusValue.length > 0
  });

  const rows = document.querySelectorAll('#adminDemandsTable tbody tr');
  let visibleCount = 0;

  rows.forEach(row => {
    // Skip empty state rows
    if (row.querySelector('.empty-state')) {
      return;
    }

    // Get data attributes (more reliable than parsing HTML)
    const rowTitle = row.getAttribute('data-title') || '';
    const rowEmail = row.getAttribute('data-email') || '';
    const rowCategory = row.getAttribute('data-category') || '';
    const rowStatus = row.getAttribute('data-status') || '';

    console.log('🔍 Row data:', {
      rowTitle,
      rowEmail,
      rowCategory,
      rowStatus,
      filterStatus: statusValue
    });

    // Check search match (search in title, email, and category)
    const matchesSearch = !searchTerm ||
      rowTitle.includes(searchTerm) ||
      rowEmail.includes(searchTerm) ||
      rowCategory.includes(searchTerm);

    // Check status match (both are already in same format: en-attente, en-cours, etc.)
    const matchesStatus = !statusValue || rowStatus === statusValue;

    console.log('🎯 Match results:', { matchesSearch, matchesStatus });

    // Show/hide row
    const shouldShow = matchesSearch && matchesStatus;
    row.style.display = shouldShow ? '' : 'none';

    if (shouldShow) {
      visibleCount++;
    }
  });

  console.log(`✅ Admin filtered: ${visibleCount} visible rows`);

  // Show "no results" message if needed
  showAdminNoResultsMessage(visibleCount);
}

// ==========================================
// SHOW ADMIN NO RESULTS MESSAGE
// ==========================================

function showAdminNoResultsMessage(visibleCount) {
  const tableBody = document.querySelector('#adminDemandsTable tbody');
  if (!tableBody) return;

  // Remove existing "no results" row
  const existingNoResults = tableBody.querySelector('.no-results-row');
  if (existingNoResults) {
    existingNoResults.remove();
  }

  // If no visible rows and we have some rows (not initial empty state)
  const totalRows = tableBody.querySelectorAll('tr:not(.no-results-row)').length;
  const hasEmptyState = tableBody.querySelector('.empty-state') !== null;

  if (visibleCount === 0 && totalRows > 0 && !hasEmptyState) {
    const noResultsRow = document.createElement('tr');
    noResultsRow.className = 'no-results-row';
    noResultsRow.innerHTML = `
      <td colspan="6">
        <div class="empty-state">
          <i data-lucide="search-x" style="width: 64px; height: 64px; margin: 0 auto 1rem; color: var(--gray-300);"></i>
          <h3>Aucun résultat</h3>
          <p>Aucune demande ne correspond à vos critères de recherche</p>
          <button class="btn-secondary btn-sm" onclick="clearAdminFilters()">
            <i data-lucide="x"></i> Effacer les filtres
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(noResultsRow);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ==========================================
// CLEAR ADMIN FILTERS
// ==========================================

function clearAdminFilters() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  if (searchInput) searchInput.value = '';
  if (statusFilter) statusFilter.value = '';

  filterAdminDemands();
}

// Make it globally accessible
window.clearAdminFilters = clearAdminFilters;


function renderAdminDemands(demands) {
  const tableBody = document.querySelector('#adminDemandsTable tbody');

  if (!tableBody) {
    console.warn("Admin demands table body not found");
    return;
  }

  tableBody.innerHTML = '';

  if (demands.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem;">
          <div class="empty-state">
            <i data-lucide="inbox" style="width: 64px; height: 64px; margin: 0 auto 1rem; color: var(--gray-300);"></i>
            <h3>Aucune demande</h3>
            <p>Aucune demande n'a été soumise</p>
          </div>
        </td>
      </tr>
    `;
    lucide?.createIcons();
    return;
  }

  demands.forEach((demand) => {
    const row = document.createElement('tr');

    // Add data attributes for easier filtering
    row.setAttribute('data-title', demand.title.toLowerCase());
    row.setAttribute('data-email', (demand.user?.email || '').toLowerCase());
    row.setAttribute('data-category', demand.category.toLowerCase());
    row.setAttribute('data-status', demand.status || '');

    row.innerHTML = `
      <td><strong>${escapeHtml(demand.title)}</strong><br><small style="color: var(--gray-500);">${escapeHtml(demand.user?.name || 'Utilisateur inconnu')}</small></td>
      <td>${escapeHtml(demand.user?.email || 'N/A')}</td>
      <td><span class="category-badge">${escapeHtml(demand.category)}</span></td>
      <td>${formatDate(demand.createdAt)}</td>
      <td>
        <span class="status-badge status-${demand.status}">
          ${getStatusLabel(demand.status)}
        </span>
      </td>
      <td>
        <button class="btn-sm btn-secondary" onclick="viewAdminDemand('${demand._id}')" title="Voir les détails">
          <i data-lucide="eye"></i> Voir
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  lucide?.createIcons();
  console.log("✅ Admin demands rendered");

  // Clear any active filters
  clearAdminFilters();
}
// ==========================================
// VIEW ADMIN DEMAND (ADMIN DASHBOARD)
// ==========================================

async function viewAdminDemand(demandId) {
  console.log("👁️ Admin viewing demand:", demandId);

  try {
    const res = await fetch(`${API_URL}/admin/demands/${demandId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      throw new Error('Failed to load demand details');
    }

    const demand = await res.json();
    showAdminDemandModal(demand);

  } catch (err) {
    console.error('❌ Error loading demand details:', err);
    showErrorMessage('Erreur lors du chargement des détails de la demande');
  }
}

// ==========================================
// SHOW ADMIN DEMAND MODAL
// ==========================================

function showAdminDemandModal(demand) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${escapeHtml(demand.title)}</h3>
        <button onclick="this.closest('.modal-overlay').remove()">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="detail-row">
          <strong>Client:</strong>
          <span>${escapeHtml(demand.user?.name || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <strong>Email:</strong>
          <span>${escapeHtml(demand.user?.email || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <strong>Téléphone:</strong>
          <span>${escapeHtml(demand.user?.phone || 'Non renseigné')}</span>
        </div>
        <div class="detail-row">
          <strong>Catégorie:</strong>
          <span class="category-badge">${escapeHtml(demand.category)}</span>
        </div>
        <div class="detail-row">
          <strong>Statut actuel:</strong>
          <span class="status-badge status-${demand.status}">
            ${getStatusLabel(demand.status)}
          </span>
        </div>
        <div class="detail-row">
          <strong>Budget:</strong>
          <span>${demand.budget || 'Non spécifié'}</span>
        </div>
        <div class="detail-row">
          <strong>Date limite:</strong>
          <span>${demand.deadline ? formatDate(demand.deadline) : 'Flexible'}</span>
        </div>
        <div class="detail-row">
          <strong>Préférence de contact:</strong>
          <span>${escapeHtml(demand.contactPreference || 'Email')}</span>
        </div>
        <div class="detail-row">
          <strong>Date de soumission:</strong>
          <span>${formatDate(demand.createdAt)}</span>
        </div>
        <div class="detail-row" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--gray-100);">
          <strong>Description complète:</strong>
        </div>
        <div style="margin-top: 0.5rem; padding: 1rem; background: var(--gray-50); border-radius: 8px;">
          <p style="white-space: pre-wrap; line-height: 1.6; color: var(--gray-700);">${escapeHtml(demand.description)}</p>
        </div>
        
        ${demand.status === 'en-attente' ? `
          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--gray-100);">
            <h4 style="margin-bottom: 1rem; color: var(--gray-800); font-weight: 600;">Changer le statut</h4>
            <select id="statusSelect" class="status-select" style="width: 100%; margin-bottom: 1rem;">
              <option value="en-attente" selected>En attente</option>
              <option value="en-cours">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="annulee">Annulée</option>
            </select>
            <button class="btn-primary" onclick="updateAdminDemandStatus('${demand._id}')">
              <i data-lucide="save"></i> Mettre à jour le statut
            </button>
          </div>
        ` : `
          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--gray-100);">
            <h4 style="margin-bottom: 1rem; color: var(--gray-800); font-weight: 600;">Changer le statut</h4>
            <select id="statusSelect" class="status-select" style="width: 100%; margin-bottom: 1rem;">
              <option value="en-attente" ${demand.status === 'en-attente' ? 'selected' : ''}>En attente</option>
              <option value="en-cours" ${demand.status === 'en-cours' ? 'selected' : ''}>En cours</option>
              <option value="terminee" ${demand.status === 'terminee' ? 'selected' : ''}>Terminée</option>
              <option value="annulee" ${demand.status === 'annulee' ? 'selected' : ''}>Annulée</option>
            </select>
            <button class="btn-primary" onclick="updateAdminDemandStatus('${demand._id}')">
              <i data-lucide="save"></i> Mettre à jour le statut
            </button>
          </div>
        `}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// ==========================================
// UPDATE ADMIN DEMAND STATUS
// ==========================================

async function updateAdminDemandStatus(demandId) {
  const statusSelect = document.getElementById('statusSelect');

  if (!statusSelect) {
    console.error('Status select not found');
    return;
  }

  const newStatus = statusSelect.value;

  console.log(`🔄 Updating demand ${demandId} to status: ${newStatus}`);

  try {
    const res = await fetch(`${API_URL}/admin/demands/${demandId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || 'Failed to update status');
    }

    const result = await res.json();
    console.log('✅ Status updated:', result);

    // Show success message
    showSuccessMessage(`✅ Statut mis à jour avec succès: ${getStatusLabel(newStatus)}`);

    // Close modal
    document.querySelector('.modal-overlay')?.remove();

    // Reload demands and statistics
    await loadAllDemands();
    await loadAdminStatistics();

  } catch (err) {
    console.error('❌ Error updating status:', err);
    showErrorMessage('❌ Erreur lors de la mise à jour du statut: ' + err.message);
  }
}

// Make functions globally accessible
window.viewAdminDemand = viewAdminDemand;
window.updateAdminDemandStatus = updateAdminDemandStatus;
// ==========================================
// LOAD ALL USERS
// ==========================================

async function loadAllUsers() {
  console.log("👥 Loading all users...");

  const tableBody = document.querySelector('#adminUsersTable tbody');
  if (!tableBody) {
    console.warn("Users table not found");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const users = await res.json();
    console.log(`👥 Loaded ${users.length} users`);
    console.log(users);
    renderAdminUsers(users);

  } catch (err) {
    console.error('❌ Error loading users:', err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 2rem;">
          <div class="alert error">
            <span class="alert-icon">⚠️</span>
            <span class="alert-msg">Failed to load users. Please refresh the page.</span>
          </div>
        </td>
      </tr>
    `;
  }
}

function renderAdminUsers(users) {
  const tableBody = document.querySelector('#adminUsersTable tbody');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (!users || users.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">
            <i data-lucide="users"></i>
            <h3>Aucun utilisateur</h3>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  users.forEach((user) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${escapeHtml(user.name)}</strong></td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.phone || 'N/A')}</td>
      <td>${formatDate(user.createdAt)}</td>
    `;
    tableBody.appendChild(row);
  });

  console.log("✅ Users rendered");
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getStatusLabel(status) {
  const statuses = {
    'en-attente': 'En attente',
    'en-cours': 'En cours',
    'terminee': 'Terminée',
    'annulee': 'Annulée'
  };
  return statuses[status] || status;
}
window.viewAdminDemand = viewAdminDemand;
