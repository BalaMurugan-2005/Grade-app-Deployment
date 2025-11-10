const API_BASE_URL = 'https://grade-app-deployment.onrender.com';
document.addEventListener('DOMContentLoaded', function() {
    // ✅ Check authentication first
    checkAuthentication();
    
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');

    // Sidebar toggle
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            mainContent.classList.toggle('sidebar-open');

            const icon = hamburger.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    // Profile dropdown toggle
    if (profile) {
        profile.addEventListener('click', function() {
            profileDropdown.classList.toggle('active');
        });
    }

    // Close profile dropdown if clicked outside
    document.addEventListener('click', function(event) {
        if (profile && !profile.contains(event.target) && profileDropdown && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('active');
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
                    hamburger.querySelector('i').classList.replace('fa-times', 'fa-bars');
                }
            }
        });
    });

    // ✅ Setup logout functionality
    setupLogout();
    
    // ✅ Load student data
    loadStudentData();
});

// ✅ Authentication Functions
async function checkAuthentication() {
    const currentSession = localStorage.getItem('currentSession');
    
    if (!currentSession) {
        redirectToLogin();
        return;
    }
    
    try {
        const session = JSON.parse(currentSession);
        if (session.userType !== 'student') {
            redirectToLogin();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/check-auth?userType=${session.userType}&userId=${session.user.id}`);
        
        if (!response.ok) {
            throw new Error('Authentication check failed');
        }
        
        const authData = await response.json();
        
        if (!authData.authenticated) {
            redirectToLogin();
            return;
        }
        
        // Update user info in dashboard
        updateUserInfo(authData.user);
        
    } catch (error) {
        console.error('Auth check error:', error);
        redirectToLogin();
    }
}

function setupLogout() {
    const logoutLinks = document.querySelectorAll('a[href="../../templates/login.html"], .logout-btn, .fa-sign-out-alt');
    
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    });
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/api/logout`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Logout API error:', error);
    } finally {
        // Clear session data
        localStorage.removeItem('currentSession');
        sessionStorage.removeItem('isAuthenticated');
        
        // Redirect to login
        window.location.href = '../frontend/templates/login.html';
    }
}

function redirectToLogin() {
    // Clear any existing session
    localStorage.removeItem('currentSession');
    sessionStorage.removeItem('isAuthenticated');
    
    // Redirect to login
    window.location.href = '../frontend/templates/login.html';
}

function updateUserInfo(user) {
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

        const response = await fetch(`${API_BASE_URL}/api/student/${studentId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch student data: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();

        console.log("✅ Student data from backend:", data);

        // Update student info in card
        const dataPlaceholder = document.querySelector('.data-placeholder');
        if (dataPlaceholder) {
            dataPlaceholder.innerHTML = `
                <div class="student-info-grid">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <div class="info-content">
                            <span class="info-label">Name:</span>
                            <span class="info-value">${data.name || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-id-card"></i>
                        <div class="info-content">
                            <span class="info-label">Roll No:</span>
                            <span class="info-value">${data.rollNo || data.id || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-graduation-cap"></i>
                        <div class="info-content">
                            <span class="info-label">Class:</span>
                            <span class="info-value">${data.class || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-users"></i>
                        <div class="info-content">
                            <span class="info-label">Section:</span>
                            <span class="info-value">${data.section || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-alt"></i>
                        <div class="info-content">
                            <span class="info-label">Academic Year:</span>
                            <span class="info-value">${data.academicYear || '2024-2025'}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-check"></i>
                        <div class="info-content">
                            <span class="info-label">Attendance:</span>
                            <span class="info-value">${data.attendance || 0}%</span>
                        </div>
                    </div>
                    ${data.isMarked ? `
                    <div class="info-item">
                        <i class="fas fa-chart-line"></i>
                        <div class="info-content">
                            <span class="info-label">Status:</span>
                            <span class="info-value status-${data.status?.toLowerCase() || 'unmarked'}">${data.status || 'Unmarked'}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            
            // Add some basic styling if needed
            
        }
        
    } catch (err) {
        console.error("❌ Error fetching student data:", err);
        const dataPlaceholder = document.querySelector('.data-placeholder');
        if (dataPlaceholder) {
            dataPlaceholder.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error fetching student data: ${err.message}</p>
                    <p>Please check if the server is running on ${API_BASE_URL}</p>
                    <button onclick="loadStudentData()" class="retry-btn">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
            
            // Add error styling
            if (!document.querySelector('#error-styles')) {
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
                    .error-message p {
                        margin: 10px 0;
                        line-height: 1.5;
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
                    }
                    .retry-btn:hover {
                        background: #c82333;
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
}

// Add network status monitoring
window.addEventListener('online', function() {
    console.log('Network connection restored');
    showNotification('Network connection restored', 'success');
});

window.addEventListener('offline', function() {
    console.log('Network connection lost');
    showNotification('Network connection lost', 'warning');
});

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.student-notification');
    existingNotifications.forEach(notification => notification.remove());
    
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
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    } else if (type === 'danger') {
        notification.style.backgroundColor = '#dc3545';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#ffc107';
        notification.style.color = '#212529';
    } else {
        notification.style.backgroundColor = '#17a2b8';
    }
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    
    
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

// Auto-refresh data every 30 seconds (optional)
setInterval(() => {
    console.log('Auto-refreshing student data...');
    loadStudentData();
}, 30000);
