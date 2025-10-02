// University Portal Frontend JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize navigation
    initNavigation();
    
    // Initialize modals
    initModals();
    
    // Set initial page
    showPage('main');
    
    console.log('University Portal initialized successfully');
}

// Navigation functionality
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetPage = this.getAttribute('data-page');
            if (targetPage) {
                navigateTo(targetPage);
            }
        });
    });
}

function navigateTo(pageId) {
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Add active class to clicked nav item
    const targetNavItem = document.querySelector(`[data-page="${pageId}"]`).closest('.nav-item');
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }
    
    // Show the target page
    showPage(pageId);
}

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update URL without page refresh
    history.pushState({ page: pageId }, '', `#${pageId}`);
    
    // Load page-specific content if needed
    loadPageContent(pageId);
}

// Page content loading
function loadPageContent(pageId) {
    switch(pageId) {
        case 'users':
            loadUsersContent();
            break;
        case 'courses':
            loadCoursesContent();
            break;
        case 'grades':
            loadGradesContent();
            break;
        case 'schedule':
            loadScheduleContent();
            break;
        case 'settings':
            loadSettingsContent();
            break;
        default:
            // Main page is static, no additional loading needed
            break;
    }
}

// Placeholder content loaders
function loadUsersContent() {
    console.log('Loading users content...');
    // Future implementation for loading users via API
}

function loadCoursesContent() {
    console.log('Loading courses content...');
    // Future implementation for loading courses via API
}

function loadGradesContent() {
    console.log('Loading grades content...');
    // Future implementation for loading grades via API
}

function loadScheduleContent() {
    console.log('Loading schedule content...');
    // Future implementation for loading schedule via API
}

function loadSettingsContent() {
    console.log('Loading settings content...');
    // Future implementation for settings management
}

// Modal functionality
function initModals() {
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('loginModal');
        if (e.target === modal) {
            closeLoginModal();
        }
    });
    
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus on email input
        setTimeout(() => {
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.focus();
            }
        }, 100);
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Clear form
        const form = document.getElementById('loginForm');
        if (form) {
            form.reset();
        }
    }
}

// Authentication functionality
function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Basic validation
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;
    
    // Simulate API call (replace with actual authentication)
    setTimeout(() => {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // For demo purposes, show success message
        // In real implementation, this would make an API call
        showNotification('Login functionality will be implemented with backend authentication', 'info');
        closeLoginModal();
    }, 1000);
}

function logout() {
    if (confirm('Are you sure you want to log out?')) {
        // In real implementation, this would call logout API
        showNotification('Logout functionality will be implemented with backend authentication', 'info');
        
        // For demo purposes, just reload the page
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 3000;
                min-width: 300px;
                max-width: 500px;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-info {
                background-color: #EBF8FF;
                border-left: 4px solid #3182CE;
                color: #2A4365;
            }
            
            .notification-error {
                background-color: #FED7D7;
                border-left: 4px solid #E53E3E;
                color: #742A2A;
            }
            
            .notification-success {
                background-color: #F0FFF4;
                border-left: 4px solid #38A169;
                color: #22543D;
            }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .notification-message {
                flex: 1;
                margin-right: 12px;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.3s;
            }
            
            .notification-close:hover {
                opacity: 1;
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
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(e) {
    if (e.state && e.state.page) {
        showPage(e.state.page);
        
        // Update active nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        const targetNavItem = document.querySelector(`[data-page="${e.state.page}"]`).closest('.nav-item');
        if (targetNavItem) {
            targetNavItem.classList.add('active');
        }
    }
});

// Mobile responsiveness
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Initialize responsive behavior
function initResponsive() {
    // Add mobile menu button if on mobile
    if (window.innerWidth <= 768) {
        addMobileMenuButton();
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.remove('open');
            }
            removeMobileMenuButton();
        } else {
            addMobileMenuButton();
        }
    });
}

function addMobileMenuButton() {
    if (document.querySelector('.mobile-menu-button')) return;
    
    const button = document.createElement('button');
    button.className = 'mobile-menu-button';
    button.innerHTML = '<i class="fas fa-bars"></i>';
    button.onclick = toggleSidebar;
    
    // Add button styles
    button.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1001;
        background-color: #202945;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 18px;
    `;
    
    document.body.appendChild(button);
}

function removeMobileMenuButton() {
    const button = document.querySelector('.mobile-menu-button');
    if (button) {
        button.remove();
    }
}

// Initialize responsive features
document.addEventListener('DOMContentLoaded', function() {
    initResponsive();
});

// API helper functions (for future implementation)
const API = {
    baseURL: '/api',
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            showNotification(error.message, 'error');
            throw error;
        }
    },
    
    get(endpoint) {
        return this.request(endpoint);
    },
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        navigateTo,
        showPage,
        showLoginModal,
        closeLoginModal,
        logout,
        showNotification,
        API
    };
}
