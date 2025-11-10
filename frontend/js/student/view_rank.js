const API_BASE_URL = 'https://grade-app-deployment.onrender.com';
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
    window.location.href = '../../templates/login.html';
}

function initializeApp() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');
    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');

    // Sidebar toggle
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            mainContent.classList.toggle('sidebar-open');
            const icon = hamburger.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    // Profile dropdown toggle
    if (profile) {
        profile.addEventListener('click', () => profileDropdown.classList.toggle('active'));
    }

    document.addEventListener('click', (e) => {
        if (profile && !profile.contains(e.target) && profileDropdown && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // Search filter
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const term = this.value.toLowerCase();
            document.querySelectorAll('.rank-row').forEach(row => {
                const name = row.querySelector('.student-name')?.textContent.toLowerCase() || '';
                const roll = row.querySelector('.student-roll')?.textContent.toLowerCase() || '';
                row.style.display = name.includes(term) || roll.includes(term) ? '' : 'none';
            });
        });
    }

    // Refresh
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            const old = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
            await loadRankingData();
            refreshBtn.innerHTML = old;
            refreshBtn.disabled = false;
            showNotification('Rankings updated successfully!', 'success');
        });
    }

    // Dashboard redirect
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            window.location.href = '../../templates/student/Student_DashBoard.html';
        });
    }

    // Setup logout functionality
    setupLogout();

    // Load ranking data
    loadRankingData();
}

function setupLogout() {
    const logoutLinks = document.querySelectorAll('a[href="../login.html"], .logout-btn, .fa-sign-out-alt');

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
        window.location.href = '../../templates/login.html';
    }
}

// Fetch ranking data from backend
async function loadRankingData() {
    try {
        console.log('Loading ranking data...');

        const res = await fetch(`${API_BASE_URL}/api/rankings`);
        if (!res.ok) throw new Error(`Failed to load rankings: ${res.status}`);

        const data = await res.json();
        console.log('Ranking data received:', data);

        // Get current student ID from session
        const currentSession = localStorage.getItem('currentSession');
        if (!currentSession) {
            redirectToLogin();
            return;
        }

        const session = JSON.parse(currentSession);
        const yourId = session.user.id;

        const rankings = data.rankings || [];
        const stats = data.stats || {};

        // Find student's data
        const yourData = rankings.find(s => s.rollNo === yourId || s.id === yourId);
        const yourRank = yourData ? yourData.rank : '-';

        // Display stats
        if (document.getElementById('totalStudents')) {
            document.getElementById('totalStudents').textContent = stats.totalStudents || rankings.length;
        }
        if (document.getElementById('yourRank')) {
            document.getElementById('yourRank').textContent = yourRank;
        }
        if (document.getElementById('yourPercentage')) {
            document.getElementById('yourPercentage').textContent = yourData ? yourData.percentage + '%' : '-';
        }
        if (document.getElementById('yourGrade')) {
            document.getElementById('yourGrade').textContent = yourData ? yourData.grade : '-';
        }

        // Display table
        const tbody = document.querySelector('.ranking-table tbody');
        if (tbody) {
            if (rankings.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="no-data">
                            <div class="empty-state">
                                <i class="fas fa-trophy"></i>
                                <h3>No Rankings Available</h3>
                                <p>No student rankings available yet. Please check back later.</p>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = rankings.map(r => `
                    <tr class="rank-row ${(r.rollNo === yourId || r.id === yourId) ? 'highlight' : ''}">
                        <td>
                            ${r.rank === 1 ? '<i class="fas fa-medal medal-gold"></i>' : 
                              r.rank === 2 ? '<i class="fas fa-medal medal-silver"></i>' : 
                              r.rank === 3 ? '<i class="fas fa-medal medal-bronze"></i>' : ''}
                            ${r.rank}
                        </td>
                        <td class="student-name">${r.name || 'Unknown'}</td>
                        <td class="student-roll">${r.rollNo || r.id || 'N/A'}</td>
                        <td>${r.totalMarks || 0}/500</td>
                        <td>${r.percentage || 0}%</td>
                        <td><span class="grade-badge grade-${(r.grade || 'N/A').toLowerCase()}">${r.grade || 'N/A'}</span></td>
                    </tr>
                `).join('');
            }
        }

    } catch (err) {
        console.error('Error loading ranking data:', err);
        const rankingContainer = document.querySelector('.ranking-container');
        if (rankingContainer) {
            rankingContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Rankings</h3>
                    <p>${err.message}</p>
                    <p>Please check if the server is running on ${API_BASE_URL}</p>
                    <button onclick="loadRankingData()" class="retry-btn">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
        showNotification('Failed to load ranking data', 'danger');
    }
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.student-rank-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `student-rank-notification alert-${type}`;
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

    // Add CSS animation if not already added
    if (!document.querySelector('#rank-notification-animations')) {
        const style = document.createElement('style');
        style.id = 'rank-notification-animations';
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

// Add CSS for medals and grade badges
if (!document.querySelector('#rank-styles')) {
    const style = document.createElement('style');
    style.id = 'rank-styles';
    style.textContent = `
        .medal-gold {
            color: #ffd700;
            margin-right: 5px;
        }
        .medal-silver {
            color: #c0c0c0;
            margin-right: 5px;
        }
        .medal-bronze {
            color: #cd7f32;
            margin-right: 5px;
        }
        .rank-row.highlight {
            background-color: #e3f2fd !important;
            border-left: 4px solid #2196f3;
            font-weight: 600;
        }
        .grade-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .grade-a-plus { background: #4caf50; color: white; }
        .grade-a { background: #8bc34a; color: white; }
        .grade-b { background: #ffc107; color: black; }
        .grade-c { background: #ff9800; color: white; }
        .grade-d { background: #f44336; color: white; }
        .grade-f { background: #d32f2f; color: white; }
        .grade-n/a { background: #9e9e9e; color: white; }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
        .empty-state i {
            font-size: 3em;
            margin-bottom: 15px;
            opacity: 0.5;
        }
        .empty-state h3 {
            margin-bottom: 10px;
            color: #495057;
        }
        .empty-state p {
            color: #6c757d;
        }
        
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
        
        .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .stat-icon {
            font-size: 2em;
            color: #007bff;
            margin-bottom: 10px;
        }
        .stat-info h3 {
            font-size: 1.8em;
            margin: 0;
            color: #343a40;
        }
        .stat-info p {
            margin: 5px 0 0 0;
            color: #6c757d;
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);
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

// Auto-refresh rankings every 60 seconds
setInterval(() => {
    console.log('Auto-refreshing rankings...');
    loadRankingData();
}, 60000);
