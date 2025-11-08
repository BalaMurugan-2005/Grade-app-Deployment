// ✅ Use absolute URL for API calls
const API_BASE_URL = 'http://localhost:5001';

// DOM Elements
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const profile = document.getElementById('profile');
const profileDropdown = document.getElementById('profileDropdown');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const rankingBody = document.getElementById('rankingBody');
const totalStudents = document.getElementById('totalStudents');
const classAverage = document.getElementById('classAverage');
const topScore = document.getElementById('topScore');
const passPercentage = document.getElementById('passPercentage');

let rankingsData = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
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
    setupNavigation();
    loadRankings();
    setupEventListeners();
}

function setupNavigation() {
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
    
    if (profile) {
        profile.addEventListener('click', function() {
            profileDropdown.classList.toggle('active');
        });
    }
    
    document.addEventListener('click', function(event) {
        if (profile && !profile.contains(event.target) && profileDropdown && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('active');
        }
    });
    
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === 'login.html' || 
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

async function loadRankings() {
    try {
        console.log('Loading rankings data...');
        
        const rankingsResponse = await fetch(`${API_BASE_URL}/api/rankings`);
        
        if (!rankingsResponse.ok) {
            throw new Error(`Failed to load rankings: ${rankingsResponse.status}`);
        }

        const rankData = await rankingsResponse.json();
        console.log('Rankings data received:', rankData);

        // Extract rankings array and stats from the response
        rankingsData = rankData.rankings || [];
        const stats = rankData.stats || {};
        
        // Update stats using the stats from the API response
        updateStats(stats);
        
        // Display rankings
        displayRankings(rankingsData);
        
    } catch (error) {
        console.error('Error loading rankings:', error);
        showNotification(`Failed to load rankings data: ${error.message}`, 'danger');
        
        // Show error in table
        if (rankingBody) {
            rankingBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Error Loading Data</h3>
                            <p>${error.message}</p>
                            <p>Please check if the server is running on ${API_BASE_URL}</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function calculateStatistics(students, stats) {
    if (!students || students.length === 0) {
        return {
            totalStudents: 0,
            classAverage: 0,
            topScore: 0,
            passPercentage: 0,
            markedStudents: 0,
            unmarkedStudents: 0
        };
    }
    
    // Use stats from API response for total students count
    const totalStudentsCount = stats.totalStudents || students.length;
    
    // Filter only marked students with valid marks for calculations
    const markedStudents = students.filter(student => 
        student.isMarked && student.totalMarks !== null && student.totalMarks !== undefined
    );
    
    const unmarkedStudents = totalStudentsCount - markedStudents.length;
    
    if (markedStudents.length === 0) {
        return {
            totalStudents: totalStudentsCount,
            classAverage: 0,
            topScore: 0,
            passPercentage: 0,
            markedStudents: 0,
            unmarkedStudents: unmarkedStudents
        };
    }
    
    // Calculate statistics only for marked students
    const totalPercentage = markedStudents.reduce((sum, student) => sum + (student.percentage || 0), 0);
    const classAverage = totalPercentage / markedStudents.length;
    const topScore = Math.max(...markedStudents.map(student => student.totalMarks || 0));
    const passedStudents = markedStudents.filter(student => student.status === 'Pass').length;
    const passPercentage = (passedStudents / markedStudents.length) * 100;
    
    return {
        totalStudents: totalStudentsCount,
        classAverage: Math.round(classAverage * 10) / 10,
        topScore: topScore,
        passPercentage: Math.round(passPercentage),
        markedStudents: markedStudents.length,
        unmarkedStudents: unmarkedStudents
    };
}

function updateStats(stats) {
    // Use the stats directly from the API response
    if (totalStudents) totalStudents.textContent = stats.totalStudents || 0;
    
    // Calculate class average, top score, and pass percentage from rankings data
    const markedStudents = rankingsData.filter(student => 
        student.isMarked && student.totalMarks !== null && student.totalMarks !== undefined
    );
    
    if (markedStudents.length > 0) {
        const totalPercentage = markedStudents.reduce((sum, student) => sum + (student.percentage || 0), 0);
        const classAvg = totalPercentage / markedStudents.length;
        const topScr = Math.max(...markedStudents.map(student => student.totalMarks || 0));
        const passedStudents = markedStudents.filter(student => student.status === 'Pass').length;
        const passPerc = (passedStudents / markedStudents.length) * 100;
        
        if (classAverage) classAverage.textContent = `${Math.round(classAvg * 10) / 10}%`;
        if (topScore) topScore.textContent = topScr;
        if (passPercentage) passPercentage.textContent = `${Math.round(passPerc)}%`;
    } else {
        if (classAverage) classAverage.textContent = '0%';
        if (topScore) topScore.textContent = '0';
        if (passPercentage) passPercentage.textContent = '0%';
    }
}

function displayRankings(students) {
    if (!rankingBody) return;
    
    rankingBody.innerHTML = '';
    
    if (!students || students.length === 0) {
        rankingBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-trophy"></i>
                        <h3>No Rankings Available</h3>
                        <p>No student rankings available for display.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Filter only marked students and sort by rank
    const markedStudents = students
        .filter(student => student.isMarked && student.rank)
        .sort((a, b) => (a.rank || 999) - (b.rank || 999));
    
    if (markedStudents.length === 0) {
        rankingBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-edit"></i>
                        <h3>No Marks Entered</h3>
                        <p>No students have marks entered yet. Please enter marks first.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    markedStudents.forEach((student) => {
        const row = document.createElement('tr');
        row.className = 'rank-row';
        
        // Add medal for top 3 ranks (same as student view)
        let rankDisplay = `<span class="rank-cell">${student.rank}</span>`;
        if (student.rank === 1) {
            rankDisplay = `<div class="rank-cell"><i class="fas fa-medal medal medal-gold"></i> ${student.rank}</div>`;
        } else if (student.rank === 2) {
            rankDisplay = `<div class="rank-cell"><i class="fas fa-medal medal medal-silver"></i> ${student.rank}</div>`;
        } else if (student.rank === 3) {
            rankDisplay = `<div class="rank-cell"><i class="fas fa-medal medal medal-bronze"></i> ${student.rank}</div>`;
        }
        
        row.innerHTML = `
            <td>${rankDisplay}</td>
            <td>
                <div class="student-info">
                    <div class="avatar">${student.name ? student.name.charAt(0).toUpperCase() : '?'}</div>
                    <div class="student-details">
                        <div class="student-name">${student.name || 'Unknown'}</div>
                        <div class="student-roll">${student.rollNo || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td class="marks-cell">${student.totalMarks || 0}/500</td>
            <td class="average-cell">${student.percentage || 0}%</td>
            <td><span class="grade-badge ${getGradeClass(student.grade)}">${student.grade || 'N/A'}</span></td>
        `;
        
        rankingBody.appendChild(row);
    });
}

function getGradeClass(grade) {
    if (!grade) return 'grade-unknown';
    
    switch(grade.toUpperCase()) {
        case 'A+': return 'grade-a-plus';
        case 'A': return 'grade-a';
        case 'B+': return 'grade-b-plus';
        case 'B': return 'grade-b';
        case 'C+': return 'grade-c-plus';
        case 'C': return 'grade-c';
        case 'D': return 'grade-d';
        case 'F': return 'grade-f';
        default: return 'grade-unknown';
    }
}

function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterRankings(this.value);
        });
    }
    
    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
            
            loadRankings().finally(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
                showNotification('Rankings updated successfully!', 'success');
            });
        });
    }
    
    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportToCSV();
        });
    }
}

