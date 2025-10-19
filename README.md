# 🧠 Jeoparody  
*A realistic Jeopardy-style trivia game for fun and practice.*

---

## 🎯 Overview

**Jeoparody** is a full-stack trivia game inspired by the classic TV show *Jeopardy!*  
It uses real historical questions sourced from the **J! Archive**, converted into a PostgreSQL database. The app fetches questions dynamically via a **Node.js/Express** backend and presents them in a realistic Jeopardy game board through a **React + Tailwind CSS** frontend.

The goal is to create an authentic Jeopardy gameplay experience suitable for both casual fun and serious practice.

---

## ⚙️ Tech Stack

### **Backend**
- **Node.js / Express** — REST API for question retrieval  
- **PostgreSQL** — Stores Jeopardy categories, clues, and answers  
- **pg** — PostgreSQL client for Node.js  
- **CSV → JSON → DB import** pipeline (from J! Archive data)

### **Frontend**
- **React (Vite)** — Interactive UI and board rendering  
- **Tailwind CSS** — Clean, responsive styling  
- **Axios** — API calls to fetch questions from the backend

---

## 🧩 Features (Current)

✅ Fetches a random Jeopardy question from the database  
✅ Displays categories, clue text, and dollar values  
✅ Simple game board layout in React/Tailwind  
✅ Clean and responsive UI  

---

## 🚧 Upcoming Features

🚀 Generate full 6×5 Jeopardy boards (6 categories × 5 clues)  
🎯 Implement Single, Double, and Final Jeopardy rounds  
💰 Track player scores and daily doubles  
⏱️ Timers and buzz-in system  
🧑‍🤝‍🧑 Multiplayer or versus mode  
📊 Stats and session tracking  
🧮 Game state persistence (via local storage or database)  
🎨 Sound effects and animations for authentic feel  

---

## 🗃️ Database Structure

| Table | Description |
|--------|--------------|
| `questions` | Stores all Jeopardy questions with category, clue, answer, value, and round info |
| `categories` | Stores category names and metadata |
| `games` *(future)* | Will store full game boards and player progress |

Each game round follows Jeopardy’s classic format:

| Round | Categories | Clues per Category | Dollar Values |
|--------|-------------|--------------------|----------------|
| **Single Jeopardy** | 6 | 5 | $200–$1,000 |
| **Double Jeopardy** | 6 | 5 | $400–$2,000 |
| **Final Jeopardy** | 1 | 1 | Wager-based |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|-----------|--------------|
| `GET` | `/api/random-question` | Fetches one random question from the DB |
| *(planned)* | `/api/board` | Fetches a full 6×5 Jeopardy board |
| *(planned)* | `/api/final` | Fetches a Final Jeopardy question |

---

## 🧱 Setup Instructions

### 1. Clone the repository
git clone https://github.com/yourusername/jeoparody.git
cd jeoparody


### 2. Install dependencies
# Backend
cd server
npm install

# Frontend
cd ../client
npm install


### 3. Configure PostgreSQL
DATABASE_URL=postgres://username:password@localhost:5432/jeoparody


### 4. Import Data
node importCsv.js


### 5. Run the servers
# Backend
cd server
node server.js

# Frontend
cd ../client
npm run dev


Visit http://localhost:5173


Development Notes
Node.js version: 18+
PostgreSQL version: 14+
Frontend port: 5173
Backend port: 3001
CORS is enabled for local development.


Credits
J! Archive (https://j-archive.com) — Source of Jeopardy clues and categories
Jeopardy! — Property of Sony Pictures Television

## Disclaimer
# This project is a fan-made parody for educational and recreational purposes only.