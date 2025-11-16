import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config({ path: ".env.development" });
}

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
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });



async function generateTTS(text, voice = "echo") {
  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: voice,
    input: text
  });

  //convert to Buffer
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  return audioBuffer;
}


app.post("/api/comment", async (req, res) => {
  try {
    const { contextDescription, voice } = req.body;
    if (!contextDescription) return res.status(400).json({ error: "Missing 'contextDescription' field" });

    //ai-generated comment text
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a lively, witty trivia game show host." },
        {
          role: "user",
          content: `Respond with one short, natural line that fits this situation: ${contextDescription}`
        }
      ],
      max_tokens: 50,
      temperature: 0.9,
    });

    const comment = completion.choices[0]?.message?.content?.trim() || "Let's keep things moving!";

    const audioBuffer = await generateTTS(comment, voice);
    res.set("Content-Type", "audio/mpeg");
    res.set("X-Comment-Text", encodeURIComponent(comment));
    return res.send(audioBuffer);

  } catch (err) {
    console.error("Comment generation error:", err);
    res.status(500).json({ error: "Failed to generate host comment" });
  }
});


app.post("/api/wrong", async (req, res) => {
  try {
    const { question, answer } = req.body;

    // AI-generated incorrect answer comment
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a contestant on a game show who just got a question incorrect."
        },
        {
          role: "user",
          content: `The question was "${question}" and the correct answer is "${answer}". 
          Give an incorrect answer to the question, which may be close but not correct. Give only text representing the wrong answer, with no additional comment.`
        }
      ],
      max_tokens: 20,
      temperature: 0.9,
    });

    const comment = completion.choices[0]?.message?.content?.trim() || "";

    // Return as JSON
    res.json({ comment });

  } catch (err) {
    console.error("Wrong answer comment generation error:", err);
    res.status(500).json({ error: "Failed to generate host comment" });
  }
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

app.post("/api/tts", async (req, res) => {
  try {
    const { text, selectedVoice } = req.body;
    if (!text) return res.status(400).send("Missing 'text' field");

    const audioBuffer = await generateTTS(text, selectedVoice); // your TTS function

    res.set("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).send("TTS generation failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
