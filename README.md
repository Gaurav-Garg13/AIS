# 🚀 StudyFlow: Your Ultimate Academic Sidekick

Hey there! 👋 Welcome to **StudyFlow**, a project I built to stop the "where did I put that assignment?" panic and actually start crushing my academic goals. It's more than just a planner—it's a full-blown mission control for students who want to stay ahead without losing their minds.

![StudyFlow Dashboard](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200)

## ✨ What's Inside?

*   **📊 Smart Dashboard**: A personalized greeting welcomes you every time you log in. See your overall stats and a GitHub-style **Activity Heatmap** of your upcoming deadlines at a glance.
*   **📚 Course Manager**: Keep track of all your subjects, credits, and instructors. I even added an **Attendance Tracker** for every course so you know exactly how many classes you can "safely" miss (don't tell the professors! 🤫).
*   **📝 Assignment Central**: A dedicated space to track your tasks. Start, progress, and complete assignments to earn "points" and watch your completion rate soar.
*   **🧠 AI Study Companion**: Stuck on a concept? The built-in AI companion is there to help you brainstorm or explain complex topics.
*   **🎯 Focus Hub**: Need to go into "Beast Mode"? Use the Deep Work toggle to minimize distractions and get things done.
*   **📈 Grades & Analytics**: Track your marks across subjects and visualize your academic growth.

## 🏗️ Project Structure

I've organized the code into two main hubs to keep things clean and modular:

```text
/
├── backend/        # Express + MongoDB (The Brains 🧠)
├── frontend/       # React + Vite + Tailwind (The Beauty ✨)
├── package.json    # Master controller for both
└── .env            # Secret keys (Don't peek!)
```

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Framer Motion (for those smooth animations), Tailwind CSS.
*   **Backend**: Node.js, Express, MongoDB (via Mongoose).
*   **Auth**: JWT & Google OAuth for secure, easy logins.

## 🚀 Getting Started

Want to run this locally? It's super easy:

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/yourusername/studyflow.git
    cd studyflow
    ```

2.  **Set up your `.env`**:
    Create a `.env` file in the root and add your `MONGODB_URI`, `JWT_SECRET`, and Google Client IDs.

3.  **Install everything**:
    ```bash
    npm install
    cd frontend && npm install
    cd ../backend && npm install
    ```

4.  **Run the magic**:
    From the root folder, just run:
    ```bash
    npm run dev
    ```
    This will launch both the frontend and the backend simultaneously! 🎆

## 🤝 Contributing

Got a cool idea for a feature? I'd love to see it! Feel free to fork the repo and submit a PR. Let's make studying suck a little less for everyone.

---
Built with ❤️ by a student, for students. Happy studying! 📖✨
