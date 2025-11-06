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
    
    // Load teacher profile data
    loadTeacherProfile();
    
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

// Load teacher profile data
async function loadTeacherProfile() {
    try {
        // Get teacher ID from session
        const currentSession = localStorage.getItem('currentSession');
        if (!currentSession) {
            redirectToLogin();
            return;
        }
        
        const session = JSON.parse(currentSession);
        const teacherId = session.user.id;

        console.log('🔍 Fetching teacher profile for ID:', teacherId);

        // Try the main teacher profile endpoint first
        const response = await fetch(`${API_BASE_URL}/api/teacher/${teacherId}/profile`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            throw new Error(`Failed to fetch teacher profile: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ Teacher profile data received:", data);

        // Update the UI with the data
        updateProfileUI(data);
        
    } catch (err) {
        console.error("❌ Error fetching teacher profile:", err);
        showNotification('Error loading profile data: ' + err.message, 'error');
        showFallbackData();
    }
}

// Function to update UI with profile data
function updateProfileUI(data) {
    // Update profile header
    document.getElementById('teacherName').textContent = data.name || 'N/A';
    document.getElementById('teacherDesignation').textContent = `Designation: ${data.designation || 'N/A'}`;
    document.getElementById('teacherId').textContent = `Teacher ID: ${data.id || 'N/A'}`;
    
    // Update badges
    const badgesContainer = document.getElementById('profileBadges');
    if (data.badges && data.badges.length > 0) {
        badgesContainer.innerHTML = data.badges.map(badge => {
            let badgeClass = 'badge teacher-badge';
            if (badge.includes('efficient')) badgeClass += ' efficient';
            else if (badge.includes('dedicated')) badgeClass += ' dedicated';
            else if (badge.includes('excellence')) badgeClass += ' excellence';
            else if (badge.includes('success')) badgeClass += ' success';
            else if (badge.includes('active')) badgeClass += ' active';
            else if (badge.includes('new')) badgeClass += ' new';
            return `<span class="${badgeClass}">${formatBadgeName(badge)}</span>`;
        }).join('');
    } else {
        badgesContainer.innerHTML = '<span class="badge teacher-badge new">New Educator</span>';
    }

    // Update personal information
    updatePersonalInfo(data);
    
    // Update professional information  
    updateProfessionalInfo(data);
    
    // Update teaching statistics
    updateTeachingStats(data);
    
    // Update subjects handled
    updateSubjects(data);
    
    // Update contact information
    updateContactInfo(data);
}

// Helper functions for updating different sections
function updatePersonalInfo(data) {
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
            <span class="info-label">Teacher ID</span>
            <span class="info-value">${data.id || 'N/A'}</span>
        </div>
    `;
}

function updateProfessionalInfo(data) {
    const professionalInfoContainer = document.getElementById('professionalInfo');
    professionalInfoContainer.innerHTML = `
        <div class="info-item">
            <span class="info-label">Designation</span>
            <span class="info-value">${data.designation || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Department</span>
            <span class="info-value">${data.department || 'Academic Department'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Join Date</span>
            <span class="info-value">${data.joinDate || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Experience</span>
            <span class="info-value">${data.experience || 'N/A'}</span>
        </div>
    `;
}

function updateTeachingStats(data) {
    const teachingStatsContainer = document.getElementById('teachingStats');
    if (data.statistics) {
        teachingStatsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon total-students">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${data.statistics.totalStudents || 0}</div>
                    <div class="stat-label">Total Students</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon evaluated">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${data.statistics.markedStudents || 0}</div>
                    <div class="stat-label">Evaluated</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon pending">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${data.statistics.pendingEvaluations || 0}</div>
                    <div class="stat-label">Pending</div>
                </div>
            </div>
            ${data.statistics.classAverage ? `
            <div class="stat-card">
                <div class="stat-icon average">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${data.statistics.classAverage}</div>
                    <div class="stat-label">Class Average</div>
                </div>
            </div>
            ` : ''}
            ${data.statistics.passPercentage ? `
            <div class="stat-card">
                <div class="stat-icon pass-rate">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${data.statistics.passPercentage}%</div>
                    <div class="stat-label">Pass Rate</div>
                </div>
            </div>
            ` : ''}
            ${data.statistics.topScore ? `
            <div class="stat-card">
                <div class="stat-icon top-score">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${data.statistics.topScore || 0}</div>
                    <div class="stat-label">Top Score</div>
                </div>
            </div>
            ` : ''}
        `;
    } else {
        teachingStatsContainer.innerHTML = '<div class="no-data">No statistics available yet.</div>';
    }
}

function updateSubjects(data) {
    const subjectsContainer = document.getElementById('subjectsHandled');
    if (data.subjects && data.subjects.length > 0) {
        subjectsContainer.innerHTML = data.subjects.map(subject => `
            <div class="subject-card">${subject}</div>
        `).join('');
    } else {
        subjectsContainer.innerHTML = '<div class="no-data">No subjects assigned yet.</div>';
    }
}

function updateContactInfo(data) {
    const contactInfoContainer = document.getElementById('contactInfo');
    if (data.contact) {
        contactInfoContainer.innerHTML = `
            <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${data.contact.email || data.email || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Phone</span>
                <span class="info-value">${data.contact.phone || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Address</span>
                <span class="info-value">${data.contact.address || 'N/A'}</span>
            </div>
        `;
    } else {
        contactInfoContainer.innerHTML = `
            <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${data.email || 'N/A'}</span>
            </div>
            <div class="no-data">Additional contact information not available.</div>
        `;
    }
}

function showFallbackData() {
    document.getElementById('teacherName').textContent = 'Error Loading Data';
    document.getElementById('teacherDesignation').textContent = 'Designation: N/A';
    document.getElementById('teacherId').textContent = 'Teacher ID: N/A';
    document.getElementById('profileBadges').innerHTML = '<span class="badge teacher-badge">Error</span>';
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
        // Get teacher ID from session
        const currentSession = localStorage.getItem('currentSession');
        if (!currentSession) {
            redirectToLogin();
            return;
        }
        
        const session = JSON.parse(currentSession);
        const teacherId = session.user.id;
        
        // Send password change request to backend
        const response = await fetch(`${API_BASE_URL}/api/teacher/${teacherId}/change-password`, {
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