// ✅ Use absolute URL for API calls
const API_BASE_URL = 'http://localhost:5001';

document.addEventListener('DOMContentLoaded', function() {
    // ✅ Check authentication first
    checkAuthentication();
    
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');

    // ✅ Sidebar toggle
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            mainContent.classList.toggle('sidebar-open');

            const icon = hamburger.querySelector('i');
            if (sidebar.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // ✅ Profile dropdown toggle
    if (profile) {
        profile.addEventListener('click', function() {
            profileDropdown.classList.toggle('active');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (profile && !profile.contains(event.target) && profileDropdown && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // Close sidebar on mobile when clicking link
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Handle logout link separately
            if (this.getAttribute('href') === '/frontend/templates/login.html' || 
                this.querySelector('.fa-sign-out-alt')) {
                e.preventDefault();
                handleLogout();
                return;
            }
            
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
                mainContent.classList.remove('sidebar-open');
                if (hamburger) {
                    hamburger.querySelector('i').classList.remove('fa-times');
                    hamburger.querySelector('i').classList.add('fa-bars');
                }
            }
        });
    });

    // ✅ Setup logout functionality
    setupLogout();
    
    // ✅ Load teacher data when page opens
    loadTeacherData();
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
        if (session.userType !== 'teacher') {
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
    const logoutLinks = document.querySelectorAll('a[href="/frontend/templates/login.html"], .logout-btn, .fa-sign-out-alt');
    
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
        window.location.href = '/frontend/templates/login.html';
    }
}

function redirectToLogin() {
    // Clear any existing session
    localStorage.removeItem('currentSession');
    sessionStorage.removeItem('isAuthenticated');
    
    // Redirect to login
    window.location.href = '/frontend/templates/login.html';
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

// ✅ Fetch teacher data from backend
async function loadTeacherData() {
    try {
        // Get teacher ID from session
        const currentSession = localStorage.getItem('currentSession');
        if (!currentSession) {
            redirectToLogin();
            return;
        }
        
        const session = JSON.parse(currentSession);
        const teacherId = session.user.id;

        console.log('Fetching teacher data for ID:', teacherId);

        const response = await fetch(`${API_BASE_URL}/api/teacher/${teacherId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch teacher data: ${response.status} ${errorText}`);
        }

        const teacher = await response.json();

        console.log('Teacher data received:', teacher);

        // ✅ Display teacher details in dashboard
        const teacherDetailsContainer = document.querySelector('.teacher-details');
        
        if (teacherDetailsContainer) {
            teacherDetailsContainer.innerHTML = `
                <div class="detail-item">
                    <span class="detail-label">Teacher Name:</span>
                    <span class="detail-value">${teacher.name || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Teacher ID:</span>
                    <span class="detail-value">${teacher.id || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${teacher.email || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Username:</span>
                    <span class="detail-value">${teacher.username || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value status-active">Active</span>
                </div>
            `;
        } else {
            console.error('Teacher details container not found');
        }
        
    } catch (error) {
        console.error('Error loading teacher data:', error);
        const teacherDetailsContainer = document.querySelector('.teacher-details');
        
        if (teacherDetailsContainer) {
            teacherDetailsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading teacher data: ${error.message}</p>
                    <p>Please check if the server is running on ${API_BASE_URL}</p>
                </div>
            `;
        }
    }
}

// Add some basic error handling for network issues
window.addEventListener('online', function() {
    console.log('Network connection restored');
});

window.addEventListener('offline', function() {
    console.log('Network connection lost');
    const teacherDetailsContainer = document.querySelector('.teacher-details');
    if (teacherDetailsContainer) {
        teacherDetailsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-wifi"></i>
                <p>Network connection lost. Please check your internet connection.</p>
            </div>
        `;
    }
});
