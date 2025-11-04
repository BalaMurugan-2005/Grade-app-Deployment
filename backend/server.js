// ===============================
// 🚀 Consolidated Student & Teacher Server (FIXED JSON FORMAT)
// ===============================
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// ✅ Allow requests from Live Server on port 5500
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));

app.use(express.json());

// ✅ Serve ALL static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// ===============================
// 📁 File Paths Configuration
// ===============================
const studentDataDir = path.join(__dirname, 'data');
const teacherDataDir = path.join(__dirname, 'data', 'teacher');

// Student data paths
const studentDataPath = path.join(studentDataDir, 'students.json');
const resultDataPath = path.join(studentDataDir, 'resultData.json');
const rankDataPath = path.join(studentDataDir, 'rankData.json');

// Teacher data paths
const teacherDataPath = path.join(teacherDataDir, 'teacherData.json');
const marksDataPath = path.join(teacherDataDir, 'studentsMarks.json');

// ✅ NEW: User credentials path
const userCredentialsPath = path.join(__dirname, 'data', 'userCredentials.json');

// Ensure data directories exist
if (!fs.existsSync(studentDataDir)) {
    fs.mkdirSync(studentDataDir, { recursive: true });
}
if (!fs.existsSync(teacherDataDir)) {
    fs.mkdirSync(teacherDataDir, { recursive: true });
}
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initialize empty data files if they don't exist
initializeDataFiles();

