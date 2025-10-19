import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
});

app.get("/api/random", async (req, res) => {
  try {
    const idResult = await pool.query("SELECT MIN(id) AS min_id, MAX(id) AS max_id FROM questions");
    const minId = idResult.rows[0].min_id;
    const maxId = idResult.rows[0].max_id;
    const randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;

    const questionResult = await pool.query(
      "SELECT * FROM questions WHERE id >= $1 LIMIT 1",
      [randomId]
    );

    res.json(questionResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch random question" });
  }
});

app.get("/api/board", async (req, res) => {
  try {
    const qResult = await pool.query(`
      WITH random_cats AS (
          SELECT category
          FROM (SELECT DISTINCT category FROM questions) AS distinct_categories
          ORDER BY RANDOM()
          LIMIT 6
      ),
      numbered AS (
          SELECT q.*,
                 ROW_NUMBER() OVER (PARTITION BY q.category ORDER BY RANDOM()) AS rn
          FROM questions q
          JOIN random_cats rc ON q.category = rc.category
      )
      SELECT *
      FROM numbered
      WHERE rn <= 5
      ORDER BY category, rn;
    `);

    const board = {};
    qResult.rows.forEach(row => {
      if (!board[row.category]) board[row.category] = [];
      board[row.category].push({
        id: row.id,
        question: row.question,
        answer: row.answer,
        value: row.value,
        round: row.round,
        show_number: row.show_number,
        air_date: row.air_date,
      });
    });

    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch board" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
