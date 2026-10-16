
const express = require("express");
const cors = require("cors");

const app = express();

// Allow the frontend (e.g. Live Server on 127.0.0.1:5500) to call this API
app.use(cors());

// Serve your existing portfolio files
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

// Homepage
app.get("/", (req, res) => {
    res.send("Hello! My portfolio backend is working.");
});

// Projects API

app.get("/api/projects", (req, res) => {
    const projects = [
        {
            name: "BullyMirror",
            description: "A web-based project designed to address online bullying through an interactive and user-focused experience.",
            technologies: ["HTML", "CSS", "JavaScript"],
            image: "images/project1.jpg.png",
            liveDemo: "https://sarvesh3434.github.io/BullyMirror/",
            github: "https://github.com/Sarvesh3434/BullyMirror"
        },
        {
            name: "CampOS",
            description: "A full-stack academic management platform where admins, faculty, and students work with live data from a real SQLite database through an Express API.",
            technologies: ["React", "Node.js", "Express", "SQLite", "Tailwind CSS", "JWT"],
            image: "images/project2.jpg.png",
            liveDemo: "https://sarvesh3434.github.io/CampOS/",
            github: "https://github.com/Sarvesh3434/CampOS"
        },
        {
            name: "P-LENS",
            description: "A research project where a GRU model forecasts traffic stress and a controller applies budgeted add, prune, and rewire mutations to evolve the network topology.",
            technologies: ["Python", "PyTorch", "NetworkX", "scikit-learn"],
            image: "images/project3.jpg.png.png",
            liveDemo: "",
            github: "https://github.com/Sarvesh3434/P-LENS"
        }
    ];

    res.json(projects);
});


// Start the server
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
