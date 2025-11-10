const API_BASE_URL = 'https://grade-app-deployment.onrender.com';

// Global state variables
let isRefreshing = false;
let currentRefreshController = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - starting authentication check');
    checkAuthentication();
});

// Authentication Functions
async function checkAuthentication() {
    console.log('Checking authentication...');
    
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
        initializeApp();

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

function redirectToLogin() {
    console.log('Redirecting to login...');
    localStorage.removeItem('currentSession');
    sessionStorage.removeItem('isAuthenticated');
    window.location.href = '../login.html';
}

function initializeApp() {
    console.log('Initializing application...');
    
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');
    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');

    // Validate critical DOM elements
    if (!hamburger || !sidebar || !mainContent) {
        console.error('Critical DOM elements missing. Required: hamburger, sidebar, mainContent');
        showNotification('Page initialization failed - missing elements', 'danger');
        return;
    }

    // Sidebar toggle
    hamburger.addEventListener('click', () => {
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
        profile.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (profileDropdown && profileDropdown.classList.contains('active')) {
            if (!profile.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        }
    });

    // Search filter with debounce
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const term = this.value.toLowerCase().trim();
                filterRankingRows(term);
            }, 300);
        });
    }

    // Refresh button with loading state
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleManualRefresh);
    }

    // Dashboard redirect
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            window.location.href = '../../templates/student/Student_DashBoard.html';
        });
    }

    // Setup logout functionality
    setupLogout();

    // Add rank styles
    addRankStyles();

    // Load initial ranking data
    loadRankingData();

    console.log('Application initialized successfully');
}

function filterRankingRows(searchTerm) {
    const rows = document.querySelectorAll('.rank-row');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const name = row.querySelector('.student-name')?.textContent?.toLowerCase() || '';
        const roll = row.querySelector('.student-roll')?.textContent?.toLowerCase() || '';
        const isVisible = name.includes(searchTerm) || roll.includes(searchTerm);
        
        row.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
    });

    // Show no results message if needed
    showNoResultsMessage(visibleCount === 0 && searchTerm.length > 0);
}

function showNoResultsMessage(show) {
    let noResultsMsg = document.getElementById('noResultsMessage');
    
    if (show && !noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'noResultsMessage';
        noResultsMsg.className = 'no-results-message';
        noResultsMsg.innerHTML = `
            <i class="fas fa-search"></i>
            <h4>No students found</h4>
            <p>Try adjusting your search terms</p>
        `;
        
        const tableBody = document.querySelector('.ranking-table tbody');
        if (tableBody) {
            tableBody.parentNode.insertBefore(noResultsMsg, tableBody.nextSibling);
        }
    } else if (!show && noResultsMsg) {
        noResultsMsg.remove();
    }
}

