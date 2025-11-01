document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');

    // ✅ Sidebar toggle
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

    // ✅ Profile dropdown toggle
    profile.addEventListener('click', function() {
        profileDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!profile.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // Close sidebar on mobile when clicking link
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

    // ✅ Fetch teacher data from backend
    async function loadTeacherData() {
        try {
            // Replace with the ID of the logged-in teacher
            const teacherId = "TCH-7284";

            const response = await fetch(`http://localhost:5001/api/teacher/${teacherId}`);
            if (!response.ok) throw new Error('Failed to fetch teacher data');

            const teacher = await response.json();

            // ✅ Display teacher details in dashboard
            document.querySelector('.teacher-details').innerHTML = `
                <div class="detail-item">
                    <span class="detail-label">Teacher Name:</span>
                    <span class="detail-value">${teacher.name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Teacher ID:</span>
                    <span class="detail-value">${teacher.id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Subject:</span>
                    <span class="detail-value">${teacher.subject}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${teacher.email}</span>
                </div>
            `;
        } catch (error) {
            console.error(error);
            document.querySelector('.teacher-details').innerHTML =
                `<p style="color:red;">⚠️ Unable to load teacher data. Please check backend.</p>`;
        }
    }

    // Load teacher data when page opens
    loadTeacherData();
});
