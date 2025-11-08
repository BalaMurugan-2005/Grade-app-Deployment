const API_BASE_URL = 'http://localhost:5001';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    checkAuthentication();
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
        
        // Initialize app after successful authentication
        initializeApp();
        
    } catch (error) {
        console.error('Auth check error:', error);
        redirectToLogin();
    }
}

function redirectToLogin() {
    localStorage.removeItem('currentSession');
    sessionStorage.removeItem('isAuthenticated');
    window.location.href = '/frontend/templates/login.html';
}

function initializeApp() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');

    // Toggle sidebar
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            mainContent.classList.toggle('sidebar-open');

            const icon = hamburger.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    // Profile dropdown
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

    // Close sidebar on small screen when link clicked
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

    // Load result data
    loadResultData();

    // Download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadReportCard();
        });
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
        localStorage.removeItem('currentSession');
        sessionStorage.removeItem('isAuthenticated');
        window.location.href = '/frontend/templates/login.html';
    }
}

// Fetch and display result data
async function loadResultData() {
    try {
        // Get student ID from session
        const currentSession = localStorage.getItem('currentSession');
        if (!currentSession) {
            redirectToLogin();
            return;
        }
        
        const session = JSON.parse(currentSession);
        const studentId = session.user.id;

        console.log('Fetching result data for student:', studentId);

        const response = await fetch(`${API_BASE_URL}/api/result/${studentId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch result data: ${response.status}`);
        }
        
        const data = await response.json();

        console.log("✅ Result data loaded successfully:", data);

        displayStudentInfo(data.student);
        displaySubjects(data.subjects);
        displaySummary(data.summary);

    } catch (error) {
        console.error("❌ Error loading result data:", error);
        const cardsContainer = document.querySelector('.cards-container .data-placeholder');
        if (cardsContainer) {
            cardsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error fetching student result: ${error.message}</p>
                    <p>Please check if the server is running on ${API_BASE_URL}</p>
                    <button onclick="loadResultData()" class="retry-btn">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
        showNotification('Failed to load result data', 'danger');
    }
}

// Display Student Info
function displayStudentInfo(student) {
    const container = document.querySelector('.cards-container .data-placeholder');
    if (container) {
        container.innerHTML = `
            <div class="student-info-grid">
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <div class="info-content">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${student.name || 'N/A'}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-id-card"></i>
                    <div class="info-content">
                        <span class="info-label">Roll No:</span>
                        <span class="info-value">${student.rollNo || 'N/A'}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-graduation-cap"></i>
                    <div class="info-content">
                        <span class="info-label">Class:</span>
                        <span class="info-value">${student.class || 'N/A'}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-users"></i>
                    <div class="info-content">
                        <span class="info-label">Section:</span>
                        <span class="info-value">${student.section || 'N/A'}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <div class="info-content">
                        <span class="info-label">Academic Year:</span>
                        <span class="info-value">${student.academicYear || '2024-2025'}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Display Subjects Table
function displaySubjects(subjects) {
    const tableContainer = document.querySelector('.table-container .data-placeholder');
    if (tableContainer) {
        if (subjects && subjects.length > 0) {
            tableContainer.innerHTML = `
                <table class="marks-table">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Marks</th>
                            <th>Grade</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjects.map(sub => `
                            <tr>
                                <td>${sub.name || 'N/A'}</td>
                                <td>${sub.marks || 0}/100</td>
                                <td><span class="grade-badge grade-${(sub.grade || 'N/A').toLowerCase()}">${sub.grade || 'N/A'}</span></td>
                                <td><span class="status-${(sub.marks >= 40 ? 'pass' : 'fail')}">${sub.marks >= 40 ? 'Pass' : 'Fail'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            tableContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-book"></i>
                    <p>No subject marks available yet.</p>
                    <p>Please check back later when marks are published.</p>
                </div>
            `;
        }
    }
}

// Display Summary Cards
function displaySummary(summary) {
    const summaryCards = document.querySelectorAll('.result-summary .summary-card');
    if (summaryCards.length >= 4) {
        summaryCards[0].innerHTML = `
            <div class="summary-content">
                <i class="fas fa-chart-bar"></i>
                <div class="summary-value">${summary.totalMarks || 0}/500</div>
                <div class="summary-label">Total Marks</div>
            </div>
        `;
        summaryCards[1].innerHTML = `
            <div class="summary-content">
                <i class="fas fa-percentage"></i>
                <div class="summary-value">${summary.percentage || 0}%</div>
                <div class="summary-label">Percentage</div>
            </div>
        `;
        summaryCards[2].innerHTML = `
            <div class="summary-content">
                <i class="fas fa-award"></i>
                <div class="summary-value grade-${(summary.grade || 'N/A').toLowerCase()}">${summary.grade || 'N/A'}</div>
                <div class="summary-label">Overall Grade</div>
            </div>
        `;
        summaryCards[3].innerHTML = `
            <div class="summary-content">
                <i class="fas fa-clipboard-check"></i>
                <div class="summary-value result-${(summary.status || 'unmarked').toLowerCase()}">${summary.status || 'Unmarked'}</div>
                <div class="summary-label">Result Status</div>
            </div>
        `;
    }
}

// Download Report Card
function downloadReportCard() {
    try {
        // Get current student data
        const currentSession = localStorage.getItem('currentSession');
        if (!currentSession) {
            showNotification('Please login to download report card', 'warning');
            return;
        }
        
        const session = JSON.parse(currentSession);
        const studentName = session.user.name;
        
        // Create a simple PDF download simulation
        showNotification('Preparing your report card for download...', 'info');
        
        setTimeout(() => {
            // In a real application, this would generate a PDF
            // For now, we'll create a simple text file
            const studentInfo = document.querySelector('.student-info-grid')?.innerText || 'Student Information';
            const marksTable = document.querySelector('.marks-table')?.innerText || 'Marks not available';
            const summary = document.querySelectorAll('.summary-value');
            
            let reportContent = `
GRADE MASTER - REPORT CARD
===========================

STUDENT INFORMATION:
${studentInfo}

SUBJECT-WISE MARKS:
${marksTable}

OVERALL SUMMARY:
Total Marks: ${summary[0]?.innerText || 'N/A'}
Percentage: ${summary[1]?.innerText || 'N/A'}
Grade: ${summary[2]?.innerText || 'N/A'}
Status: ${summary[3]?.innerText || 'N/A'}

Generated on: ${new Date().toLocaleDateString()}
            `;
            
            // Create and download text file
            const blob = new Blob([reportContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${studentName}_Report_Card_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('Report card downloaded successfully!', 'success');
            
        }, 2000);
        
    } catch (error) {
        console.error('Error downloading report card:', error);
        showNotification('Failed to download report card', 'danger');
    }
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.result-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `result-notification alert-${type}`;
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
    } else if (type === 'info') {
        notification.style.backgroundColor = '#17a2b8';
    } else {
        notification.style.backgroundColor = '#6c757d';
    }
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Add CSS animation if not already added
    
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


// Add network status monitoring
window.addEventListener('online', function() {
    console.log('Network connection restored');
    showNotification('Network connection restored', 'success');
});

window.addEventListener('offline', function() {
    console.log('Network connection lost');
    showNotification('Network connection lost', 'warning');
});

// Auto-refresh result data every 30 seconds
setInterval(() => {
    console.log('Auto-refreshing result data...');
    loadResultData();
}, 30000);
