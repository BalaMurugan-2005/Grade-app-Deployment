// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 1. Serve frontend static files
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// ✅ 2. Get student info (like Student Dashboard)
app.get('/api/student/:id', (req, res) => {
  const studentId = req.params.id;
  const filePath = path.join(__dirname, './data/students.json');


  console.log("🧠 Looking for student file at:", filePath); // add this line!

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.error("❌ File read error:", err.message);
      return res.status(500).json({ error: 'Error reading student data' });
    }

    const students = JSON.parse(data);
    const student = students.find(s => s.id === studentId);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  });
});


// ✅ 3. Get result data (like View Result page)
app.get('/api/result/:id', (req, res) => {
  const studentId = req.params.id;
  const filePath = path.join(__dirname, './data/resultData.json');

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading result data' });
    }

    const result = JSON.parse(data);
    if (result.student.rollNo !== studentId) {
      return res.status(404).json({ message: 'Result not found for this student' });
    }

    res.json(result);
  });
});

// ✅ 4. Get ranking list (like View Rank page)
// ✅ Get ranking list (View Rank page)
// ✅ Get ranking list (View Rank page)
app.get('/api/rankings', (req, res) => {
  const filePath = path.join(__dirname, './data/rankData.json'); // 👈 fixed path

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading ranking data:', err);
      return res.status(500).json({ error: 'Error reading ranking data' });
    }

    try {
      const rankings = JSON.parse(data);
      res.json(rankings);
    } catch (e) {
      console.error('Invalid JSON format in rankData.json:', e);
      res.status(500).json({ error: 'Invalid ranking data format' });
    }
  });
});


// ✅ 5. Fallback route (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/templates/student/Student_DashBoard.html'));
});

// ✅ 6. Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