// ===============================
// 🔧 Utility Functions
// ===============================
function initializeDataFiles() {
    // ✅ NEW: User credentials file
    if (!fs.existsSync(userCredentialsPath)) {
        const defaultCredentials = {
            students: [
                { 
                    id: "S20230045", 
                    username: "student", 
                    password: "student123", 
                    name: "Bala Murugan",
                    className: "10-A",
                    academicYear: "2025-2026"
                },
                { 
                    id: "S20230046", 
                    username: "karthik", 
                    password: "karthik123", 
                    name: "Karthik Kumar",
                    className: "10-B",
                    academicYear: "2025-2026"
                }
            ],
            teachers: [
                {
                    id: "TCH-7284",
                    username: "teacher",
                    password: "teacher123",
                    name: "Dr. Anitha Rajesh",
                    subject: "Mathematics",
                    email: "anitha.rajesh@schooldemo.edu",
                    class: "10A & 10B"
                },
                {
                    id: "TCH-7285",
                    username: "david",
                    password: "david123",
                    name: "Mr. David Lee",
                    subject: "Science",
                    email: "david.lee@grademaster.edu",
                    class: "10A & 10B"
                }
            ]
        };
        fs.writeFileSync(userCredentialsPath, JSON.stringify(defaultCredentials, null, 2));
        console.log('✅ User credentials file created');
    }

    // Student data files
    if (!fs.existsSync(studentDataPath)) {
        const defaultStudents = [
            { 
                id: "S20230045", 
                name: "Bala Murugan", 
                rollNo: "S20230045", 
                class: "10A",
                className: "10th Standard A",
                academicYear: "2024-2025",
                attendance: "95%"
            },
            { 
                id: "S20230046", 
                name: "Karthik Kumar", 
                rollNo: "S20230046", 
                class: "10A",
                className: "10th Standard A",
                academicYear: "2024-2025",
                attendance: "92%"
            }
        ];
        fs.writeFileSync(studentDataPath, JSON.stringify(defaultStudents, null, 2));
        console.log('✅ Student data file created');
    }
    
    if (!fs.existsSync(resultDataPath)) {
        const defaultResult = {
            student: {
                name: "Bala Murugan",
                rollNo: "S20230045",
                class: "10A",
                section: "A"
            },
            subjects: [
                { name: "Tamil", marks: 85, grade: "A" },
                { name: "English", marks: 78, grade: "B" },
                { name: "Mathematics", marks: 92, grade: "A+" },
                { name: "Science", marks: 88, grade: "A" },
                { name: "Social Science", marks: 80, grade: "A" }
            ],
            summary: {
                totalMarks: 423,
                percentage: 84.6,
                grade: "A",
                status: "Pass"
            }
        };
        fs.writeFileSync(resultDataPath, JSON.stringify(defaultResult, null, 2));
        console.log('✅ Result data file created');
    }
    
    if (!fs.existsSync(rankDataPath)) {
        const defaultRankings = {
            "stats": {
                "yourId": "S20230045",
                "totalStudents": 10
            },
            "rankings": [
                { "rank": 1, "name": "Arjun Kumar", "rollNo": "S20230010", "totalMarks": 492, "percentage": 98.4, "grade": "A+" },
                { "rank": 2, "name": "Kavya Raj", "rollNo": "S20230018", "totalMarks": 485, "percentage": 97.0, "grade": "A+" },
                { "rank": 3, "name": "Bala Murugan", "rollNo": "S20230045", "totalMarks": 459, "percentage": 91.8, "grade": "A" },
                { "rank": 4, "name": "Karthik Kumar", "rollNo": "S20230030", "totalMarks": 445, "percentage": 89.0, "grade": "B+" },
                { "rank": 5, "name": "Priya Devi", "rollNo": "S20230041", "totalMarks": 438, "percentage": 87.6, "grade": "B+" },
                { "rank": 6, "name": "Suresh", "rollNo": "S20230055", "totalMarks": 421, "percentage": 84.2, "grade": "B" },
                { "rank": 7, "name": "Harini", "rollNo": "S20230062", "totalMarks": 414, "percentage": 82.8, "grade": "B" },
                { "rank": 8, "name": "Manoj", "rollNo": "S20230070", "totalMarks": 400, "percentage": 80.0, "grade": "B" },
                { "rank": 9, "name": "Devi Lakshmi", "rollNo": "S20230081", "totalMarks": 395, "percentage": 79.0, "grade": "C+" },
                { "rank": 10, "name": "Kiran", "rollNo": "S20230090", "totalMarks": 380, "percentage": 76.0, "grade": "C+" }
            ]
        };
        fs.writeFileSync(rankDataPath, JSON.stringify(defaultRankings, null, 2));
        console.log('✅ Rank data file created');
    }
    
    // Teacher data files
    if (!fs.existsSync(teacherDataPath)) {
        const defaultTeachers = [
            {
                id: "TCH-7284",
                name: "Dr. Anitha Rajesh",
                subject: "Mathematics",
                email: "anitha.rajesh@schooldemo.edu",
                class: "10A & 10B"
            }
        ];
        fs.writeFileSync(teacherDataPath, JSON.stringify(defaultTeachers, null, 2));
        console.log('✅ Teacher data file created');
    }
    
    if (!fs.existsSync(marksDataPath)) {
        const defaultStudentMarks = [
            { id: "S001", name: "Rahul Kumar", rollNo: "S001", class: "10A", marks: { tamil: 85, english: 78, maths: 92, science: 88, social: 80 } },
            { id: "S002", name: "Priya Sharma", rollNo: "S002", class: "10A", marks: { tamil: 90, english: 85, maths: 95, science: 92, social: 88 } },
            { id: "S003", name: "Amit Patel", rollNo: "S003", class: "10A", marks: null },
            { id: "S004", name: "Sneha Reddy", rollNo: "S004", class: "10A", marks: null },
            { id: "S005", name: "Vikram Singh", rollNo: "S005", class: "10A", marks: { tamil: 75, english: 82, maths: 78, science: 80, social: 85 } }
        ];
        fs.writeFileSync(marksDataPath, JSON.stringify(defaultStudentMarks, null, 2));
        console.log('✅ Student marks file created');
    }
}

const readJSONFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // File doesn't exist, return empty array
                    resolve([]);
                } else {
                    reject(err);
                }
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
};

