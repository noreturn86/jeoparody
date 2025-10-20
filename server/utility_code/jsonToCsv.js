//utility function used to convert the inital json file from J! Archive into a csv for import into a postgresql table
import fs from "fs";
import { parse } from "json2csv";

const data = JSON.parse(fs.readFileSync("./data/jeopardy.json", "utf8"));

const cleaned = data.map(q => ({
  category: q.category,
  air_date: q.air_date || null,
  question: q.question,
  value: q.value ? parseInt(q.value.replace(/\$|,/g, ""), 10) : null,
  answer: q.answer,
  round: q.round || null,
  show_number: q.show_number ? parseInt(q.show_number, 10) : null
}));


const fields = ["category","air_date","question","value","answer","round","show_number"];
const csv = parse(cleaned, { fields });


fs.writeFileSync("./jeopardy.csv", csv);

console.log("CSV file created: jeopardy.csv");
