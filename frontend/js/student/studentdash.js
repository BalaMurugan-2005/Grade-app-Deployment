const API_BASE_URL = 'https://grade-app-deployment.onrender.com';

// Global state variables
let isRefreshing = false;
let currentRequestController = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - starting authentication check');
    
    // ✅ Check authentication first
    checkAuthentication();
    
    // Initialize UI components after DOM is ready
    initializeUIComponents();
});

// ✅ UI Components Initialization
function initializeUIComponents() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');

    // Validate critical DOM elements
    if (!hamburger || !sidebar || !mainContent) {
        console.error('Critical DOM elements missing');
        showNotification('Page initialization failed - missing elements', 'danger');
        return;
    }

    // Sidebar toggle
    hamburger.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('sidebar-open');

        const icon = hamburger.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        }
    });

    // Profile dropdown toggle
    if (profile && profileDropdown) {
        profile.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }

    // Close profile dropdown if clicked outside
    document.addEventListener('click', function(event) {
        if (profileDropdown && profileDropdown.classList.contains('active')) {
            if (!profile.contains(event.target) && !profileDropdown.contains(event.target)) {
                profileDropdown.classList.remove('active');
            }
        }
    });

    // Sidebar close on link click (for mobile)
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            // Handle logout link separately
            if (this.getAttribute('href') === '../../templates/login.html' || 
                this.querySelector('.fa-sign-out-alt')) {
                e.preventDefault();
                handleLogout();
                return;
            }
            
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
                mainContent.classList.remove('sidebar-open');
                if (hamburger) {
                    const icon = hamburger.querySelector('i');
                    if (icon) {
                        icon.classList.replace('fa-times', 'fa-bars');
                    }
                }
            }
        });
    });

    // ✅ Setup logout functionality
    setupLogout();
}

