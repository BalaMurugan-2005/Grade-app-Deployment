// ===============================
// ✅ Teacher Server (Combined)
// ===============================
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve frontend files
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// ===============================
// 📁 File Paths
// ===============================
const teacherDataPath = path.join(__dirname, 'data', 'teacher', 'teacherData.json');
const marksDataPath = path.join(__dirname, 'data', 'teacher', 'studentsMarks.json');

// ===============================
// 👩‍🏫 Fetch Teacher Profile
// ===============================
app.get('/api/teacher/:id', (req, res) => {
  const teacherId = req.params.id;

  fs.readFile(teacherDataPath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading teacher data:', err);
      return res.status(500).json({ error: 'Error reading teacher data' });
    }

    try {
      const teachers = JSON.parse(data);
      const teacher = teachers.find(t => t.id === teacherId);

      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      res.json(teacher);
    } catch (e) {
      console.error('Error parsing teacher data:', e);
      res.status(500).json({ error: 'Error parsing teacher data' });
    }
  });
});

// ===============================
// 🎓 Fetch All Students
// ===============================
app.get('/api/students', (req, res) => {
  fs.readFile(marksDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading student marks data:', err);
      return res.status(500).json({ error: 'Error reading student marks data' });
    }
    try {
      const students = JSON.parse(data);
      res.json(students);
    } catch (e) {
      console.error('Error parsing student marks JSON:', e);
      res.status(500).json({ error: 'Error parsing JSON' });
    }
  });
});

// ===============================
// 🎯 Fetch Single Student by ID
// ===============================
app.get('/api/student/:id', (req, res) => {
  const studentId = req.params.id;

  fs.readFile(marksDataPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error reading data' });
    const students = JSON.parse(data);
    const student = students.find(s => s.id === studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  });
});

// ===============================
// ✏️ Update Marks for a Student
// ===============================
app.post('/api/student/:id/marks', (req, res) => {
  const studentId = req.params.id;
  const { marks } = req.body;

  fs.readFile(marksDataPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error reading data' });

    let students = JSON.parse(data);
    const studentIndex = students.findIndex(s => s.id === studentId);

    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    students[studentIndex].marks = marks;

    fs.writeFile(marksDataPath, JSON.stringify(students, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Error saving marks' });
      res.json({ message: 'Marks updated successfully', student: students[studentIndex] });
    });
  });
});

// ===============================
// 🚀 Start Server
// ===============================
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`✅ Teacher server running on http://localhost:${PORT}`);
});
