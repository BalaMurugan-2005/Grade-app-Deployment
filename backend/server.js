// ===============================
// 🚀 Consolidated Student & Teacher Server (FIXED RANKING LOGIC - INCLUDES FAILED STUDENTS)
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
// 📁 File Paths Configuration (UPDATED FOR YOUR STRUCTURE)
// ===============================
const dataDir = path.join(__dirname, 'data');
const teacherDataDir = path.join(dataDir, 'teacher');
const studentDataDir = path.join(dataDir, 'student');

// Data file paths - USING YOUR ACTUAL FILES
const teacherDataPath = path.join(teacherDataDir, 'teacherData.json');
const studentDataPath = path.join(studentDataDir, 'Student.json'); // Your actual file

// Ensure data directories exist
if (!fs.existsSync(teacherDataDir)) {
    fs.mkdirSync(teacherDataDir, { recursive: true });
}
if (!fs.existsSync(studentDataDir)) {
    fs.mkdirSync(studentDataDir, { recursive: true });
}

// ===============================
// 🔧 Utility Functions
// ===============================
const readJSONFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
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

// ✅ User Login - FIXED FOR YOUR DATA STRUCTURE
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, userType } = req.body;

        if (!username || !password || !userType) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, password, and user type are required' 
            });
        }

        let userData, user;
        
        if (userType === 'student') {
            // Check student credentials from Student.json
            userData = await readJSONFile(studentDataPath);
            const students = userData.students || [];
            user = students.find(s => 
                (s.username === username || s.email === username) && s.password === password
            );
        } else {
            // Check teacher credentials from teacherData.json
            userData = await readJSONFile(teacherDataPath);
            user = userData.find(t => 
                (t.username === username || t.email === username) && t.password === password
            );
        }

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        // Return user data without password
        const { password: _, ...userDataWithoutPassword } = user;
        
        res.json({
            success: true,
            message: 'Login successful',
            userType: userType,
            user: userDataWithoutPassword,
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

// ✅ Check Authentication
app.get('/api/check-auth', async (req, res) => {
    try {
        const { userType, userId } = req.query;
        
        if (!userType || !userId) {
            return res.json({ authenticated: false });
        }

        let user;
        
        if (userType === 'student') {
            const studentData = await readJSONFile(studentDataPath);
            const students = studentData.students || [];
            user = students.find(s => s.id === userId);
        } else {
            const teacherData = await readJSONFile(teacherDataPath);
            user = teacherData.find(t => t.id === userId);
        }

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
// 🎓 STUDENT API Routes
// ===============================
// ===============================
// 👤 STUDENT PROFILE API Routes
// ===============================

// ✅ Get student profile data (for Profile page)
app.get('/api/student/:id/profile', async (req, res) => {
    try {
        const studentId = req.params.id;
        const studentData = await readJSONFile(studentDataPath);
        const students = studentData.students || [];
        const student = students.find(s => s.id === studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Format profile data according to your Student.json structure
        const profileData = {
            // Personal Information
            id: student.id,
            name: student.name,
            email: student.email,
            username: student.username,
            rollNo: student.rollNo,
            
            // Academic Information
            class: student.class,
            section: student.section,
            academicYear: student.academicYear,
            attendance: student.attendance,
            rank: student.rank,
            grade: student.grade,
            
            // Marks
            marks: student.marks || {},
            totalMarks: student.totalMarks,
            percentage: student.percentage,
            status: student.status,
            
            // Badges
            badges: student.badges || [],
            
            // System
            isMarked: student.isMarked || false
        };

        res.json(profileData);
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ error: 'Error reading student profile data' });
    }
});

// ✅ Change student password
app.post('/api/student/:id/change-password', async (req, res) => {
    try {
        const studentId = req.params.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Read student data
        const studentData = await readJSONFile(studentDataPath);
        const students = studentData.students || [];
        const studentIndex = students.findIndex(s => s.id === studentId);

        if (studentIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }

        // Verify current password
        if (students[studentIndex].password !== currentPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Update password
        students[studentIndex].password = newPassword;

        // Write back to file
        await writeJSONFile(studentDataPath, studentData);

        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});
// ✅ 1. Get student info (Student Dashboard)
app.get('/api/student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const studentData = await readJSONFile(studentDataPath);
        const students = studentData.students || [];
        const student = students.find(s => s.id === studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Return student data without password
        const { password: _, ...studentInfo } = student;
        res.json(studentInfo);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Error reading student data' });
    }
});

// ✅ 2. Get result data (View Result page) - FIXED FOR YOUR DATA STRUCTURE
app.get('/api/result/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const studentData = await readJSONFile(studentDataPath);
        const students = studentData.students || [];
        const student = students.find(s => s.id === studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Format result data for the frontend from your Student.json structure
        const resultData = {
            student: {
                name: student.name,
                rollNo: student.rollNo,
                class: student.class,
                section: student.section,
                academicYear: student.academicYear
            },
            subjects: student.marks ? [
                { name: "Tamil", marks: student.marks.tamil, grade: getGrade(student.marks.tamil) },
                { name: "English", marks: student.marks.english, grade: getGrade(student.marks.english) },
                { name: "Mathematics", marks: student.marks.maths, grade: getGrade(student.marks.maths) },
                { name: "Science", marks: student.marks.science, grade: getGrade(student.marks.science) },
                { name: "Social Science", marks: student.marks.social, grade: getGrade(student.marks.social) }
            ] : [],
            summary: {
                totalMarks: student.totalMarks || 0,
                percentage: student.percentage || 0,
                grade: student.grade || 'N/A',
                status: student.status || 'Unmarked'
            }
        };

        res.json(resultData);
    } catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({ error: 'Error reading result data' });
    }
});
// ✅ Debug: Test teacher profile endpoint
app.get('/api/debug/teacher/:id/profile', async (req, res) => {
    try {
        const teacherId = req.params.id;
        console.log('🔍 Debug: Fetching teacher profile for ID:', teacherId);
        
        const teachers = await readJSONFile(teacherDataPath);
        console.log('🔍 Debug: All teachers:', teachers);
        
        const teacher = teachers.find(t => t.id === teacherId);
        console.log('🔍 Debug: Found teacher:', teacher);

        if (!teacher) {
            console.log('❌ Debug: Teacher not found');
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Get student data for statistics
        const studentData = await readJSONFile(studentDataPath);
        const students = studentData.students || [];
        
        // Calculate basic statistics
        const totalStudents = students.length;
        const markedStudents = students.filter(s => s.isMarked).length;
        
        const profileData = {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            username: teacher.username,
            designation: teacher.designation,
            department: teacher.department,
            joinDate: teacher.joinDate,
            experience: teacher.experience,
            subjects: teacher.subjects,
            contact: teacher.contact,
            badges: teacher.badges || ['active-teacher'],
            statistics: {
                totalStudents: totalStudents,
                markedStudents: markedStudents,
                pendingEvaluations: totalStudents - markedStudents,
                classAverage: 75, // Placeholder
                passPercentage: 85, // Placeholder
                topScore: 492, // Placeholder
                topPerformer: 'Arjun Kumar', // Placeholder
                subjectsHandled: teacher.subjects
            }
        };

        console.log('✅ Debug: Sending profile data:', profileData);
        res.json(profileData);

    } catch (error) {
        console.error('❌ Debug: Error in teacher profile:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// ✅ Test route to check if teacher profile API is working
app.get('/api/test-teacher-profile', async (req, res) => {
    try {
        console.log('🔍 Testing teacher profile API...');
        
        const teachers = await readJSONFile(teacherDataPath);
        console.log('📊 Teachers data:', teachers);
        
        const studentData = await readJSONFile(studentDataPath);
        console.log('📊 Students count:', studentData.students ? studentData.students.length : 0);
        
        res.json({
            success: true,
            message: 'Teacher profile API is working',
            teachersCount: teachers.length,
            studentsCount: studentData.students ? studentData.students.length : 0
        });
    } catch (error) {
        console.error('❌ Test route error:', error);
        res.status(500).json({
            success: false,
            message: 'Test failed',
            error: error.message
        });
    }
});

//////////////////////////////////////////////////////////////////////////////////////////////
// ✅ 3. Get ranking list (View Rank page) - FIXED RANKING LOGIC (INCLUDES FAILED STUDENTS AT END)
app.get('/api/rankings', async (req, res) => {
    try {
        const studentData = await readJSONFile(studentDataPath);
        
        // Get all marked students
        const markedStudents = (studentData.students || [])
            .filter(student => student.isMarked && student.totalMarks !== null && student.totalMarks !== undefined);
        
        // Separate passed and failed students
        const passedStudents = markedStudents.filter(student => student.status === 'Pass' || student.percentage >= 40);
        const failedStudents = markedStudents.filter(student => student.status === 'Fail' || student.percentage < 40);
        
        // Sort passed students by total marks descending
        passedStudents.sort((a, b) => b.totalMarks - a.totalMarks);
        
        // Sort failed students by total marks descending (so higher failing marks come first)
        failedStudents.sort((a, b) => b.totalMarks - a.totalMarks);
        
        // Combine passed students first, then failed students
        const allRankedStudents = [...passedStudents, ...failedStudents];
        
        // Assign ranks
        const rankedStudents = allRankedStudents.map((student, index) => ({
            rank: index + 1,
            name: student.name,
            rollNo: student.rollNo,
            id: student.id,
            class: student.class,
            section: student.section,
            totalMarks: student.totalMarks,
            percentage: student.percentage,
            grade: student.grade,
            status: student.status,
            isMarked: student.isMarked || false,
            marks: student.marks,
            isFailed: student.status === 'Fail' || student.percentage < 40
        }));

        const response = {
            stats: studentData.stats || {
                totalStudents: markedStudents.length,
                academicYear: "2024-2025",
                passedStudents: passedStudents.length,
                failedStudents: failedStudents.length
            },
            rankings: rankedStudents
        };

        res.json(response);
    } catch (error) {
        console.error('Error reading ranking data:', error);
        res.status(500).json({ error: 'Error reading ranking data' });
    }
});

// ===============================
// 👩‍🏫 TEACHER API Routes
// ===============================
// ✅ Get teacher profile data (for Profile page)
// ===============================
// 👩‍🏫 TEACHER PROFILE API Routes
// ===============================

// ✅ Get teacher profile data (for Profile page)
app.get('/api/teacher/:id/profile', async (req, res) => {
    try {
        const teacherId = req.params.id;
        const teachers = await readJSONFile(teacherDataPath);
        const teacher = teachers.find(t => t.id === teacherId);

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Get teacher statistics from student data
        const studentData = await readJSONFile(studentDataPath);
        const students = studentData.students || [];
        
        // Calculate teacher statistics
        const totalStudents = students.length;
        const markedStudents = students.filter(s => s.isMarked).length;
        const studentsWithMarks = students.filter(s => s.isMarked && s.totalMarks);
        
        // Calculate class averages if marks are available
        let classAverage = 0;
        let passPercentage = 0;
        let topPerformer = null;
        
        if (studentsWithMarks.length > 0) {
            const totalMarks = studentsWithMarks.reduce((sum, student) => sum + student.totalMarks, 0);
            classAverage = totalMarks / studentsWithMarks.length;
            passPercentage = (studentsWithMarks.filter(s => s.status === 'Pass').length / studentsWithMarks.length) * 100;
            
            // Find top performer
            topPerformer = studentsWithMarks.reduce((top, student) => 
                student.totalMarks > (top?.totalMarks || 0) ? student : top, null
            );
        }

        // Format profile data using your enhanced teacher data structure
        const profileData = {
            // Personal Information
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            username: teacher.username,
            
            // Professional Information (from your enhanced data)
            designation: teacher.designation || getDesignation(teacher.name),
            department: teacher.department || "Academic Department",
            joinDate: teacher.joinDate || "2023-08-01",
            experience: teacher.experience || "2+ years",
            subjects: teacher.subjects || [],
            
            // Teaching Statistics (calculated from student data)
            statistics: {
                totalStudents: totalStudents,
                markedStudents: markedStudents,
                pendingEvaluations: totalStudents - markedStudents,
                classAverage: Math.round(classAverage),
                passPercentage: Math.round(passPercentage),
                topScore: topPerformer ? topPerformer.totalMarks : 0,
                topPerformer: topPerformer ? topPerformer.name : 'N/A',
                subjectsHandled: teacher.subjects || ["All Subjects"]
            },
            
            // Contact Information (from your enhanced data)
            contact: teacher.contact || {
                email: teacher.email,
                phone: "+91 98765 43210",
                address: "GradeMaster Institution, Chennai"
            },
            
            // Badges based on performance (calculated dynamically)
            badges: generateTeacherBadges(markedStudents, passPercentage, totalStudents)
        };

        res.json(profileData);
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({ error: 'Error reading teacher profile data' });
    }
});

// ✅ Change teacher password
app.post('/api/teacher/:id/change-password', async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Read teacher data
        const teachers = await readJSONFile(teacherDataPath);
        const teacherIndex = teachers.findIndex(t => t.id === teacherId);

        if (teacherIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Teacher not found' 
            });
        }

        // Verify current password
        if (teachers[teacherIndex].password !== currentPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Update password
        teachers[teacherIndex].password = newPassword;

        // Write back to file
        await writeJSONFile(teacherDataPath, teachers);

        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });

    } catch (error) {
        console.error('Error changing teacher password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ✅ Update teacher profile information
app.put('/api/teacher/:id/profile', async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { email, phone, address } = req.body;

        // Read teacher data
        const teachers = await readJSONFile(teacherDataPath);
        const teacherIndex = teachers.findIndex(t => t.id === teacherId);

        if (teacherIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Teacher not found' 
            });
        }

        // Update teacher data (only allowed fields)
        if (email) teachers[teacherIndex].email = email;
        if (phone) teachers[teacherIndex].contact.phone = phone;
        if (address) teachers[teacherIndex].contact.address = address;

        // Write back to file
        await writeJSONFile(teacherDataPath, teachers);

        res.json({ 
            success: true, 
            message: 'Profile updated successfully' 
        });

    } catch (error) {
        console.error('Error updating teacher profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});
// 👩‍🏫 Fetch Teacher Profile
app.get('/api/teacher/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;
        const teachers = await readJSONFile(teacherDataPath);
        const teacher = teachers.find(t => t.id === teacherId);

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Return teacher data without password
        const { password: _, ...teacherInfo } = teacher;
        res.json(teacherInfo);
    } catch (error) {
        console.error('Error fetching teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🎓 Fetch All Students (for teacher - marks entry)
app.get('/api/students', async (req, res) => {
    try {
        const studentData = await readJSONFile(studentDataPath);
        const students = (studentData.students || []).map(student => ({
            id: student.id,
            name: student.name,
            rollNo: student.rollNo,
            class: student.class,
            section: student.section,
            marks: student.marks,
            isMarked: student.isMarked,
            totalMarks: student.totalMarks,
            percentage: student.percentage,
            grade: student.grade,
            status: student.status
        }));
        
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✏️ Update Marks for a Student - FIXED FOR YOUR DATA STRUCTURE
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

        // Read current student data
        const studentData = await readJSONFile(studentDataPath);
        const students = studentData.students || [];
        const studentIndex = students.findIndex(s => s.id === studentId);

        if (studentIndex === -1) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Calculate total marks and percentage
        const totalMarks = Object.values(marks).reduce((sum, mark) => sum + mark, 0);
        const percentage = (totalMarks / 500) * 100;
        const grade = calculateGrade(percentage);
        const status = percentage >= 40 ? 'Pass' : 'Fail';

        // Update student data
        students[studentIndex] = {
            ...students[studentIndex],
            marks: marks,
            totalMarks: totalMarks,
            percentage: Math.round(percentage * 10) / 10,
            grade: grade,
            status: status,
            isMarked: true
        };

        // Recalculate ranks for all marked students
        const markedStudents = students.filter(s => s.isMarked && s.totalMarks !== null && s.totalMarks !== undefined);
        
        // Separate passed and failed students
        const passedStudents = markedStudents.filter(student => student.status === 'Pass' || student.percentage >= 40);
        const failedStudents = markedStudents.filter(student => student.status === 'Fail' || student.percentage < 40);
        
        // Sort passed students by total marks descending
        passedStudents.sort((a, b) => b.totalMarks - a.totalMarks);
        
        // Sort failed students by total marks descending
        failedStudents.sort((a, b) => b.totalMarks - a.totalMarks);
        
        // Combine passed students first, then failed students
        const allRankedStudents = [...passedStudents, ...failedStudents];
        
        // Assign ranks based on combined sorted position
        allRankedStudents.forEach((student, index) => {
            const studentIndex = students.findIndex(s => s.id === student.id);
            if (studentIndex !== -1) {
                students[studentIndex].rank = index + 1;
            }
        });

        // Update stats
        studentData.stats = {
            ...studentData.stats,
            totalStudents: students.length,
            academicYear: "2024-2025",
            passedStudents: passedStudents.length,
            failedStudents: failedStudents.length
        };

        // Write back to file
        await writeJSONFile(studentDataPath, studentData);

        res.json({ 
            message: 'Marks updated successfully', 
            student: students[studentIndex] 
        });
    } catch (error) {
        console.error('Error updating marks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 📊 Get Class Statistics (for teacher)
app.get('/api/statistics', async (req, res) => {
    try {
        const studentData = await readJSONFile(studentDataPath);
        const students = studentData.students || [];
        const studentsWithMarks = students.filter(student => student.isMarked && student.totalMarks !== null && student.totalMarks !== undefined);
        
        if (studentsWithMarks.length === 0) {
            return res.json({
                totalStudents: students.length,
                studentsWithMarks: 0,
                classAverage: 0,
                topScore: 0,
                passPercentage: 0,
                passedStudents: 0,
                failedStudents: 0
            });
        }
        
        // Calculate statistics
        const totals = studentsWithMarks.map(student => student.totalMarks);
        const classAverage = totals.reduce((sum, total) => sum + total, 0) / totals.length;
        const topScore = Math.max(...totals);
        const passedStudents = studentsWithMarks.filter(student => student.status === 'Pass' || student.percentage >= 40).length;
        const passPercentage = (passedStudents / studentsWithMarks.length) * 100;
        
        res.json({
            totalStudents: students.length,
            studentsWithMarks: studentsWithMarks.length,
            classAverage: Math.round(classAverage),
            topScore: topScore,
            passPercentage: Math.round(passPercentage),
            passedStudents: passedStudents,
            failedStudents: studentsWithMarks.length - passedStudents
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===============================
// 🔧 Helper Functions
// ===============================
// ===============================
// 🔧 Teacher Profile Helper Functions
// ===============================

// ===============================
// 🔧 Helper Functions
// ===============================

// Grade calculation helper
function calculateGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
}

function getGrade(marks) {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    if (marks >= 40) return 'D';
    return 'F';
}

// ===============================
// 🔧 Teacher Profile Helper Functions
// ===============================

function getDesignation(teacherName) {
    if (teacherName.includes('Prof.')) return 'Professor';
    if (teacherName.includes('Mr.')) return 'Senior Teacher';
    if (teacherName.includes('Ms.')) return 'Teacher';
    if (teacherName.includes('Mrs.')) return 'Senior Teacher';
    return 'Teacher';
}

function generateTeacherBadges(markedStudents, passPercentage, totalStudents) {
    const badges = [];
    
    // Efficiency badges
    if (markedStudents >= 15) {
        badges.push('efficient-evaluator');
    } else if (markedStudents >= 10) {
        badges.push('active-evaluator');
    }
    
    // Dedication badges
    if (markedStudents >= totalStudents * 0.8) { // 80% of students evaluated
        badges.push('dedicated-educator');
    }
    
    // Success rate badges
    if (passPercentage >= 90) {
        badges.push('academic-excellence');
    } else if (passPercentage >= 80) {
        badges.push('high-success-rate');
    } else if (passPercentage >= 70) {
        badges.push('consistent-performer');
    }
    
    // Activity badge
    if (markedStudents > 0) {
        badges.push('active-teacher');
    }
    
    // Default badge if no specific ones
    if (badges.length === 0) {
        badges.push('new-educator');
    }
    
    return badges;
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
    res.sendFile(path.join(__dirname, '../frontend/templates/student/view_rank.html'));
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

// Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/login.html'));
});

// Root route - redirect to login
app.get('/', (req, res) => {
    res.redirect('/login');
});
// Teacher Profile Page
app.get('/teacher/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/templates/Teacher/teacher_profile.html'));
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
const PORT = 5001;
app.listen(PORT, () => {
    console.log(`\n✅ Consolidated Student & Teacher Server running on http://localhost:${PORT}`);
    console.log(`\n🎓 Student Pages (Access via Live Server on port 5500):`);
    console.log(`   📊 Dashboard: http://127.0.0.1:5500/frontend/templates/student/Student_DashBoard.html`);
    console.log(`   📄 View Result: http://127.0.0.1:5500/frontend/templates/student/View_Result.html`);
    console.log(`   🏆 View Rank: http://127.0.0.1:5500/frontend/templates/student/view_rank.html`);
    console.log(`\n👩‍🏫 Teacher Pages (Access via Live Server on port 5500):`);
    console.log(`   📊 Dashboard: http://127.0.0.1:5500/frontend/templates/Teacher/Teacher_DashBoard.html`);
    console.log(`   ✏️  Marks Entry: http://127.0.0.1:5500/frontend/templates/Teacher/mark_entry.html`);
    console.log(`   🏆 Rankings: http://127.0.0.1:5500/frontend/templates/Teacher/teacher_rank.html`);
    console.log(`\n🔑 Login Page:`);
    console.log(`   🔐 Login: http://127.0.0.1:5500/frontend/templates/login.html`);
    console.log(`\n🔗 API Endpoints (Server running on port ${PORT}):`);
    console.log(`   🔐 Auth API: http://localhost:${PORT}/api/login`);
    console.log(`   🎓 Student APIs: http://localhost:${PORT}/api/student/:id, /api/result/:id, /api/rankings`);
    console.log(`   👩‍🏫 Teacher APIs: http://localhost:${PORT}/api/teacher/:id, /api/students, /api/statistics`);
    console.log(`\n📁 Data Files Used:`);
    console.log(`   ✅ Student.json, teacherData.json`);
    console.log(`\n🔐 Login Credentials (from your JSON files):`);
    console.log(`   👨‍🎓 Student: Use username/email and password from Student.json`);
    console.log(`   👩‍🏫 Teacher: Use username/email and password from teacherData.json`);
    console.log(`\n💡 Example Student Login:`);
    console.log(`   Username: bala_murugan_s20230045`);
    console.log(`   Password: Bala9677540588#`);
    console.log(`\n💡 Example Teacher Login:`);
    console.log(`   Username: sarah_johnson`);
    console.log(`   Password: Sarah@7284`);
});
