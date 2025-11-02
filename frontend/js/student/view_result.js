document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const profile = document.getElementById('profile');
    const profileDropdown = document.getElementById('profileDropdown');

    // Toggle sidebar
    hamburger.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('sidebar-open');

        const icon = hamburger.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // Profile dropdown
    profile.addEventListener('click', function() {
        profileDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!profile.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // Close sidebar on small screen when link clicked
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
                mainContent.classList.remove('sidebar-open');
                hamburger.querySelector('i').classList.replace('fa-times', 'fa-bars');
            }
        });
    });

    // -------------------------------
    // 📊 FETCH AND DISPLAY RESULT DATA (From Backend)
    // -------------------------------
    async function loadResultData() {
        try {
            const studentId = "S20230045"; // Later from login/session
            const response = await fetch(`http://localhost:5001/api/result/${studentId}`);

            if (!response.ok) throw new Error('Failed to fetch result data');
            const data = await response.json();

            displayStudentInfo(data.student);
            displaySubjects(data.subjects);
            displaySummary(data.summary);

            console.log("✅ Result data loaded successfully:", data);
        } catch (error) {
            console.error("❌ Error loading result data:", error);
            document.querySelector('.cards-container .data-placeholder').innerHTML = `
                <p style="color:red;">Error fetching student result. Please check backend connection.</p>`;
        }
    }

    // Display Student Info
    function displayStudentInfo(student) {
        const container = document.querySelector('.cards-container .data-placeholder');
        container.innerHTML = `
            <p><strong>Name:</strong> ${student.name}</p>
            <p><strong>Roll No:</strong> ${student.rollNo}</p>
            <p><strong>Class:</strong> ${student.class}</p>
            <p><strong>Section:</strong> ${student.section}</p>
        `;
    }

    // Display Subjects Table
    function displaySubjects(subjects) {
        const tableContainer = document.querySelector('.table-container .data-placeholder');
        tableContainer.innerHTML = `
            <table class="marks-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${subjects.map(sub => `
                        <tr>
                            <td>${sub.name}</td>
                            <td>${sub.marks}</td>
                            <td>${sub.grade}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Display Summary Cards
    function displaySummary(summary) {
        const summaryCards = document.querySelectorAll('.result-summary .summary-card');
        summaryCards[0].innerHTML = `<p><strong>Total Marks:</strong> ${summary.totalMarks}</p>`;
        summaryCards[1].innerHTML = `<p><strong>Percentage:</strong> ${summary.percentage}%</p>`;
        summaryCards[2].innerHTML = `<p><strong>Grade:</strong> ${summary.grade}</p>`;
        summaryCards[3].innerHTML = `<p><strong>Status:</strong> ${summary.status}</p>`;
    }

    // 🧾 Download Report (future feature)
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.addEventListener('click', function() {
        alert('Download feature coming soon!');
    });

    // Load Data
    loadResultData();
});