const writeJSONFile = (filePath, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// ===============================
// 🔐 AUTHENTICATION API Routes
// ===============================

// ✅ User Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, userType } = req.body;

        if (!username || !password || !userType) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, password, and user type are required' 
            });
        }

        const credentials = await readJSONFile(userCredentialsPath);
        const userList = userType === 'student' ? credentials.students : credentials.teachers;
        
        const user = userList.find(u => 
            u.username === username && u.password === password
        );

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        // Return user data without password
        const { password: _, ...userData } = user;
        
        res.json({
            success: true,
            message: 'Login successful',
            userType: userType,
            user: userData,
            redirectUrl: userType === 'student' 
                ? '/frontend/templates/student/Student_DashBoard.html' 
                : '/frontend/templates/Teacher/Teacher_DashBoard.html'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during login' 
        });
    }
});
app.get('/api/check-auth', async (req, res) => {
    try {
        const { userType, userId } = req.query;
        
        if (!userType || !userId) {
            return res.json({ authenticated: false });
        }

        const credentials = await readJSONFile(userCredentialsPath);
        const userList = userType === 'student' ? credentials.students : credentials.teachers;
        const user = userList.find(u => u.id === userId);

        if (!user) {
            return res.json({ authenticated: false });
        }

        // Return user data without password
        const { password: _, ...userData } = user;
        
        res.json({
            authenticated: true,
            userType: userType,
            user: userData
        });

    } catch (error) {
        console.error('Auth check error:', error);
        res.json({ authenticated: false });
    }
});
app.get('/api/check-auth', async (req, res) => {
    try {
        // In a real app, you would use JWT tokens or sessions
        // For simplicity, we'll use a query parameter or header
        const { userType, userId } = req.query;
        
        if (!userType || !userId) {
            return res.json({ authenticated: false });
        }

        const credentials = await readJSONFile(userCredentialsPath);
        const userList = userType === 'student' ? credentials.students : credentials.teachers;
        const user = userList.find(u => u.id === userId);

        if (!user) {
            return res.json({ authenticated: false });
        }

        // Return user data without password
        const { password: _, ...userData } = user;
        
        res.json({
            authenticated: true,
            userType: userType,
            user: userData
        });

    } catch (error) {
        console.error('Auth check error:', error);
        res.json({ authenticated: false });
    }
});

// ✅ Logout endpoint
app.post('/api/logout', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Logged out successfully' 
    });
});
// ===============================
// 🛡️ AUTHENTICATION MIDDLEWARE
// ===============================

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    // For API routes, we'll check via the check-auth endpoint
    // For HTML pages, we'll handle via client-side JavaScript
    next();
};

app.use('/student/dashboard', requireAuth);
app.use('/teacher/dashboard', requireAuth);
app.use('/student/result', requireAuth);
app.use('/student/rank', requireAuth);
app.use('/teacher/marks', requireAuth);
app.use('/teacher/rankings', requireAuth);

// ===============================
// 🎓 STUDENT API Routes
// ===============================

// ✅ 1. Get student info (Student Dashboard)
app.get('/api/student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const students = await readJSONFile(studentDataPath);
        const student = students.find(s => s.id === studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Error reading student data' });
    }
});

// ✅ 2. Get result data (View Result page)
app.get('/api/result/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const resultData = await readJSONFile(resultDataPath);

        // Check if result exists for this student
        if (resultData.student && resultData.student.rollNo !== studentId) {
            return res.status(404).json({ message: 'Result not found for this student' });
        }

        res.json(resultData);
    } catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({ error: 'Error reading result data' });
    }
});

// ✅ 3. Get ranking list (View Rank page) - FIXED FOR STUDENT VIEW
app.get('/api/rankings', async (req, res) => {
    try {
        const rankData = await readJSONFile(rankDataPath);
        
        // Return the exact format that student view_rank.js expects
        res.json(rankData);
    } catch (error) {
        console.error('Error reading ranking data:', error);
        res.status(500).json({ error: 'Error reading ranking data' });
    }
});

// ===============================
// 👩‍🏫 TEACHER API Routes
// ===============================