function filterRankings(searchTerm) {
    if (!searchTerm) {
        displayRankings(rankingsData);
        return;
    }
    
    const filteredStudents = rankingsData.filter(student => 
        student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo && student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    displayRankings(filteredStudents);
}

async function exportToCSV() {
    try {
        // Filter only marked students for export
        const markedStudents = rankingsData.filter(student => student.isMarked && student.rank);
        
        if (markedStudents.length === 0) {
            showNotification('No data available to export', 'warning');
            return;
        }
        
        // Create CSV content from current rankings data
        let csvContent = "Rank,Student Name,Roll No,Class,Section,Total Marks,Percentage,Grade,Status\n";
        
        markedStudents.forEach((student) => {
            const row = [
                student.rank,
                `"${student.name || 'Unknown'}"`,
                student.rollNo || 'N/A',
                student.class || 'N/A',
                student.section || 'N/A',
                student.totalMarks || 0,
                student.percentage || 0,
                student.grade || 'N/A',
                student.status || 'N/A'
            ];
            csvContent += row.join(',') + '\n';
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `class_rankings_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Rankings exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export rankings', 'danger');
    }
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification alert-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        z-index: 10000;
        max-width: 300px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
        font-family: 'Poppins', sans-serif;
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
    
    // Add CSS animation if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
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