// ✅ Authentication Functions
async function checkAuthentication() {
    const currentSession = localStorage.getItem('currentSession');
    
    if (!currentSession) {
        console.warn('No session found in localStorage');
        redirectToLogin();
        return;
    }
    
    try {
        const session = JSON.parse(currentSession);
        
        if (!validateSession(session)) {
            console.warn('Invalid session structure');
            redirectToLogin();
            return;
        }
        
        if (session.userType !== 'student') {
            console.warn('Invalid user type:', session.userType);
            redirectToLogin();
            return;
        }
        
        // Safe URL construction
        const params = new URLSearchParams({
            userType: encodeURIComponent(session.userType),
            userId: encodeURIComponent(session.user.id)
        });
        
        const response = await fetch(`${API_BASE_URL}/api/check-auth?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`Authentication check failed: ${response.status} ${response.statusText}`);
        }
        
        const authData = await response.json();
        
        if (!authData.authenticated) {
            console.warn('Server authentication failed');
            redirectToLogin();
            return;
        }
        
        console.log('Authentication successful');
        
        // Update user info in dashboard
        updateUserInfo(authData.user);
        
        // ✅ Load student data after successful authentication
        loadStudentData();
        
    } catch (error) {
        console.error('Auth check error:', error);
        showNotification('Authentication error - please login again', 'danger');
        redirectToLogin();
    }
}

function validateSession(session) {
    return session && 
           session.userType && 
           session.user && 
           session.user.id &&
           typeof session.user.id === 'string' &&
           typeof session.userType === 'string';
}

function setupLogout() {
    // Use event delegation for logout links
    document.addEventListener('click', function(e) {
        const logoutLink = e.target.closest('a[href="../../templates/login.html"], .logout-btn, .fa-sign-out-alt');
        
        if (logoutLink) {
            e.preventDefault();
            handleLogout();
        }
    });
}

async function handleLogout() {
    try {
        showNotification('Logging out...', 'warning');
        
        // Cancel any ongoing requests
        if (currentRequestController) {
            currentRequestController.abort();
        }

        const response = await fetch(`${API_BASE_URL}/api/logout`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
            throw new Error(`Logout failed: ${response.status}`);
        }

        console.log('Logout successful');
    } catch (error) {
        if (error.name !== 'TimeoutError') {
            console.error('Logout API error:', error);
        }
        // Continue with client-side logout even if API fails
    } finally {
        // Always clear client-side data
        localStorage.removeItem('currentSession');
        sessionStorage.removeItem('isAuthenticated');
        window.location.href = '../../templates/login.html';
    }
}

function redirectToLogin() {
    console.log('Redirecting to login...');
    // Clear any existing session
    localStorage.removeItem('currentSession');
    sessionStorage.removeItem('isAuthenticated');
    
    // Redirect to login
    window.location.href = '../../templates/login.html';
}

function updateUserInfo(user) {
    if (!user || !user.name) {
        console.warn('Invalid user data for update');
        return;
    }

    // Update dashboard with user information
    const userElements = document.querySelectorAll('.user-name, .user-info');
    userElements.forEach(element => {
        if (element.classList.contains('user-name')) {
            element.textContent = user.name;
        }
    });
}

// ✅ Fetch student data from backend API
async function loadStudentData() {
    if (isRefreshing) {
        console.log('Student data refresh already in progress');
        return;
    }

    isRefreshing = true;
    
    // Abort previous request if exists
    if (currentRequestController) {
        currentRequestController.abort();
    }
    
    currentRequestController = new AbortController();
    
    try {
        // Get student ID from session
        const currentSession = localStorage.getItem('currentSession');
        if (!currentSession) {
            redirectToLogin();
            return;
        }
        
        const session = JSON.parse(currentSession);
        const studentId = session.user.id;

        console.log('Fetching student data for ID:', studentId);

        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 15000); // 15 second timeout

        const response = await fetch(`${API_BASE_URL}/api/student/${encodeURIComponent(studentId)}`, {
            signal: currentRequestController.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch student data: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();

        console.log("✅ Student data from backend:", data);

        // Update student info in card
        updateStudentInfoDisplay(data);
        
    } catch (err) {
        handleStudentDataError(err);
    } finally {
        isRefreshing = false;
        currentRequestController = null;
    }
}

function updateStudentInfoDisplay(data) {
    const dataPlaceholder = document.querySelector('.data-placeholder');
    if (!dataPlaceholder) {
        console.error('Data placeholder element not found');
        return;
    }

    // Escape HTML to prevent XSS
    const safeData = {
        name: escapeHtml(data.name || 'N/A'),
        rollNo: escapeHtml(data.rollNo || data.id || 'N/A'),
        class: escapeHtml(data.class || 'N/A'),
        section: escapeHtml(data.section || 'N/A'),
        academicYear: escapeHtml(data.academicYear || '2024-2025'),
        attendance: data.attendance || 0,
        isMarked: data.isMarked || false,
        status: escapeHtml(data.status || 'Unmarked')
    };

    dataPlaceholder.innerHTML = `
        <div class="student-info-grid">
            <div class="info-item">
                <i class="fas fa-user"></i>
                <div class="info-content">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${safeData.name}</span>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-id-card"></i>
                <div class="info-content">
                    <span class="info-label">Roll No:</span>
                    <span class="info-value">${safeData.rollNo}</span>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-graduation-cap"></i>
                <div class="info-content">
                    <span class="info-label">Class:</span>
                    <span class="info-value">${safeData.class}</span>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-users"></i>
                <div class="info-content">
                    <span class="info-label">Section:</span>
                    <span class="info-value">${safeData.section}</span>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-calendar-alt"></i>
                <div class="info-content">
                    <span class="info-label">Academic Year:</span>
                    <span class="info-value">${safeData.academicYear}</span>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-calendar-check"></i>
                <div class="info-content">
                    <span class="info-label">Attendance:</span>
                    <span class="info-value">${safeData.attendance}%</span>
                </div>
            </div>
            ${safeData.isMarked ? `
            <div class="info-item">
                <i class="fas fa-chart-line"></i>
                <div class="info-content">
                    <span class="info-label">Status:</span>
                    <span class="info-value status-${safeData.status.toLowerCase()}">${safeData.status}</span>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Add student info styles if not already added
    addStudentInfoStyles();
}

function handleStudentDataError(err) {
    console.error("❌ Error fetching student data:", err);
    
    let userMessage = 'Failed to load student data';
    
    if (err.name === 'AbortError') {
        userMessage = 'Request cancelled';
    } else if (err.name === 'TimeoutError') {
        userMessage = 'Request timeout - please try again';
    } else if (err.message.includes('Failed to fetch')) {
        userMessage = 'Network error - please check your connection';
    } else if (err.message.includes('HTTP 5')) {
        userMessage = 'Server error - please try again later';
    } else if (err.message.includes('HTTP 4')) {
        userMessage = 'Unable to load student data - authentication may be required';
    }

    const dataPlaceholder = document.querySelector('.data-placeholder');
    if (dataPlaceholder) {
        dataPlaceholder.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Student Data</h3>
                <p>${userMessage}</p>
                <p>Please check if the server is running on ${API_BASE_URL}</p>
                <button onclick="loadStudentData()" class="retry-btn">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
        
        addErrorStyles();
    }
    
    showNotification(userMessage, 'danger');
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function addStudentInfoStyles() {
    if (document.querySelector('#student-info-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'student-info-styles';
    style.textContent = `
        .student-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            padding: 10px;
        }
        .info-item {
            display: flex;
            align-items: center;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }
        .info-item i {
            font-size: 1.2em;
            color: #007bff;
            margin-right: 12px;
            width: 20px;
            text-align: center;
        }
        .info-content {
            display: flex;
            flex-direction: column;
        }
        .info-label {
            font-size: 0.85em;
            color: #6c757d;
            font-weight: 500;
            margin-bottom: 2px;
        }
        .info-value {
            font-size: 1em;
            color: #343a40;
            font-weight: 600;
        }
        .status-passed { color: #28a745; font-weight: 600; }
        .status-failed { color: #dc3545; font-weight: 600; }
        .status-unmarked { color: #6c757d; font-weight: 600; }
    `;
    document.head.appendChild(style);
}

function addErrorStyles() {
    if (document.querySelector('#error-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'error-styles';
    style.textContent = `
        .error-message {
            text-align: center;
            padding: 30px;
            color: #dc3545;
        }
        .error-message i {
            font-size: 3em;
            margin-bottom: 15px;
            opacity: 0.7;
        }
        .error-message h3 {
            margin-bottom: 10px;
            color: #dc3545;
        }
        .error-message p {
            margin: 10px 0;
            line-height: 1.5;
            color: #6c757d;
        }
        .retry-btn {
            margin-top: 15px;
            padding: 10px 20px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9em;
            transition: background-color 0.2s;
        }
        .retry-btn:hover {
            background: #c82333;
        }
    `;
    document.head.appendChild(style);
}

function showNotification(message, type) {
    // Remove existing notifications safely
    const existingNotifications = document.querySelectorAll('.student-notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.remove();
        }
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `student-notification alert-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        max-width: 300px;
        padding: 12px 16px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9em;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    if (type === 'warning') {
        notification.style.color = '#212529';
    }

    const icons = {
        success: 'check-circle',
        danger: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        ${escapeHtml(message)}
    `;
    
    document.body.appendChild(notification);
    
    // Add notification animations if not already added
    addNotificationAnimations();
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

function addNotificationAnimations() {
    if (!document.querySelector('#notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
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
}

// Network status monitoring
window.addEventListener('online', function() {
    console.log('Network connection restored');
    showNotification('Network connection restored', 'success');
    // Auto-retry loading data when connection is restored
    if (!isRefreshing) {
        setTimeout(() => loadStudentData(), 2000);
    }
});

window.addEventListener('offline', function() {
    console.log('Network connection lost');
    showNotification('Network connection lost - some features may not work', 'warning');
});

// Auto-refresh data every 30 seconds with safety checks
setInterval(() => {
    if (!isRefreshing && navigator.onLine) {
        console.log('Auto-refreshing student data...');
        loadStudentData();
    }
}, 30000);

// Add AbortSignal timeout polyfill for older browsers
if (!AbortSignal.timeout) {
    AbortSignal.timeout = function(ms) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    };
}
