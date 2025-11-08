const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Serve static files from frontend with explicit paths
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/templates', express.static(path.join(__dirname, '../frontend/templates')));
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password, userType } = req.body;
    
    try {
        let users = [];
        let redirectUrl = '';
        
        if (userType === 'student') {
            const studentData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/student/Student.json'), 'utf8'));
            users = studentData.students || studentData;
            redirectUrl = '/student/dashboard';
        } else {
            const teacherData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/teacher/teacherData.json'), 'utf8'));
            users = teacherData;
            redirectUrl = '/teacher/dashboard';
        }
        
        const user = users.find(u => 
            (u.username === username || u.email === username) && 
            u.password === password
        );
        
        if (user) {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email
                },
                redirectUrl: redirectUrl
            });
        } else {
            res.json({
                success: false,
                message: 'Invalid username or password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Check authentication
app.get('/api/check-auth', (req, res) => {
    const { userType, userId } = req.query;
    
    try {
        let users = [];
        
        if (userType === 'student') {
            const studentData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/student/Student.json'), 'utf8'));
            users = studentData.students || studentData;
        } else {
            const teacherData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/teacher/teacherData.json'), 'utf8'));
            users = teacherData;
        }
        
        const user = users.find(u => u.id === userId);
        
        if (user) {
            res.json({
                authenticated: true,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email
                }
            });
        } else {
            res.json({
                authenticated: false
            });
        }
    } catch (error) {
        console.error('Auth check error:', error);
        res.json({
            authenticated: false
        });
    }
});

// Get student data
app.get('/api/student/:id', (req, res) => {
    try {
        const studentData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/student/Student.json'), 'utf8'));
        const students = studentData.students || studentData;
        const student = students.find(s => s.id === req.params.id);
        
        if (student) {
            res.json(student);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get teacher data
app.get('/api/teacher/:id', (req, res) => {
    try {
        const teacherData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/teacher/teacherData.json'), 'utf8'));
        const teacher = teacherData.find(t => t.id === req.params.id);
        
        if (teacher) {
            res.json(teacher);
        } else {
            res.status(404).json({ error: 'Teacher not found' });
        }
    } catch (error) {
        console.error('Error fetching teacher:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all students (for teacher)
app.get('/api/students', (req, res) => {
    try {
        const studentData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/student/Student.json'), 'utf8'));
        const students = studentData.students || studentData;
        
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get rankings
app.get('/api/rankings', (req, res) => {
    try {
        const studentData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/student/Student.json'), 'utf8'));
        const students = studentData.students || studentData;
        
        // Filter only marked students and sort by rank
        const rankedStudents = students
            .filter(student => student.isMarked && student.rank)
            .sort((a, b) => a.rank - b.rank);
        
        const stats = {
            totalStudents: students.length,
            markedStudents: students.filter(s => s.isMarked).length,
            unmarkedStudents: students.filter(s => !s.isMarked).length
        };
        
        res.json({
            rankings: rankedStudents,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get student result
app.get('/api/result/:id', (req, res) => {
    try {
        const studentData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/student/Student.json'), 'utf8'));
        const students = studentData.students || studentData;
        const student = students.find(s => s.id === req.params.id);
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Prepare result data
        const result = {
            student: {
                name: student.name,
                rollNo: student.rollNo,
                class: student.class,
                section: student.section,
                academicYear: student.academicYear
            },
            subjects: student.marks ? Object.entries(student.marks).map(([subject, marks]) => ({
                name: subject.charAt(0).toUpperCase() + subject.slice(1),
                marks: marks,
                grade: calculateGrade(marks)
            })) : [],
            summary: {
                totalMarks: student.totalMarks || 0,
                percentage: student.percentage || 0,
                grade: student.grade || 'N/A',
                status: student.status || 'Unmarked'
            }
        };
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Student profile
app.get('/api/student/:id/profile', (req, res) => {
    try {
        const studentData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/student/Student.json'), 'utf8'));
        const students = studentData.students || studentData;
        const student = students.find(s => s.id === req.params.id);
        
        if (student) {
            res.json(student);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Teacher profile
app.get('/api/teacher/:id/profile', (req, res) => {
    try {
        const teacherData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/teacher/teacherData.json'), 'utf8'));
        const teacher = teacherData.find(t => t.id === req.params.id);
        
        if (teacher) {
            // Add statistics for teacher profile
            const studentData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/student/Student.json'), 'utf8'));
            const students = studentData.students || studentData;
            
            const statistics = {
                totalStudents: students.length,
                markedStudents: students.filter(s => s.isMarked).length,
                pendingEvaluations: students.filter(s => !s.isMarked).length,
                classAverage: calculateClassAverage(students),
                passPercentage: calculatePassPercentage(students),
                topScore: getTopScore(students)
            };
            
            const teacherWithStats = {
                ...teacher,
                statistics: statistics
            };
            
            res.json(teacherWithStats);
        } else {
            res.status(404).json({ error: 'Teacher not found' });
        }
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save marks
app.post('/api/student/:id/marks', (req, res) => {
    try {
        const { marks } = req.body;
        const studentId = req.params.id;
        
        // Read current student data
        const studentDataPath = path.join(__dirname, 'data/student/Student.json');
        const studentData = JSON.parse(fs.readFileSync(studentDataPath, 'utf8'));
        const students = studentData.students || studentData;
        
        // Find and update student
        const studentIndex = students.findIndex(s => s.id === studentId);
        if (studentIndex === -1) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Calculate totals and grades
        const totalMarks = Object.values(marks).reduce((sum, mark) => sum + (parseInt(mark) || 0), 0);
        const percentage = (totalMarks / 500) * 100;
        const grade = calculateOverallGrade(percentage);
        const status = percentage >= 40 ? 'Pass' : 'Fail';
        
        // Update student
        students[studentIndex] = {
            ...students[studentIndex],
            marks: marks,
            totalMarks: totalMarks,
            percentage: percentage,
            grade: grade,
            status: status,
            isMarked: true
        };
        
        // Save back to file
        if (studentData.students) {
            studentData.students = students;
            fs.writeFileSync(studentDataPath, JSON.stringify(studentData, null, 2));
        } else {
            // If it's directly an array
            fs.writeFileSync(studentDataPath, JSON.stringify(students, null, 2));
        }
        
        res.json({
            success: true,
            student: students[studentIndex]
        });
        
    } catch (error) {
        console.error('Error saving marks:', error);
        res.status(500).json({ error: 'Server error saving marks' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// Helper functions
function calculateGrade(marks) {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    if (marks >= 40) return 'D';
    return 'F';
}

function calculateOverallGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
}

function calculateClassAverage(students) {
    const markedStudents = students.filter(s => s.isMarked && s.percentage);
    if (markedStudents.length === 0) return 0;
    
    const total = markedStudents.reduce((sum, student) => sum + student.percentage, 0);
    return (total / markedStudents.length).toFixed(1);
}

function calculatePassPercentage(students) {
    const markedStudents = students.filter(s => s.isMarked);
    if (markedStudents.length === 0) return 0;
    
    const passedStudents = markedStudents.filter(s => s.status === 'Pass').length;
    return ((passedStudents / markedStudents.length) * 100).toFixed(1);
}

function getTopScore(students) {
    const markedStudents = students.filter(s => s.isMarked && s.totalMarks);
    if (markedStudents.length === 0) return 0;
    
    return Math.max(...markedStudents.map(s => s.totalMarks));
}

// Serve login page as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/login.html'));
});

// Handle specific routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/login.html'));
});

app.get('/student/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/student/Student_DashBoard.html'));
});

app.get('/student/result', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/student/View_Result.html'));
});

app.get('/student/rank', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/student/view_rank.html'));
});

app.get('/student/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/student/profile.html'));
});

app.get('/teacher/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/Teacher/Teacher_DashBoard.html'));
});

app.get('/teacher/marks', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/Teacher/mark_entry.html'));
});

app.get('/teacher/rankings', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/Teacher/teacher_rank.html'));
});

app.get('/teacher/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/Teacher/teacher_profile.html'));
});

// Handle all other routes - serve login page
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/login.html'));
});

// CRITICAL: Bind to 0.0.0.0 for Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GradeMaster Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Host: 0.0.0.0`);
    console.log(`📊 Production URL: https://student-grade-app-h1b9.onrender.com`);
    console.log(`🔐 Login Page: https://student-grade-app-h1b9.onrender.com/login`);
    console.log(`🎓 Student Dashboard: https://student-grade-app-h1b9.onrender.com/student/dashboard`);
    console.log(`👩‍🏫 Teacher Dashboard: https://student-grade-app-h1b9.onrender.com/teacher/dashboard`);
    console.log(`🔑 Test Credentials:`);
    console.log(`   Student: bala_murugan_s20230045 / Bala9677540588#`);
    console.log(`   Teacher: sarah_johnson / Sarah@7284`);
});