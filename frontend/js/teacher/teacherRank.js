const publishedResults = [
            { id: 1, name: "Rahul Kumar", rollNo: "S001", class: "10A", marks: { tamil: 85, english: 78, maths: 92, science: 88, social: 80 } },
            { id: 2, name: "Priya Sharma", rollNo: "S002", class: "10A", marks: { tamil: 90, english: 85, maths: 95, science: 92, social: 88 } },
            { id: 3, name: "Amit Patel", rollNo: "S003", class: "10A", marks: { tamil: 78, english: 82, maths: 88, science: 85, social: 79 } },
            { id: 4, name: "Sneha Reddy", rollNo: "S004", class: "10A", marks: { tamil: 92, english: 88, maths: 94, science: 90, social: 86 } },
            { id: 5, name: "Vikram Singh", rollNo: "S005", class: "10A", marks: { tamil: 75, english: 82, maths: 78, science: 80, social: 85 } },
            { id: 6, name: "Anjali Gupta", rollNo: "S006", class: "10A", marks: { tamil: 88, english: 90, maths: 85, science: 87, social: 82 } },
            { id: 7, name: "Rajesh Kumar", rollNo: "S007", class: "10A", marks: { tamil: 82, english: 85, maths: 90, science: 88, social: 84 } },
            { id: 8, name: "Pooja Mehta", rollNo: "S008", class: "10A", marks: { tamil: 79, english: 81, maths: 76, science: 78, social: 80 } },
            { id: 9, name: "Sanjay Verma", rollNo: "S009", class: "10A", marks: { tamil: 82, english: 78, maths: 85, science: 80, social: 79 } },
            { id: 10, name: "Neha Singh", rollNo: "S010", class: "10A", marks: { tamil: 95, english: 92, maths: 98, science: 96, social: 94 } }
        ];

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

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
        });

        function initializeApp() {
            // Setup navigation
            setupNavigation();
            
            // Load and display rankings
            loadRankings();
            
            // Setup event listeners
            setupEventListeners();
        }

        function setupNavigation() {
            // Toggle sidebar
            hamburger.addEventListener('click', function() {
                sidebar.classList.toggle('active');
                mainContent.classList.toggle('sidebar-open');
                
                // Change hamburger icon
                const icon = hamburger.querySelector('i');
                if (sidebar.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
            
            // Toggle profile dropdown
            profile.addEventListener('click', function() {
                profileDropdown.classList.toggle('active');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(event) {
                if (!profile.contains(event.target) && !profileDropdown.contains(event.target)) {
                    profileDropdown.classList.remove('active');
                }
            });
            
            // Close sidebar when clicking on a link (for mobile)
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

        function setupEventListeners() {
            // Search functionality
            searchInput.addEventListener('input', function() {
                filterRankings(this.value);
            });
            
            // Refresh button
            refreshBtn.addEventListener('click', function() {
                // Add loading animation
                const originalText = refreshBtn.innerHTML;
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
                refreshBtn.disabled = true;
                
                // Simulate API call
                setTimeout(() => {
                    loadRankings();
                    refreshBtn.innerHTML = originalText;
                    refreshBtn.disabled = false;
                    showNotification('Rankings updated successfully!', 'success');
                }, 1000);
            });
            
            // Export button
            exportBtn.addEventListener('click', function() {
                exportToCSV();
            });
        }

        function loadRankings() {
            // Process student data
            const processedStudents = publishedResults.map(student => {
                const marks = student.marks;
                const total = Object.values(marks).reduce((sum, mark) => sum + mark, 0);
                const average = (total / (Object.keys(marks).length * 100)) * 100;
                const grade = calculateGrade(average);
                
                return {
                    ...student,
                    total,
                    average: Math.round(average * 10) / 10, // Round to 1 decimal
                    grade
                };
            });
            
            // Sort by total marks (descending)
            processedStudents.sort((a, b) => b.total - a.total);
            
            // Update stats
            updateStats(processedStudents);
            
            // Display rankings
            displayRankings(processedStudents);
        }

        function calculateGrade(average) {
            if (average >= 90) return 'A+';
            if (average >= 80) return 'A';
            if (average >= 70) return 'B';
            if (average >= 60) return 'C';
            return 'D';
        }

        function getGradeClass(grade) {
            switch(grade) {
                case 'A+': return 'grade-a-plus';
                case 'A': return 'grade-a';
                case 'B': return 'grade-b';
                case 'C': return 'grade-c';
                case 'D': return 'grade-d';
                default: return 'grade-c';
            }
        }

        function updateStats(students) {
            // Total students
            totalStudents.textContent = students.length;
            
            // Class average
            const classAvg = students.reduce((sum, student) => sum + student.average, 0) / students.length;
            classAverage.textContent = `${Math.round(classAvg)}%`;
            
            // Top score
            const topStudent = students[0];
            topScore.textContent = topStudent ? topStudent.total : '0';
            
            // Pass percentage (assuming 40% is passing)
            const passedStudents = students.filter(student => student.average >= 40);
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
            
            students.forEach((student, index) => {
                const rank = index + 1;
                const row = document.createElement('tr');
                
                // Add medal for top 3 ranks
                let rankDisplay = `<span class="rank-cell">${rank}</span>`;
                if (rank === 1) {
                    rankDisplay = `<div class="rank-cell"><i class="fas fa-medal medal medal-gold"></i> ${rank}</div>`;
                } else if (rank === 2) {
                    rankDisplay = `<div class="rank-cell"><i class="fas fa-medal medal medal-silver"></i> ${rank}</div>`;
                } else if (rank === 3) {
                    rankDisplay = `<div class="rank-cell"><i class="fas fa-medal medal medal-bronze"></i> ${rank}</div>`;
                }
                
                row.innerHTML = `
                    <td>${rankDisplay}</td>
                    <td>
                        <div class="student-info">
                            <div class="avatar">${student.name.charAt(0)}</div>
                            <div class="student-details">
                                <div class="student-name">${student.name}</div>
                                <div class="student-roll">${student.rollNo} | ${student.class}</div>
                            </div>
                        </div>
                    </td>
                    <td class="marks-cell">${student.total}/500</td>
                    <td class="average-cell">${student.average}%</td>
                    <td><span class="grade-badge ${getGradeClass(student.grade)}">${student.grade}</span></td>
                `;
                
                rankingBody.appendChild(row);
            });
        }

        function filterRankings(searchTerm) {
            const filteredStudents = publishedResults
                .map(student => {
                    const marks = student.marks;
                    const total = Object.values(marks).reduce((sum, mark) => sum + mark, 0);
                    const average = (total / (Object.keys(marks).length * 100)) * 100;
                    const grade = calculateGrade(average);
                    
                    return {
                        ...student,
                        total,
                        average: Math.round(average * 10) / 10,
                        grade
                    };
                })
                .filter(student => 
                    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .sort((a, b) => b.total - a.total);
            
            displayRankings(filteredStudents);
        }

        function exportToCSV() {
            // Create CSV content
            let csvContent = "Rank,Student Name,Roll No,Class,Tamil,English,Maths,Science,Social,Total,Average,Grade\n";
            
            publishedResults
                .map(student => {
                    const marks = student.marks;
                    const total = Object.values(marks).reduce((sum, mark) => sum + mark, 0);
                    const average = (total / (Object.keys(marks).length * 100)) * 100;
                    const grade = calculateGrade(average);
                    
                    return {
                        ...student,
                        total,
                        average: Math.round(average * 10) / 10,
                        grade
                    };
                })
                .sort((a, b) => b.total - a.total)
                .forEach((student, index) => {
                    const rank = index + 1;
                    const row = [
                        rank,
                        `"${student.name}"`,
                        student.rollNo,
                        student.class,
                        student.marks.tamil,
                        student.marks.english,
                        student.marks.maths,
                        student.marks.science,
                        student.marks.social,
                        student.total,
                        student.average,
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
            `;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                ${message}
            `;
            
            document.body.appendChild(notification);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }