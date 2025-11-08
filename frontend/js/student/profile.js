const API_BASE_URL = 'http://localhost:5001';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    checkAuthentication();
    
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const cancelBtn = document.getElementById('cancelBtn');

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

    // Setup logout functionality
    setupLogout();
    
    // Load student profile data
    loadStudentProfile();
    
    // Handle password change form
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
    
    // Handle cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            changePasswordForm.reset();
        });
    }
});

// Authentication Functions
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

// Load student profile data
async function loadStudentProfile() {
    try {
        // Get student ID from session
        const currentSession = localStorage.getItem('currentSession');
        if (!currentSession) {
            redirectToLogin();
            return;
        }
        
        const session = JSON.parse(currentSession);
        const studentId = session.user.id;

        console.log('Fetching student profile for ID:', studentId);

        // Use the new profile API endpoint
        const response = await fetch(`${API_BASE_URL}/api/student/${studentId}/profile`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch student profile: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();

        console.log("✅ Student profile data from backend:", data);

        // Update profile header
        document.getElementById('studentName').textContent = data.name || 'N/A';
        document.getElementById('studentClass').textContent = `Class: ${data.class || 'N/A'}`;
        document.getElementById('studentRoll').textContent = `Roll No: ${data.rollNo || data.id || 'N/A'}`;
        
        // Update badges
        const badgesContainer = document.getElementById('profileBadges');
        if (data.badges && data.badges.length > 0) {
            badgesContainer.innerHTML = data.badges.map(badge => {
                let badgeClass = 'badge';
                if (badge.includes('rank-1')) badgeClass += ' rank-1';
                else if (badge.includes('rank-2')) badgeClass += ' rank-2';
                else if (badge.includes('rank-3')) badgeClass += ' rank-3';
                else if (badge.includes('perfect')) badgeClass += ' perfect';
                else if (badge.includes('excellence')) badgeClass += ' excellence';
                else if (badge.includes('achiever')) badgeClass += ' achiever';
                return `<span class="${badgeClass}">${formatBadgeName(badge)}</span>`;
            }).join('');
        } else {
            badgesContainer.innerHTML = '<span class="badge">No badges yet</span>';
        }

        // Update personal information
        const personalInfoContainer = document.getElementById('personalInfo');
        personalInfoContainer.innerHTML = `
            <div class="info-item">
                <span class="info-label">Full Name</span>
                <span class="info-value">${data.name || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${data.email || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Username</span>
                <span class="info-value">${data.username || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Student ID</span>
                <span class="info-value">${data.id || 'N/A'}</span>
            </div>
        `;

        // Update academic information
        const academicInfoContainer = document.getElementById('academicInfo');
        academicInfoContainer.innerHTML = `
            <div class="info-item">
                <span class="info-label">Class</span>
                <span class="info-value">${data.class || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Section</span>
                <span class="info-value">${data.section || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Academic Year</span>
                <span class="info-value">${data.academicYear || '2024-2025'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Attendance</span>
                <span class="info-value">${data.attendance || 0}%</span>
            </div>
            <div class="info-item">
                <span class="info-label">Rank</span>
                <span class="info-value">${data.rank ? `#${data.rank}` : 'Not Ranked'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Overall Grade</span>
                <span class="info-value grade-${(data.grade || '').toLowerCase()}">${data.grade || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Total Marks</span>
                <span class="info-value">${data.totalMarks || 0}/500</span>
            </div>
            <div class="info-item">
                <span class="info-label">Percentage</span>
                <span class="info-value">${data.percentage ? data.percentage.toFixed(1) + '%' : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Status</span>
                <span class="info-value status-${(data.status || '').toLowerCase()}">${data.status || 'N/A'}</span>
            </div>
        `;

        // Update subject marks
        const subjectMarksContainer = document.getElementById('subjectMarks');
        if (data.marks && Object.keys(data.marks).length > 0) {
            subjectMarksContainer.innerHTML = Object.entries(data.marks).map(([subject, marks]) => {
                const grade = calculateSubjectGrade(marks);
                return `
                    <div class="subject-card">
                        <div class="subject-name">${formatSubjectName(subject)}</div>
                        <div class="subject-marks">${marks}/100</div>
                        <span class="subject-grade grade-${grade.toLowerCase()}">${grade}</span>
                    </div>
                `;
            }).join('');
        } else {
            subjectMarksContainer.innerHTML = '<div class="no-marks">No marks available yet. Marks are not entered or processed.</div>';
        }
        
    } catch (err) {
        console.error("❌ Error fetching student profile:", err);
        showNotification('Error loading profile data. Please try again.', 'error');
        
        // Fallback: Show error state in UI
        document.getElementById('studentName').textContent = 'Error Loading Data';
        document.getElementById('studentClass').textContent = 'Class: N/A';
        document.getElementById('studentRoll').textContent = 'Roll No: N/A';
    }
}

// Change password function
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('New password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        // Get student ID from session
        const currentSession = localStorage.getItem('currentSession');
        if (!currentSession) {
            redirectToLogin();
            return;
        }
        
        const session = JSON.parse(currentSession);
        const studentId = session.user.id;
        
        // Send password change request to backend
        const response = await fetch(`${API_BASE_URL}/api/student/${studentId}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to change password');
        }
        
        // Success
        showNotification('Password changed successfully', 'success');
        document.getElementById('changePasswordForm').reset();
        
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification(error.message || 'Failed to change password', 'error');
    }
}

// Helper functions
function formatBadgeName(badge) {
    return badge
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatSubjectName(subject) {
    const subjectMap = {
        'tamil': 'Tamil',
        'english': 'English',
        'maths': 'Mathematics',
        'science': 'Science',
        'social': 'Social Science'
    };
    return subjectMap[subject] || subject.charAt(0).toUpperCase() + subject.slice(1);
}

function calculateSubjectGrade(marks) {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    if (marks >= 40) return 'D';
    return 'F';
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Add CSS for notifications if not already present
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .notification.success {
        background: #28a745;
        border-left: 4px solid #1e7e34;
    }
    
    .notification.error {
        background: #dc3545;
        border-left: 4px solid #c82333;
    }
    
    .notification.warning {
        background: #ffc107;
        color: #212529;
        border-left: 4px solid #e0a800;
    }
    
    .notification i {
        margin-right: 8px;
    }
    
    .no-marks {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #6c757d;
        font-style: italic;
    }
    
    .grade-a+ { color: #28a745; font-weight: bold; }
    .grade-a { color: #28a745; }
    .grade-b+ { color: #17a2b8; }
    .grade-b { color: #17a2b8; }
    .grade-c { color: #ffc107; }
    .grade-d { color: #fd7e14; }
    .grade-f { color: #dc3545; }
    
    .status-pass { color: #4710b7ff; font-weight: bold; }
    .status-fail { color: #dc3545; font-weight: bold; }
    .status-unmarked { color: #6c757d; }
`;

// Inject styles
if (!document.querySelector('#notification-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'notification-styles';
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
}