// 👩‍🏫 Fetch Teacher Profile
app.get('/api/teacher/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;
        const teachers = await readJSONFile(teacherDataPath);
        const teacher = teachers.find(t => t.id === teacherId);

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        res.json(teacher);
    } catch (error) {
        console.error('Error fetching teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 👩‍🏫 Create/Update Teacher Profile
app.post('/api/teacher', async (req, res) => {
    try {
        const teacherData = req.body;
        
        // Validate required fields
        if (!teacherData.id || !teacherData.name || !teacherData.subject || !teacherData.email || !teacherData.class) {
            return res.status(400).json({ error: 'All fields are required: id, name, subject, email, class' });
        }

        const teachers = await readJSONFile(teacherDataPath);
        const existingTeacherIndex = teachers.findIndex(t => t.id === teacherData.id);
        
        if (existingTeacherIndex !== -1) {
            // Update existing teacher
            teachers[existingTeacherIndex] = { ...teachers[existingTeacherIndex], ...teacherData };
        } else {
            // Add new teacher
            teachers.push(teacherData);
        }
        
        await writeJSONFile(teacherDataPath, teachers);
        
        res.json({ 
            message: existingTeacherIndex !== -1 ? 'Teacher profile updated successfully' : 'Teacher profile created successfully', 
            teacher: teacherData 
        });
    } catch (error) {
        console.error('Error saving teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 👩‍🏫 Update Teacher Profile
app.put('/api/teacher/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;
        const updatedData = req.body;
        
        const teachers = await readJSONFile(teacherDataPath);
        const teacherIndex = teachers.findIndex(t => t.id === teacherId);
        
        if (teacherIndex === -1) {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        
        teachers[teacherIndex] = { ...teachers[teacherIndex], ...updatedData };
        await writeJSONFile(teacherDataPath, teachers);
        
        res.json({ message: 'Teacher profile updated successfully', teacher: teachers[teacherIndex] });
    } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🎓 Fetch All Students (for teacher)
app.get('/api/students', async (req, res) => {
    try {
        const students = await readJSONFile(marksDataPath);
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🎓 Fetch Students by Class
app.get('/api/students/class/:className', async (req, res) => {
    try {
        const className = req.params.className;
        const students = await readJSONFile(marksDataPath);
        const classStudents = students.filter(student => student.class === className);
        
        res.json(classStudents);
    } catch (error) {
        console.error('Error fetching class students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🎓 Fetch Single Student by ID (for teacher)
app.get('/api/teacher/student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const students = await readJSONFile(marksDataPath);
        const student = students.find(s => s.id === studentId);
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🎓 Add New Student
app.post('/api/student', async (req, res) => {
    try {
        const studentData = req.body;

        // Validate required fields
        if (!studentData.id || !studentData.name || !studentData.rollNo || !studentData.class) {
            return res.status(400).json({ error: 'All fields are required: id, name, rollNo, class' });
        }

        const students = await readJSONFile(marksDataPath);
        
        // Check if student already exists
        const existingStudent = students.find(s => s.id === studentData.id || s.rollNo === studentData.rollNo);
        if (existingStudent) {
            return res.status(400).json({ error: 'Student with this ID or Roll No already exists' });
        }

        // Initialize with null marks
        const newStudent = {
            ...studentData,
            marks: null
        };

        students.push(newStudent);
        await writeJSONFile(marksDataPath, students);

        res.json({ 
            message: 'Student added successfully', 
            student: newStudent 
        });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✏️ Update Marks for a Student
app.post('/api/student/:id/marks', async (req, res) => {
    try {
        const studentId = req.params.id;
        const { marks } = req.body;

        // Validate marks
        if (!marks || typeof marks !== 'object') {
            return res.status(400).json({ error: 'Invalid marks data' });
        }

        const requiredSubjects = ['tamil', 'english', 'maths', 'science', 'social'];
        for (const subject of requiredSubjects) {
            if (marks[subject] === undefined || marks[subject] === null) {
                return res.status(400).json({ error: `Missing marks for ${subject}` });
            }
            if (marks[subject] < 0 || marks[subject] > 100) {
                return res.status(400).json({ error: `Invalid marks for ${subject}. Must be between 0-100` });
            }
        }

        const students = await readJSONFile(marksDataPath);
        const studentIndex = students.findIndex(s => s.id === studentId);

        if (studentIndex === -1) {
            return res.status(404).json({ error: 'Student not found' });
        }

        students[studentIndex].marks = marks;
        await writeJSONFile(marksDataPath, students);

        res.json({ 
            message: 'Marks updated successfully', 
            student: students[studentIndex] 
        });
    } catch (error) {
        console.error('Error updating marks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✏️ Bulk Update Marks for Multiple Students
app.post('/api/students/marks/bulk', async (req, res) => {
    try {
        const { studentMarks } = req.body;

        if (!Array.isArray(studentMarks)) {
            return res.status(400).json({ error: 'Invalid data format. Expected array of student marks.' });
        }

        const students = await readJSONFile(marksDataPath);
        let updatedCount = 0;

        for (const item of studentMarks) {
            const { studentId, marks } = item;
            
            if (!studentId || !marks) {
                continue; // Skip invalid entries
            }

            const studentIndex = students.findIndex(s => s.id === studentId);
            if (studentIndex !== -1) {
                // Validate marks
                const requiredSubjects = ['tamil', 'english', 'maths', 'science', 'social'];
                let valid = true;
                
                for (const subject of requiredSubjects) {
                    if (marks[subject] === undefined || marks[subject] === null || marks[subject] < 0 || marks[subject] > 100) {
                        valid = false;
                        break;
                    }
                }

                if (valid) {
                    students[studentIndex].marks = marks;
                    updatedCount++;
                }
            }
        }

        await writeJSONFile(marksDataPath, students);

        res.json({ 
            message: `Marks updated for ${updatedCount} students successfully`,
            updatedCount 
        });
    } catch (error) {
        console.error('Error updating bulk marks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 📊 Get Class Rankings (for teacher) - FIXED FOR TEACHER VIEW
app.get('/api/teacher/rankings', async (req, res) => {
    try {
        const students = await readJSONFile(marksDataPath);
        
        // Process rankings for teacher view
        const rankings = students
            .filter(student => student.marks !== null)
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
            .sort((a, b) => b.total - a.total);
        
        res.json(rankings);
    } catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 📊 Get Class Rankings by Class
app.get('/api/rankings/class/:className', async (req, res) => {
    try {
        const className = req.params.className;
        const students = await readJSONFile(marksDataPath);
        
        // Process rankings for specific class
        const rankings = students
            .filter(student => student.marks !== null && student.class === className)
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
            .sort((a, b) => b.total - a.total);
        
        res.json(rankings);
    } catch (error) {
        console.error('Error fetching class rankings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 📈 Get Class Statistics
app.get('/api/statistics', async (req, res) => {
    try {
        const students = await readJSONFile(marksDataPath);
        const studentsWithMarks = students.filter(student => student.marks !== null);
        
        if (studentsWithMarks.length === 0) {
            return res.json({
                totalStudents: students.length,
                studentsWithMarks: 0,
                classAverage: 0,
                topScore: 0,
                passPercentage: 0
            });
        }
        
        // Calculate statistics
        const totals = studentsWithMarks.map(student => 
            Object.values(student.marks).reduce((sum, mark) => sum + mark, 0)
        );
        
        const classAverage = totals.reduce((sum, total) => sum + total, 0) / totals.length;
        const topScore = Math.max(...totals);
        const passPercentage = (studentsWithMarks.filter(student => {
            const average = Object.values(student.marks).reduce((sum, mark) => sum + mark, 0) / Object.keys(student.marks).length;
            return average >= 40;
        }).length / studentsWithMarks.length) * 100;
        
        res.json({
            totalStudents: students.length,
            studentsWithMarks: studentsWithMarks.length,
            classAverage: Math.round(classAverage),
            topScore: topScore,
            passPercentage: Math.round(passPercentage)
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 📈 Get Class Statistics by Class
app.get('/api/statistics/class/:className', async (req, res) => {
    try {
        const className = req.params.className;
        const students = await readJSONFile(marksDataPath);
        const classStudents = students.filter(student => student.class === className);
        const studentsWithMarks = classStudents.filter(student => student.marks !== null);
        
        if (studentsWithMarks.length === 0) {
            return res.json({
                totalStudents: classStudents.length,
                studentsWithMarks: 0,
                classAverage: 0,
                topScore: 0,
                passPercentage: 0
            });
        }
        
        // Calculate statistics for specific class
        const totals = studentsWithMarks.map(student => 
            Object.values(student.marks).reduce((sum, mark) => sum + mark, 0)
        );
        
        const classAverage = totals.reduce((sum, total) => sum + total, 0) / totals.length;
        const topScore = Math.max(...totals);
        const passPercentage = (studentsWithMarks.filter(student => {
            const average = Object.values(student.marks).reduce((sum, mark) => sum + mark, 0) / Object.keys(student.marks).length;
            return average >= 40;
        }).length / studentsWithMarks.length) * 100;
        
        res.json({
            totalStudents: classStudents.length,
            studentsWithMarks: studentsWithMarks.length,
            classAverage: Math.round(classAverage),
            topScore: topScore,
            passPercentage: Math.round(passPercentage)
        });
    } catch (error) {
        console.error('Error fetching class statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 📤 Export Rankings to CSV
app.get('/api/export/rankings', async (req, res) => {
    try {
        const students = await readJSONFile(marksDataPath);
        
        const processedStudents = students
            .filter(student => student.marks !== null)
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
            .sort((a, b) => b.total - a.total);
        
        let csvContent = "Rank,Student Name,Roll No,Class,Tamil,English,Maths,Science,Social,Total,Average,Grade\n";
        
        processedStudents.forEach((student, index) => {
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
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=class_rankings.csv');
        res.send(csvContent);
        
    } catch (error) {
        console.error('Error exporting rankings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🎯 Grade Calculation Helper
function calculateGrade(average) {
    if (average >= 90) return 'A+';
    if (average >= 80) return 'A';
    if (average >= 70) return 'B';
    if (average >= 60) return 'C';
    if (average >= 40) return 'D';
    return 'F';
}

// ===============================
// 🏠 Serve HTML Pages
// ===============================

// Student Pages
app.get('/student/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/student/Student_DashBoard.html'));
});

app.get('/student/result', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/student/View_Result.html'));
});

app.get('/student/rank', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/student/View_Rank.html'));
});

// Teacher Pages
app.get('/teacher/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/Teacher/Teacher_DashBoard.html'));
});

app.get('/teacher/marks', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/Teacher/mark_entry.html'));
});

app.get('/teacher/rankings', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/Teacher/teacher_rank.html'));
});

app.get('/teacher/students', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/Teacher/student_management.html'));
});

// Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/login.html'));
});

// Root route - redirect to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Handle 404 - Page not found
app.use((req, res) => {
    res.status(404).send(`
        <html>
            <head><title>404 - Page Not Found</title></head>
            <body>
                <h1>404 - Page Not Found</h1>
                <p>The page you are looking for does not exist.</p>
                <p><a href="/login">Go to Login</a></p>
            </body>
        </html>
    `);
});

// ===============================
// 🚀 Start Server
// ===============================
const PORT = 5001; // Using port 5001 for API server
app.listen(PORT, () => {
    console.log(`\n✅ Consolidated Student & Teacher Server running on http://localhost:${PORT}`);
    console.log(`\n🎓 Student Pages (Access via Live Server on port 5500):`);
    console.log(`   📊 Dashboard: http://127.0.0.1:5500/frontend/templates/student/Student_DashBoard.html`);
    console.log(`   📄 View Result: http://127.0.0.1:5500/frontend/templates/student/View_Result.html`);
    console.log(`   🏆 View Rank: http://127.0.0.1:5500/frontend/templates/student/View_Rank.html`);
    console.log(`\n👩‍🏫 Teacher Pages (Access via Live Server on port 5500):`);
    console.log(`   📊 Dashboard: http://127.0.0.1:5500/frontend/templates/Teacher/Teacher_DashBoard.html`);
    console.log(`   ✏️  Marks Entry: http://127.0.0.1:5500/frontend/templates/Teacher/mark_entry.html`);
    console.log(`   🏆 Rankings: http://127.0.0.1:5500/frontend/templates/Teacher/teacher_rank.html`);
    console.log(`\n🔑 Login Page:`);
    console.log(`   🔐 Login: http://127.0.0.1:5500/frontend/templates/login.html`);
    console.log(`\n🔗 API Endpoints (Server running on port ${PORT}):`);
    console.log(`   🔐 Auth API: http://localhost:${PORT}/api/login`);
    console.log(`   🎓 Student APIs: http://localhost:${PORT}/api/student/:id, /api/result/:id, /api/rankings`);
    console.log(`   👩‍🏫 Teacher APIs: http://localhost:${PORT}/api/teacher/:id, /api/students, /api/teacher/rankings, /api/statistics`);
    console.log(`   📊 Statistics: http://localhost:${PORT}/api/statistics, /api/export/rankings`);
    console.log(`\n📁 Data Files Initialized:`);
    console.log(`   ✅ userCredentials.json, students.json, resultData.json, rankData.json`);
    console.log(`   ✅ teacherData.json, studentsMarks.json`);
    console.log(`\n🔐 Default Login Credentials:`);
    console.log(`   👨‍🎓 Student: username="student", password="student123"`);
    console.log(`   👩‍🏫 Teacher: username="teacher", password="teacher123"`);
    console.log(`\n💡 Important: Your frontend runs on Live Server (port 5500) and makes API calls to this server (port 5001)`);
});