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
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    loadRankings();
    setupEventListeners();
}

function setupNavigation() {
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
    
    profile.addEventListener('click', function() {
        profileDropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', function(event) {
        if (!profile.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('active');
        }
    });
    
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
                mainContent.classList.remove('sidebar-open');
                hamburger.querySelector('i').classList.remove('fa-times');
                hamburger.querySelector('i').classList.add('fa-bars');
            }
        });
    });
}

async function loadRankings() {
    try {
        // Load rankings from API - BOTH use same /api/rankings endpoint
        const [rankingsResponse, statsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/rankings`),
            fetch(`${API_BASE_URL}/api/statistics`)
        ]);

        if (!rankingsResponse.ok || !statsResponse.ok) {
            throw new Error('Failed to load data');
        }

        const rankData = await rankingsResponse.json();
        const statistics = await statsResponse.json();

        // Extract rankings array from the response
        rankingsData = rankData.rankings;

        // Update stats
        updateStats(statistics);
        
        // Display rankings
        displayRankings(rankingsData);
        
    } catch (error) {
        console.error('Error loading rankings:', error);
        showNotification('Failed to load rankings data', 'danger');
        
        // Fallback: Use demo data if API fails
        loadDemoRankings();
    }
}

function updateStats(statistics) {
    totalStudents.textContent = statistics.totalStudents;
    classAverage.textContent = `${statistics.classAverage}%`;
    topScore.textContent = statistics.topScore;
    passPercentage.textContent = `${statistics.passPercentage}%`;
}

function updateDemoStats(students) {
    // Total students
    totalStudents.textContent = students.length;
    
    // Class average
    const classAvg = students.reduce((sum, student) => sum + student.percentage, 0) / students.length;
    classAverage.textContent = `${Math.round(classAvg)}%`;
    
    // Top score
    const topStudent = students[0];
    topScore.textContent = topStudent ? topStudent.totalMarks : '0';
    
    // Pass percentage (assuming 40% is passing)
    const passedStudents = students.filter(student => student.percentage >= 40);
    const passPercent = (passedStudents.length / students.length) * 100;
    passPercentage.textContent = `${Math.round(passPercent)}%`;
}

function displayRankings(students) {
    rankingBody.innerHTML = '';
    
    if (students.length === 0) {
        rankingBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-trophy"></i>
                        <h3>No Results Found</h3>
                        <p>No student rankings available for display.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    students.forEach((student) => {
        const row = document.createElement('tr');
        
        // Add medal for top 3 ranks
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
                    <div class="avatar">${student.name.charAt(0)}</div>
                    <div class="student-details">
                        <div class="student-name">${student.name}</div>
                        <div class="student-roll">${student.rollNo}</div>
                    </div>
                </div>
            </td>
            <td class="marks-cell">${student.totalMarks}/500</td>
            <td class="average-cell">${student.percentage}%</td>
            <td><span class="grade-badge ${getGradeClass(student.grade)}">${student.grade}</span></td>
        `;
        
        rankingBody.appendChild(row);
    });
}

function getGradeClass(grade) {
    switch(grade) {
        case 'A+': return 'grade-a-plus';
        case 'A': return 'grade-a';
        case 'B': return 'grade-b';
        case 'C': return 'grade-c';
        case 'D': return 'grade-d';
        case 'F': return 'grade-f';
        default: return 'grade-c';
    }
}

function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', function() {
        filterRankings(this.value);
    });
    
    // Refresh button
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
    
    // Export button
    exportBtn.addEventListener('click', function() {
        exportToCSV();
    });
}

function filterRankings(searchTerm) {
    if (!searchTerm) {
        // If search is empty, show all rankings
        displayRankings(rankingsData);
        return;
    }
    
    const filteredStudents = rankingsData.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    displayRankings(filteredStudents);
}

async function exportToCSV() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/export/rankings`);
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'class_rankings.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showNotification('Rankings exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export rankings. Using client-side export.', 'warning');
        
        // Fallback: Client-side export
        exportToCSVClientSide();
    }
}

function exportToCSVClientSide() {
    // Create CSV content from current rankings data
    let csvContent = "Rank,Student Name,Roll No,Total Marks,Percentage,Grade\n";
    
    rankingsData.forEach((student) => {
        const row = [
            student.rank,
            `"${student.name}"`,
            student.rollNo,
            student.totalMarks,
            student.percentage,
            student.grade
        ];
        csvContent += row.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'class_rankings.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification('Rankings exported successfully!', 'success');
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        z-index: 10000;
        max-width: 300px;
        padding: 15px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    } else if (type === 'danger') {
        notification.style.backgroundColor = '#dc3545';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#ffc107';
        notification.style.color = '#212529';
    }
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}