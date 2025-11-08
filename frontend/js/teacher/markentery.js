// ✅ Use absolute URL for API calls
const API_BASE_URL = 'http://localhost:5001';

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
let studentsData = [];
let selectedStudent = null;
let recognition = null;
let currentVoiceFieldIndex = 0;
const subjectFields = ['tamil', 'english', 'maths', 'science', 'social'];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
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

async function initializeApp() {
    // Setup navigation
    setupNavigation();
    
    // Load student data from API
    await loadStudentsFromAPI();
    
    // Setup tabs
    setupTabs();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Setup voice recognition
    setupVoiceRecognition();
}

// Updated API integration functions
async function loadStudentsFromAPI() {
    try {
        showAlert('Loading student data...', 'info');
        const response = await fetch(`${API_BASE_URL}/api/students`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch students: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle both array format and object with students array
        if (Array.isArray(data)) {
            studentsData = data;
        } else if (data.students && Array.isArray(data.students)) {
            studentsData = data.students;
        } else {
            studentsData = [];
        }
        
        console.log('Loaded students data:', studentsData);
        loadStudents();
        showAlert('Student data loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading students:', error);
        showAlert(`Failed to load student data: ${error.message}`, 'danger');
        studentsData = [];
        loadStudents();
    }
}

async function submitMarksToAPI(studentId, marks) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/student/${studentId}/marks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ marks })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to save marks: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error saving marks:', error);
        throw error;
    }
}

