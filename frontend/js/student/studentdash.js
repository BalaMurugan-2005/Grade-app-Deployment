document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');

    // Sidebar toggle
    hamburger.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('sidebar-open');

        const icon = hamburger.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // Profile dropdown toggle
    profile.addEventListener('click', function() {
        profileDropdown.classList.toggle('active');
    });

    // Close profile dropdown if clicked outside
    document.addEventListener('click', function(event) {
        if (!profile.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // Sidebar close on link click (for mobile)
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
                mainContent.classList.remove('sidebar-open');
                hamburger.querySelector('i').classList.replace('fa-times', 'fa-bars');
            }
        });
    });

    // ✅ Fetch student data from backend API
    async function loadStudentData() {
        try {
            const studentId = "S20230045"; // Later from login/session
            const response = await fetch(`http://localhost:5000/api/student/${studentId}`);

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

    // Call it when the page loads
    loadStudentData();
});
