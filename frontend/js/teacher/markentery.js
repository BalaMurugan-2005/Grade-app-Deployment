const studentsData = [
            { id: 1, name: "Rahul Kumar", rollNo: "S001", class: "10A", marks: { tamil: 85, english: 78, maths: 92, science: 88, social: 80 } },
            { id: 2, name: "Priya Sharma", rollNo: "S002", class: "10A", marks: { tamil: 90, english: 85, maths: 95, science: 92, social: 88 } },
            { id: 3, name: "Amit Patel", rollNo: "S003", class: "10A", marks: null },
            { id: 4, name: "Sneha Reddy", rollNo: "S004", class: "10A", marks: null },
            { id: 5, name: "Vikram Singh", rollNo: "S005", class: "10A", marks: { tamil: 75, english: 82, maths: 78, science: 80, social: 85 } },
            { id: 6, name: "Anjali Gupta", rollNo: "S006", class: "10A", marks: null },
            { id: 7, name: "Rajesh Kumar", rollNo: "S007", class: "10A", marks: { tamil: 88, english: 90, maths: 85, science: 87, social: 82 } },
            { id: 8, name: "Pooja Mehta", rollNo: "S008", class: "10A", marks: null },
            { id: 9, name: "Sanjay Verma", rollNo: "S009", class: "10A", marks: { tamil: 82, english: 78, maths: 85, science: 80, social: 79 } },
            { id: 10, name: "Neha Singh", rollNo: "S010", class: "10A", marks: null }
        ];

        // DOM Elements
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const profile = document.getElementById('profile');
        const profileDropdown = document.getElementById('profileDropdown');
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        const studentsContainer = document.getElementById('studentsContainer');
        const selectedStudentCard = document.getElementById('selectedStudentCard');
        const selectedStudentName = document.getElementById('selectedStudentName');
        const selectedStudentFullName = document.getElementById('selectedStudentFullName');
        const selectedStudentRoll = document.getElementById('selectedStudentRoll');
        const selectedStudentClass = document.getElementById('selectedStudentClass');
        const selectedStudentAvatar = document.getElementById('selectedStudentAvatar');
        const marksForm = document.getElementById('marksForm');
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceStatus = document.getElementById('voiceStatus');
        const clearBtn = document.getElementById('clearBtn');
        const verifyBtn = document.getElementById('verifyBtn');
        const publishBtn = document.getElementById('publishBtn');
        const verificationResults = document.getElementById('verificationResults');
        const verificationDetails = document.getElementById('verificationDetails');
        const alertContainer = document.getElementById('alertContainer');

        // Current selected student and voice recognition state
        let selectedStudent = null;
        let recognition = null;
        let currentVoiceFieldIndex = 0;
        const subjectFields = ['tamil', 'english', 'maths', 'science', 'social'];

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
        });

        function initializeApp() {
            // Setup navigation
            setupNavigation();
            
            // Load student data
            loadStudents();
            
            // Setup tabs
            setupTabs();
            
            // Setup form handlers
            setupFormHandlers();
            
            // Setup voice recognition
            setupVoiceRecognition();
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

        function setupTabs() {
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-tab');
                    
                    // Update active tab
                    tabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show corresponding content
                    tabContents.forEach(content => {
                        content.classList.remove('active');
                        if (content.id === tabId) {
                            content.classList.add('active');
                        }
                    });
                });
            });
        }

        function loadStudents() {
            studentsContainer.innerHTML = '';
            
            // Separate marked and unmarked students
            const markedStudents = studentsData.filter(student => student.marks !== null);
            const unmarkedStudents = studentsData.filter(student => student.marks === null);
            
            // Display unmarked students section first
            if (unmarkedStudents.length > 0) {
                const unmarkedSection = createStudentSection('unmarked', 'Unmarked Students', unmarkedStudents, 'exclamation-triangle', 'warning');
                studentsContainer.appendChild(unmarkedSection);
            }
            
            // Display marked students section
            if (markedStudents.length > 0) {
                const markedSection = createStudentSection('marked', 'Marked Students', markedStudents, 'check-circle', 'success');
                studentsContainer.appendChild(markedSection);
            }
            
            // If no students found
            if (studentsData.length === 0) {
                studentsContainer.innerHTML = `
                    <div class="student-section">
                        <div class="section-header">
                            <i class="fas fa-users"></i>
                            <div class="section-title">No Students Found</div>
                        </div>
                        <p style="color: var(--light-text); text-align: center; padding: 20px;">
                            No students are available for marks entry.
                        </p>
                    </div>
                `;
            }
        }

        function createStudentSection(type, title, students, icon, color) {
            const section = document.createElement('div');
            section.className = 'student-section';
            
            section.innerHTML = `
                <div class="section-header ${type}-header">
                    <i class="fas fa-${icon}"></i>
                    <div class="section-title">${title}</div>
                    <div class="student-count ${type}-count">${students.length} Students</div>
                </div>
                <div class="student-list" id="${type}-students">
                    ${students.map(student => createStudentCard(student, type === 'marked')).join('')}
                </div>
            `;
            
            return section;
        }

        function createStudentCard(student, isMarked) {
            return `
                <div class="student-card" data-id="${student.id}">
                    <div class="student-avatar">${student.name.charAt(0)}</div>
                    <div class="student-info">
                        <div class="student-name">${student.name}</div>
                        <div class="student-details">
                            Roll No: ${student.rollNo} | Class: ${student.class}
                        </div>
                    </div>
                    <div class="student-status ${isMarked ? 'status-marked' : 'status-unmarked'}">
                        ${isMarked ? 'Marked' : 'Unmarked'}
                    </div>
                </div>
            `;
        }

        function setupFormHandlers() {
            // Form submission
            marksForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                if (!selectedStudent) {
                    showAlert('Please select a student first', 'danger');
                    return;
                }
                
                // Get form data
                const formData = new FormData(marksForm);
                const marks = {
                    tamil: parseInt(formData.get('tamil')) || 0,
                    english: parseInt(formData.get('english')) || 0,
                    maths: parseInt(formData.get('maths')) || 0,
                    science: parseInt(formData.get('science')) || 0,
                    social: parseInt(formData.get('social')) || 0
                };
                
                // Validate marks
                if (Object.values(marks).some(mark => mark < 0 || mark > 100)) {
                    showAlert('Please enter valid marks between 0 and 100', 'danger');
                    return;
                }
                
                // Update student data
                selectedStudent.marks = marks;
                
                // In a real app, you would save to the backend here
                console.log('Saving marks for student:', selectedStudent.name, marks);
                
                showAlert(`Marks saved successfully for ${selectedStudent.name}`, 'success');
                
                // Reload student list to update status
                loadStudents();
                
                // Reset voice field index
                currentVoiceFieldIndex = 0;
                
                // Re-attach event listeners to student cards
                attachStudentCardListeners();
            });
            
            // Clear form
            clearBtn.addEventListener('click', function() {
                marksForm.reset();
                currentVoiceFieldIndex = 0;
                removeAllHighlights();
                showAlert('Form cleared', 'success');
            });
            
            // Verify marks
            verifyBtn.addEventListener('click', function() {
                verifyAllMarks();
            });
            
            // Publish results
            publishBtn.addEventListener('click', function() {
                publishResults();
            });
            
            // Attach event listeners to student cards
            attachStudentCardListeners();
        }

        function attachStudentCardListeners() {
            // Attach click event to all student cards
            const studentCards = document.querySelectorAll('.student-card');
            studentCards.forEach(card => {
                card.addEventListener('click', function() {
                    const studentId = parseInt(this.getAttribute('data-id'));
                    const student = studentsData.find(s => s.id === studentId);
                    if (student) {
                        selectStudent(student);
                    }
                });
            });
        }

        function selectStudent(student) {
            selectedStudent = student;
            
            // Update UI with selected student info
            selectedStudentName.textContent = student.name;
            selectedStudentFullName.textContent = student.name;
            selectedStudentRoll.textContent = student.rollNo;
            selectedStudentClass.textContent = student.class;
            selectedStudentAvatar.textContent = student.name.charAt(0);
            
            // Show the selected student card
            selectedStudentCard.style.display = 'block';
            
            // Scroll to the form
            selectedStudentCard.scrollIntoView({ behavior: 'smooth' });
            
            // Reset voice field index
            currentVoiceFieldIndex = 0;
            
            // If student has marks, populate the form
            if (student.marks) {
                document.getElementById('tamil').value = student.marks.tamil;
                document.getElementById('english').value = student.marks.english;
                document.getElementById('maths').value = student.marks.maths;
                document.getElementById('science').value = student.marks.science;
                document.getElementById('social').value = student.marks.social;
            } else {
                // Clear the form
                marksForm.reset();
            }
            
            showAlert(`Selected student: ${student.name}`, 'success');
        }

        function setupVoiceRecognition() {
            // Check if browser supports speech recognition
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                voiceBtn.disabled = true;
                voiceStatus.textContent = 'Voice recognition not supported in this browser';
                return;
            }
            
            // Create speech recognition object
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            // Voice button click handler
            voiceBtn.addEventListener('click', function() {
                if (voiceBtn.classList.contains('recording')) {
                    stopVoiceRecognition();
                } else {
                    startVoiceRecognition();
                }
            });
            
            // Speech recognition event handlers
            recognition.onstart = function() {
                voiceBtn.classList.add('recording');
                voiceBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
                voiceStatus.textContent = 'Listening... Speak now';
                voiceStatus.classList.add('recording');
                
                // Highlight the current field
                highlightCurrentField();
            };
            
            recognition.onend = function() {
                stopVoiceRecognition();
            };
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript.toLowerCase();
                processVoiceInput(transcript);
            };
            
            recognition.onerror = function(event) {
                console.error('Speech recognition error', event.error);
                showAlert(`Voice recognition error: ${event.error}`, 'danger');
                stopVoiceRecognition();
            };
        }

        function startVoiceRecognition() {
            if (!selectedStudent) {
                showAlert('Please select a student first', 'danger');
                return;
            }
            
            try {
                recognition.start();
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                showAlert('Error starting voice recognition', 'danger');
            }
        }

        function stopVoiceRecognition() {
            try {
                recognition.stop();
            } catch (error) {
                // Ignore errors when stopping
            }
            
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Entry';
            voiceStatus.textContent = 'Click the microphone to enter marks by voice';
            voiceStatus.classList.remove('recording');
            
            // Remove highlights
            removeAllHighlights();
        }

        function highlightCurrentField() {
            // Remove all highlights first
            removeAllHighlights();
            
            // Highlight the current field
            if (currentVoiceFieldIndex < subjectFields.length) {
                const currentField = document.getElementById(subjectFields[currentVoiceFieldIndex]);
                if (currentField) {
                    currentField.classList.add('active');
                    currentField.focus();
                    
                    // Update voice status to show which field we're expecting
                    const subjectNames = {
                        'tamil': 'Tamil',
                        'english': 'English', 
                        'maths': 'Mathematics',
                        'science': 'Science',
                        'social': 'Social Science'
                    };
                    
                    voiceStatus.textContent = `Listening for ${subjectNames[subjectFields[currentVoiceFieldIndex]]} marks...`;
                }
            }
        }

        function removeAllHighlights() {
            subjectFields.forEach(field => {
                const inputField = document.getElementById(field);
                if (inputField) {
                    inputField.classList.remove('active');
                }
            });
        }

        function processVoiceInput(transcript) {
            showAlert(`Voice input: "${transcript}"`, 'success');
            
            // Parse the voice input for subject and marks
            const words = transcript.toLowerCase().split(' ');
            let detectedSubject = null;
            let detectedMark = null;
            
            // Look for subject keywords
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                
                // Check if this word matches any subject
                if (word.includes('tamil')) {
                    detectedSubject = 'tamil';
                } else if (word.includes('english')) {
                    detectedSubject = 'english';
                } else if (word.includes('math') || word.includes('mathematics')) {
                    detectedSubject = 'maths';
                } else if (word.includes('science')) {
                    detectedSubject = 'science';
                } else if (word.includes('social')) {
                    detectedSubject = 'social';
                }
                
                // Check for numbers
                if (!isNaN(parseInt(word)) && !detectedMark) {
                    detectedMark = parseInt(word);
                }
            }
            
            // If we found both subject and mark, process them
            if (detectedSubject && detectedMark !== null) {
                // Find the index of the detected subject
                const subjectIndex = subjectFields.indexOf(detectedSubject);
                
                if (subjectIndex !== -1) {
                    // Fill the field
                    const inputField = document.getElementById(detectedSubject);
                    if (inputField) {
                        inputField.value = detectedMark;
                        
                        // Move to next field
                        currentVoiceFieldIndex = subjectIndex + 1;
                        
                        // If we've filled all fields, submit the form
                        if (currentVoiceFieldIndex >= subjectFields.length) {
                            showAlert('All marks entered! Saving...', 'success');
                            setTimeout(() => {
                                marksForm.dispatchEvent(new Event('submit'));
                            }, 1000);
                        } else {
                            // Continue with next field
                            setTimeout(() => {
                                highlightCurrentField();
                                startVoiceRecognition();
                            }, 1000);
                        }
                    }
                }
            } else {
                // If we didn't detect both subject and mark, try to use current field
                if (currentVoiceFieldIndex < subjectFields.length) {
                    // Look for any number in the transcript
                    for (let i = 0; i < words.length; i++) {
                        if (!isNaN(parseInt(words[i]))) {
                            const mark = parseInt(words[i]);
                            const currentField = document.getElementById(subjectFields[currentVoiceFieldIndex]);
                            if (currentField) {
                                currentField.value = mark;
                                
                                // Move to next field
                                currentVoiceFieldIndex++;
                                
                                // If we've filled all fields, submit the form
                                if (currentVoiceFieldIndex >= subjectFields.length) {
                                    showAlert('All marks entered! Saving...', 'success');
                                    setTimeout(() => {
                                        marksForm.dispatchEvent(new Event('submit'));
                                    }, 1000);
                                } else {
                                    // Continue with next field
                                    setTimeout(() => {
                                        highlightCurrentField();
                                        startVoiceRecognition();
                                    }, 1000);
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }

        function verifyAllMarks() {
            const unmarkedStudents = studentsData.filter(student => !student.marks);
            
            if (unmarkedStudents.length > 0) {
                verificationDetails.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Verification Failed:</strong> ${unmarkedStudents.length} students still need marks entry.
                    </div>
                    <p>The following students are missing marks:</p>
                    <ul>
                        ${unmarkedStudents.map(student => `<li>${student.name} (${student.rollNo})</li>`).join('')}
                    </ul>
                `;
                publishBtn.disabled = true;
            } else {
                verificationDetails.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i>
                        <strong>Verification Successful:</strong> All students have marks entered.
                    </div>
                    <p>You can now publish the results.</p>
                `;
                publishBtn.disabled = false;
            }
            
            verificationResults.style.display = 'block';
            verificationResults.scrollIntoView({ behavior: 'smooth' });
        }

        function publishResults() {
            // In a real app, this would send data to the backend
            console.log('Publishing results:', studentsData);
            
            // Simulate API call
            setTimeout(() => {
                showAlert('Results published successfully!', 'success');
                
                // Reset publish button
                publishBtn.disabled = true;
                verificationResults.style.display = 'none';
                
                // In a real app, you would redirect or show a success page
            }, 1500);
        }

        function showAlert(message, type) {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                ${message}
            `;
            
            alertContainer.appendChild(alert);
            
            // Remove alert after 5 seconds
            setTimeout(() => {
                alert.remove();
            }, 5000);
        }