function setupNavigation() {
    // Toggle sidebar
    if (hamburger) {
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
    }
    
    // Toggle profile dropdown
    if (profile) {
        profile.addEventListener('click', function() {
            profileDropdown.classList.toggle('active');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (profile && !profile.contains(event.target) && profileDropdown && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('active');
        }
    });
    
    // Close sidebar when clicking on a link (for mobile)
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Handle logout link separately
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
    if (!studentsContainer) return;
    
    studentsContainer.innerHTML = '';
    
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
        return;
    }
    
    // Separate marked and unmarked students based on isMarked field
    const markedStudents = studentsData.filter(student => student.isMarked === true);
    const unmarkedStudents = studentsData.filter(student => student.isMarked === false || !student.isMarked);
    
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
    
    // Attach event listeners to student cards
    attachStudentCardListeners();
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
    const firstName = student.name ? student.name.split(' ')[0] : 'Unknown';
    const avatarText = student.name ? student.name.charAt(0).toUpperCase() : '?';
    
    return `
        <div class="student-card" data-id="${student.id}">
            <div class="student-avatar">${avatarText}</div>
            <div class="student-info">
                <div class="student-name">${student.name || 'Unknown Student'}</div>
                <div class="student-details">
                    Roll No: ${student.rollNo || 'N/A'} | Class: ${student.class || 'N/A'}${student.section ? ' | Section: ' + student.section : ''}
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
    if (marksForm) {
        marksForm.addEventListener('submit', async function(e) {
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
            
            // Check if all marks are provided
            if (Object.values(marks).some(mark => mark === 0)) {
                if (!confirm('Some marks are 0. Do you want to continue?')) {
                    return;
                }
            }
            
            try {
                showAlert(`Saving marks for ${selectedStudent.name}...`, 'info');
                
                // Save to API using the updated function
                const result = await submitMarksToAPI(selectedStudent.id, marks);
                
                // Update local data
                selectedStudent.marks = marks;
                selectedStudent.isMarked = true;
                selectedStudent.totalMarks = result.student.totalMarks;
                selectedStudent.percentage = result.student.percentage;
                selectedStudent.grade = result.student.grade;
                selectedStudent.status = result.student.status;
                
                showAlert(`Marks saved successfully for ${selectedStudent.name}`, 'success');
                
                // Reload student list to update status
                await loadStudentsFromAPI();
                
                // Reset voice field index
                currentVoiceFieldIndex = 0;
                
                // Re-attach event listeners to student cards
                attachStudentCardListeners();
                
            } catch (error) {
                console.error('Error saving marks:', error);
                showAlert(`Failed to save marks: ${error.message}`, 'danger');
            }
        });
    }
    
    // Clear form
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (marksForm) marksForm.reset();
            currentVoiceFieldIndex = 0;
            removeAllHighlights();
            showAlert('Form cleared', 'success');
        });
    }
    
    // Verify marks
    if (verifyBtn) {
        verifyBtn.addEventListener('click', function() {
            verifyAllMarks();
        });
    }
    
    // Publish results
    if (publishBtn) {
        publishBtn.addEventListener('click', function() {
            publishResults();
        });
    }
    
    // Attach event listeners to student cards
    attachStudentCardListeners();
}

function attachStudentCardListeners() {
    // Attach click event to all student cards
    const studentCards = document.querySelectorAll('.student-card');
    studentCards.forEach(card => {
        card.addEventListener('click', function() {
            const studentId = this.getAttribute('data-id');
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
    if (selectedStudentName) selectedStudentName.textContent = student.name;
    if (selectedStudentFullName) selectedStudentFullName.textContent = student.name;
    if (selectedStudentRoll) selectedStudentRoll.textContent = student.rollNo || 'N/A';
    if (selectedStudentClass) selectedStudentClass.textContent = student.class || 'N/A';
    if (selectedStudentAvatar) {
        selectedStudentAvatar.textContent = student.name ? student.name.charAt(0).toUpperCase() : 'S';
    }
    
    // Show the selected student card
    if (selectedStudentCard) {
        selectedStudentCard.style.display = 'block';
        
        // Scroll to the form
        selectedStudentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Reset voice field index
    currentVoiceFieldIndex = 0;
    
    // If student has marks, populate the form
    if (student.marks) {
        if (document.getElementById('tamil')) document.getElementById('tamil').value = student.marks.tamil || '';
        if (document.getElementById('english')) document.getElementById('english').value = student.marks.english || '';
        if (document.getElementById('maths')) document.getElementById('maths').value = student.marks.maths || '';
        if (document.getElementById('science')) document.getElementById('science').value = student.marks.science || '';
        if (document.getElementById('social')) document.getElementById('social').value = student.marks.social || '';
    } else {
        // Clear the form
        if (marksForm) marksForm.reset();
    }
    
    showAlert(`Selected student: ${student.name}`, 'success');
}

function setupVoiceRecognition() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        if (voiceBtn) voiceBtn.disabled = true;
        if (voiceStatus) voiceStatus.textContent = 'Voice recognition not supported in this browser';
        return;
    }
    
    // Create speech recognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    // Voice button click handler
    if (voiceBtn) {
        voiceBtn.addEventListener('click', function() {
            if (voiceBtn.classList.contains('recording')) {
                stopVoiceRecognition();
            } else {
                startVoiceRecognition();
            }
        });
    }
    
    // Speech recognition event handlers
    recognition.onstart = function() {
        if (voiceBtn) {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
        }
        if (voiceStatus) {
            voiceStatus.textContent = 'Listening... Speak now';
            voiceStatus.classList.add('recording');
        }
        
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
    
    if (voiceBtn) {
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Entry';
    }
    if (voiceStatus) {
        voiceStatus.textContent = 'Click the microphone to enter marks by voice';
        voiceStatus.classList.remove('recording');
    }
    
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
            
            if (voiceStatus) {
                voiceStatus.textContent = `Listening for ${subjectNames[subjectFields[currentVoiceFieldIndex]]} marks...`;
            }
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
    showAlert(`Voice input: "${transcript}"`, 'info');
    
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
                        if (marksForm) {
                            marksForm.dispatchEvent(new Event('submit'));
                        }
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
                                if (marksForm) {
                                    marksForm.dispatchEvent(new Event('submit'));
                                }
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
    const unmarkedStudents = studentsData.filter(student => !student.isMarked || student.isMarked === false);
    
    if (unmarkedStudents.length > 0) {
        if (verificationDetails) {
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
        }
        if (publishBtn) publishBtn.disabled = true;
    } else {
        if (verificationDetails) {
            verificationDetails.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    <strong>Verification Successful:</strong> All students have marks entered.
                </div>
                <p>You can now publish the results.</p>
            `;
        }
        if (publishBtn) publishBtn.disabled = false;
    }
    
    if (verificationResults) {
        verificationResults.style.display = 'block';
        verificationResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function publishResults() {
    // In a real app, this would send data to the backend
    console.log('Publishing results:', studentsData);
    
    showAlert('Publishing results...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        showAlert('Results published successfully! All students can now view their marks and rankings.', 'success');
        
        // Reset publish button
        if (publishBtn) publishBtn.disabled = true;
        if (verificationResults) verificationResults.style.display = 'none';
        
    }, 2000);
}

function showAlert(message, type) {
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        padding: 12px 16px;
        margin: 10px 0;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set colors based on type
    const colors = {
        success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
        danger: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
        info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' },
        warning: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' }
    };
    
    const color = colors[type] || colors.info;
    alert.style.backgroundColor = color.bg;
    alert.style.color = color.text;
    alert.style.border = `1px solid ${color.border}`;
    
    const iconClass = {
        success: 'fa-check-circle',
        danger: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-circle'
    }[type] || 'fa-info-circle';
    
    alert.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    alertContainer.appendChild(alert);
    
    // Add animation style if not exists
    if (!document.querySelector('#alert-animations')) {
        const style = document.createElement('style');
        style.id = 'alert-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateY(-10px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Add network status monitoring
window.addEventListener('online', function() {
    console.log('Network connection restored');
    showAlert('Network connection restored', 'success');
});

window.addEventListener('offline', function() {
    console.log('Network connection lost');
    showAlert('Network connection lost. Some features may not work.', 'warning');
});
