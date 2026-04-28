Brightways – Adaptive Learning Platform

Brightways is an interactive cognitive training platform designed to help users improve focus, memory, and learning abilities through engaging games and an AI-powered assistant.

---

 Features

 Interactive Games 
 
* Symbol Stream (Continuous Performance Test)
* Memory & Attention-based mini games
* Real-time scoring and feedback

 Adaptive Learning

* Difficulty adjusts based on user performance
* Tracks accuracy, reaction time, and progress

 AI Chat Assistant

* Helps users understand cognitive skills
* Suggests games based on needs
* Provides simple, friendly explanations

 Progress Tracking

* Leaderboard system
* Session history
* Performance analytics

---

 Tech Stack

 Frontend

* React + Vite
* Tailwind CSS
* Framer Motion

 Backend

* Node.js + Express
* REST APIs

 Database

* MySQL
* Drizzle ORM

 AI Integration

* Google Gemini API

---

 Project Structure

```
Brightways/
│
├── artifacts/
│   ├── cognilearn/        # Frontend (React)
│   └── api-server/        # Backend (Express)
│
├── lib/
│   └── db/                # Database schema & config
│
└── README.md
```

---

 Installation & Setup

 1. Clone the repository

```
git clone https://github.com/your-username/Adaptive-Learning.git
cd Adaptive-Learning
```

---

 2. Install dependencies

```
pnpm install
```

---

 3. Setup environment variables

Create `.env` inside:

```
artifacts/api-server/
```

Add:

```
PORT=5000
DATABASE_URL=mysql://root:your_password@localhost:3306/brightway
GEMINI_API_KEY=your_api_key_here
```

---

 4. Run the project

Frontend:

```
pnpm dev
```

Backend:

```
cd artifacts/api-server
pnpm dev
```

---

 Team Contributions

* *Frontend Development:* UI design, game interfaces, chatbot UI
* *Backend Development:* API routes, session handling, leaderboard
* *Database Management:* Schema design, MySQL integration
* *Integration & Testing:* Connecting frontend, backend, and AI

---

Future Improvements

* Personalized AI recommendations
* More cognitive games
* User authentication system
* Enhanced analytics dashboard

---

Objective

The goal of Brightways is to create a fun and engaging way to improve cognitive skills while providing personalized learning support through AI.

---

License

This project is for educational purposes.