async function handleManualRefresh() {
    if (isRefreshing) {
        showNotification('Refresh already in progress', 'warning');
        return;
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (!refreshBtn) return;

    const oldHTML = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    refreshBtn.disabled = true;

    try {
        await loadRankingData();
        showNotification('Rankings updated successfully!', 'success');
    } catch (error) {
        console.error('Manual refresh error:', error);
        showNotification('Failed to refresh rankings', 'danger');
    } finally {
        refreshBtn.innerHTML = oldHTML;
        refreshBtn.disabled = false;
    }
}

function setupLogout() {
    // Use event delegation for logout links
    document.addEventListener('click', function(e) {
        const logoutLink = e.target.closest('a[href="../login.html"], .logout-btn, .fa-sign-out-alt');
        
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
        if (currentRefreshController) {
            currentRefreshController.abort();
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

// Fetch ranking data from backend
async function loadRankingData() {
    if (isRefreshing) {
        console.log('Refresh already in progress, skipping...');
        return;
    }

    isRefreshing = true;
    
    // Abort previous request if exists
    if (currentRefreshController) {
        currentRefreshController.abort();
    }
    
    currentRefreshController = new AbortController();
    
    try {
        console.log('Loading ranking data...');

        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 15000); // 15 second timeout

        const res = await fetch(`${API_BASE_URL}/api/rankings`, {
            signal: currentRefreshController.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

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

        // Update statistics display
        updateStatisticsDisplay(rankings, stats, yourId);

        // Update ranking table
        updateRankingTable(rankings, yourId);

    } catch (err) {
        handleRankingError(err);
    } finally {
        isRefreshing = false;
        currentRefreshController = null;
    }
}

function updateStatisticsDisplay(rankings, stats, yourId) {
    // Find student's data
    const yourData = rankings.find(s => s.rollNo === yourId || s.id === yourId);
    const yourRank = yourData ? yourData.rank : '-';
    const yourPercentage = yourData ? yourData.percentage : 0;
    const yourGrade = yourData ? yourData.grade : '-';

    // Update stats cards safely
    const totalStudentsEl = document.getElementById('totalStudents');
    const yourRankEl = document.getElementById('yourRank');
    const yourPercentageEl = document.getElementById('yourPercentage');
    const yourGradeEl = document.getElementById('yourGrade');

    if (totalStudentsEl) {
        totalStudentsEl.textContent = stats.totalStudents || rankings.length;
    }
    if (yourRankEl) {
        yourRankEl.textContent = yourRank;
    }
    if (yourPercentageEl) {
        yourPercentageEl.textContent = yourPercentage ? yourPercentage + '%' : '-';
    }
    if (yourGradeEl) {
        yourGradeEl.textContent = yourGrade;
        
        // Update grade badge class
        yourGradeEl.className = 'grade-badge';
        if (yourGrade && yourGrade !== '-') {
            yourGradeEl.classList.add(`grade-${yourGrade.toLowerCase().replace('+', '-plus')}`);
        }
    }
}

function updateRankingTable(rankings, yourId) {
    const tbody = document.querySelector('.ranking-table tbody');
    if (!tbody) {
        console.error('Ranking table body not found');
        return;
    }

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
        tbody.innerHTML = rankings.map(r => {
            const isCurrentStudent = (r.rollNo === yourId || r.id === yourId);
            const medalIcon = getMedalIcon(r.rank);
            const gradeClass = r.grade ? `grade-${r.grade.toLowerCase().replace('+', '-plus')}` : 'grade-n/a';
            
            return `
                <tr class="rank-row ${isCurrentStudent ? 'highlight' : ''}">
                    <td>
                        ${medalIcon}
                        ${r.rank}
                    </td>
                    <td class="student-name">${escapeHtml(r.name || 'Unknown')}</td>
                    <td class="student-roll">${escapeHtml(r.rollNo || r.id || 'N/A')}</td>
                    <td>${r.totalMarks || 0}/500</td>
                    <td>${r.percentage || 0}%</td>
                    <td><span class="grade-badge ${gradeClass}">${escapeHtml(r.grade || 'N/A')}</span></td>
                </tr>
            `;
        }).join('');
    }
}

function getMedalIcon(rank) {
    switch(rank) {
        case 1: return '<i class="fas fa-medal medal-gold"></i>';
        case 2: return '<i class="fas fa-medal medal-silver"></i>';
        case 3: return '<i class="fas fa-medal medal-bronze"></i>';
        default: return '';
    }
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

function handleRankingError(err) {
    console.error('Error loading ranking data:', err);
    
    let userMessage = 'Failed to load ranking data';
    
    if (err.name === 'AbortError') {
        userMessage = 'Request cancelled';
    } else if (err.name === 'TimeoutError') {
        userMessage = 'Request timeout - please try again';
    } else if (err.message.includes('Failed to fetch')) {
        userMessage = 'Network error - please check your connection';
    } else if (err.message.includes('HTTP 5')) {
        userMessage = 'Server error - please try again later';
    } else if (err.message.includes('HTTP 4')) {
        userMessage = 'Unable to load rankings - authentication may be required';
    }

    const rankingContainer = document.querySelector('.ranking-container');
    if (rankingContainer) {
        rankingContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Rankings</h3>
                <p>${userMessage}</p>
                <p>Please check if the server is running on ${API_BASE_URL}</p>
                <button onclick="loadRankingData()" class="retry-btn">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
    
    showNotification(userMessage, 'danger');
}

function showNotification(message, type) {
    // Remove existing notifications safely
    const existingNotifications = document.querySelectorAll('.student-rank-notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.remove();
        }
    });

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
}

function addRankStyles() {
    if (document.querySelector('#rank-styles')) return;
    
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
            display: inline-block;
            min-width: 40px;
            text-align: center;
        }
        .grade-a-plus { background: #4caf50; color: white; }
        .grade-a { background: #8bc34a; color: white; }
        .grade-b { background: #ffc107; color: black; }
        .grade-c { background: #ff9800; color: white; }
        .grade-d { background: #f44336; color: white; }
        .grade-f { background: #d32f2f; color: white; }
        .grade-n-a { background: #9e9e9e; color: white; }
        
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
            line-height: 1.5;
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
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-2px);
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
        
        .no-results-message {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 20px 0;
        }
        .no-results-message i {
            font-size: 3em;
            margin-bottom: 15px;
            opacity: 0.5;
        }
        .no-results-message h4 {
            margin-bottom: 10px;
            color: #495057;
        }
    `;
    document.head.appendChild(style);
}

// Network status monitoring
window.addEventListener('online', function() {
    console.log('Network connection restored');
    showNotification('Network connection restored', 'success');
    // Auto-retry loading data when connection is restored
    if (!isRefreshing) {
        setTimeout(() => loadRankingData(), 2000);
    }
});

window.addEventListener('offline', function() {
    console.log('Network connection lost');
    showNotification('Network connection lost - some features may not work', 'warning');
});

// Auto-refresh rankings every 60 seconds with safety checks
setInterval(() => {
    if (!isRefreshing && navigator.onLine) {
        console.log('Auto-refreshing rankings...');
        loadRankingData();
    }
}, 60000);

// Add AbortSignal timeout polyfill for older browsers
if (!AbortSignal.timeout) {
    AbortSignal.timeout = function(ms) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    };
}
