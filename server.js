const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection config
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Fill your MySQL root password
  database: 'student_management'
};

// Connect pool
let pool;
(async () => {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log('MySQL connected...');
  } catch (err) {
    console.error('Error connecting to MySQL:', err);
  }
})();

// Create students table if it doesn't exist
app.listen(PORT, async () => {
  try {
    const createTableQuery = \`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age INT NOT NULL,
        className VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL
      );
    \`;
    await pool.query(createTableQuery);
    console.log('Student table ensured');

    console.log(\`Server running on port \${PORT}\`);
  } catch (err) {
    console.error('Error ensuring table:', err);
  }
});

// Get all students
app.get('/students', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Add new student
app.post('/students', async (req, res) => {
  const { name, age, className, email } = req.body;
  if (!name || !age || !className || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO students (name, age, className, email) VALUES (?, ?, ?, ?)',
      [name, age, className, email]
    );
    const insertedId = result.insertId;
    const [student] = await pool.query('SELECT * FROM students WHERE id = ?', [insertedId]);
    res.status(201).json(student[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Update student by id
app.put('/students/:id', async (req, res) => {
  const id = req.params.id;
  const { name, age, className, email } = req.body;
  if (!name || !age || !className || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE students SET name = ?, age = ?, className = ?, email = ? WHERE id = ?',
      [name, age, className, email, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const [student] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    res.json(student[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student by id
app.delete('/students/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

