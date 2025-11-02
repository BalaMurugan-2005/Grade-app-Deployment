document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');
    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');

    // Sidebar toggle
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('sidebar-open');
        const icon = hamburger.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // Profile dropdown toggle
    profile.addEventListener('click', () => profileDropdown.classList.toggle('active'));
    document.addEventListener('click', (e) => {
        if (!profile.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // Search filter
    searchInput.addEventListener('input', function() {
        const term = this.value.toLowerCase();
        document.querySelectorAll('.rank-row').forEach(row => {
            const name = row.querySelector('.student-name').textContent.toLowerCase();
            const roll = row.querySelector('.student-roll').textContent.toLowerCase();
            row.style.display = name.includes(term) || roll.includes(term) ? '' : 'none';
        });
    });

    // Refresh
    refreshBtn.addEventListener('click', async function() {
        const old = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
        await loadRankingData();
        refreshBtn.innerHTML = old;
        refreshBtn.disabled = false;
        alert('✅ Rankings updated!');
    });

    // Dashboard redirect
    dashboardBtn.addEventListener('click', () => {
        window.location.href = 'Student_DashBoard.html';
    });

    // Fetch ranking data from backend
    async function loadRankingData() {
        try {
            const res = await fetch('http://localhost:5001/api/rankings');
            if (!res.ok) throw new Error('Failed to load rankings');
            const data = await res.json();

            const yourId = data.stats.yourId;
            const rankings = data.rankings;

            // Find student's data
            const yourData = rankings.find(s => s.rollNo === yourId);
            const yourRank = yourData ? yourData.rank : '-';

            // Display stats
            document.getElementById('totalStudents').textContent = data.stats.totalStudents;
            document.getElementById('yourRank').textContent = yourRank;
            document.getElementById('yourPercentage').textContent = yourData ? yourData.percentage + '%' : '-';
            document.getElementById('yourGrade').textContent = yourData ? yourData.grade : '-';

            // Display table
            const tbody = document.querySelector('.ranking-table tbody');
            tbody.innerHTML = rankings.map(r => `
                <tr class="rank-row ${r.rollNo === yourId ? 'highlight' : ''}">
                    <td>${r.rank}</td>
                    <td class="student-name">${r.name}</td>
                    <td class="student-roll">${r.rollNo}</td>
                    <td>${r.totalMarks}</td>
                    <td>${r.percentage}%</td>
                    <td>${r.grade}</td>
                </tr>
            `).join('');

        } catch (err) {
            console.error(err);
            document.querySelector('.ranking-container').innerHTML =
                `<p style="color:red;">⚠️ Error fetching ranking data. Check your backend.</p>`;
        }
    }

    loadRankingData();
});
