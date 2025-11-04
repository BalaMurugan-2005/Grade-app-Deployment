const API_BASE_URL = 'http://localhost:5001';

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

        const response = await fetch(`${API_BASE_URL}/api/student/${studentId}`);
        if (!response.ok) throw new Error("Failed to fetch student data");
        
        const data = await response.json();

        console.log("✅ Student data from backend:", data);

        // Update student info in card
        document.querySelector('.data-placeholder').innerHTML = `
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Roll No:</strong> ${data.id}</p>
            <p><strong>Class:</strong> ${data.className}</p>
            <p><strong>Academic Year:</strong> ${data.academicYear}</p>
            <p><strong>Attendance:</strong> ${data.attendance}</p>
        `;
    } catch (err) {
        console.error("❌ Error fetching student data:", err);
        document.querySelector('.data-placeholder').innerHTML = `
            <p style="color:red;">Error fetching student data. Please check your backend connection.</p>
        `;
    }
}