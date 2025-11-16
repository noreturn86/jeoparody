//utility script used to import the csv (created from the initial J! Archive JSON file) in a postgresql table
import fs from "fs";
import pkg from "pg";
import csv from "csv-parser";
const { Pool } = pkg;

// PostgreSQL connection
const pool = new Pool({
  user: "jeopardy_user",
  host: "localhost",
  database: "jeopardy",
  password: "yourpassword",
  port: 5432
});

// Helper to clean value column
function parseValue(val) {
  return val ? parseInt(val.replace(/\$|,/g, ""), 10) : null;
}

// Batch size for inserts
const BATCH_SIZE = 1000;

async function importCsv() {
  const rows = [];
  let total = 0;

  const stream = fs.createReadStream("./jeopardy.csv").pipe(csv());

  for await (const row of stream) {
    rows.push([
      row.category,
      row.air_date || null,
      row.question,
      parseValue(row.value),
      row.answer,
      row.round || null,
      row.show_number ? parseInt(row.show_number, 10) : null
    ]);

    if (rows.length >= BATCH_SIZE) {
      await batchInsert(rows);
      total += rows.length;
      console.log(`Inserted ${total} rows...`);
      rows.length = 0; // clear array
    }
  }

  // Insert any remaining rows
  if (rows.length > 0) {
    await batchInsert(rows);
    total += rows.length;
    console.log(`Inserted ${total} rows...`);
  }

  await pool.end();
  console.log("All rows imported!");
}

// Batch insert function
async function batchInsert(batch) {
  const values = [];
  const params = [];

  batch.forEach((row, i) => {
    const idx = i * 7;
    values.push(
      `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7})`
    );
    params.push(...row);
  });

  const query = `
    INSERT INTO questions
      (category, air_date, question, value, answer, round, show_number)
    VALUES ${values.join(",")}
  `;
  await pool.query(query, params);
}

// Run the import
importCsv().catch(console.error);
