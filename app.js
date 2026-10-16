const path = require("path");
const crypto = require("crypto");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const app = express();

const PUBLIC_DIR = path.join(__dirname, "public");

// ---------------------------------------------------------------------------
// Configuration (see .env.example)
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

const LOCAL_USERNAME = process.env.LOCAL_USERNAME || "Sarvesh";
const LOCAL_PASSWORD = process.env.LOCAL_PASSWORD || "123456789";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GITHUB_CALLBACK_URL =
    process.env.GITHUB_CALLBACK_URL ||
    `http://localhost:${PORT}/auth/github/callback`;

const githubConfigured = Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.set("trust proxy", 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(
    session({
        name: "portfolio.sid",
        secret: process.env.SESSION_SECRET || "dev-only-secret-change-me",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 // 1 day
        }
    })
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function safeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string") {
        return false;
    }

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    if (bufferA.length !== bufferB.length) {
        return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
}

function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }

    if (req.path.startsWith("/api/")) {
        return res.status(401).json({ authenticated: false });
    }

    return res.redirect("/login");
}

function githubHeaders(token) {
    const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "sarvesh-portfolio"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

// ---------------------------------------------------------------------------
// Auth routes (public)
// ---------------------------------------------------------------------------
app.get(["/login", "/login.html"], (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect("/");
    }

    res.sendFile(path.join(PUBLIC_DIR, "login.html"));
});

app.post("/api/login", (req, res) => {
    const { username, password } = req.body || {};

    const valid =
        safeEqual(username, LOCAL_USERNAME) &&
        safeEqual(password, LOCAL_PASSWORD);

    if (!valid) {
        return res
            .status(401)
            .json({ ok: false, error: "Invalid username or password." });
    }

    req.session.user = {
        provider: "local",
        name: "Sarvesh",
        username: LOCAL_USERNAME,
        avatar: null,
        email: null
    };

    res.json({ ok: true, user: req.session.user });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("portfolio.sid");
        res.json({ ok: true });
    });
});

app.get("/api/me", (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ authenticated: true, user: req.session.user });
    }

    res.status(401).json({ authenticated: false });
});

app.get("/api/config", (req, res) => {
    res.json({ githubEnabled: githubConfigured });
});

// ---------------------------------------------------------------------------
// GitHub OAuth
// ---------------------------------------------------------------------------
app.get("/auth/github", (req, res) => {
    if (!githubConfigured) {
        return res.redirect("/login?error=github_unavailable");
    }

    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;

    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: GITHUB_CALLBACK_URL,
        scope: "read:user user:email",
        state
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get("/auth/github/callback", async (req, res) => {
    if (!githubConfigured) {
        return res.redirect("/login?error=github_unavailable");
    }

    const { code, state } = req.query;

    if (!state || state !== req.session.oauthState) {
        return res.redirect("/login?error=state");
    }

    delete req.session.oauthState;

    if (!code) {
        return res.redirect("/login?error=denied");
    }

    try {
        const tokenResponse = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: GITHUB_CALLBACK_URL
                })
            }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            return res.redirect("/login?error=token");
        }

        const userResponse = await fetch("https://api.github.com/user", {
            headers: githubHeaders(tokenData.access_token)
        });

        const githubUser = await userResponse.json();

        let email = githubUser.email;

        if (!email) {
            const emailResponse = await fetch(
                "https://api.github.com/user/emails",
                { headers: githubHeaders(tokenData.access_token) }
            );

            const emails = await emailResponse.json();

            if (Array.isArray(emails)) {
                const primary = emails.find((item) => item.primary) || emails[0];
                email = primary ? primary.email : null;
            }
        }

        req.session.user = {
            provider: "github",
            name: githubUser.name || githubUser.login,
            username: githubUser.login,
            avatar: githubUser.avatar_url,
            email: email || null
        };

        res.redirect("/");
    } catch (error) {
        console.error("GitHub OAuth failed:", error.message);
        res.redirect("/login?error=github");
    }
});

// ---------------------------------------------------------------------------
// Protected portfolio page
// ---------------------------------------------------------------------------
app.get(["/", "/index.html"], requireAuth, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// ---------------------------------------------------------------------------
// Projects API (protected)
// ---------------------------------------------------------------------------
app.get("/api/projects", requireAuth, (req, res) => {
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

// ---------------------------------------------------------------------------
// Protect private assets, then serve public files
// ---------------------------------------------------------------------------
const PROTECTED_FILES = ["/style.css", "/script.js"];
const PROTECTED_PREFIXES = ["/images/", "/assets/"];

app.use((req, res, next) => {
    const isProtected =
        PROTECTED_FILES.includes(req.path) ||
        PROTECTED_PREFIXES.some((prefix) => req.path.startsWith(prefix));

    if (isProtected) {
        return requireAuth(req, res, next);
    }

    next();
});

app.use(express.static(PUBLIC_DIR, { index: false }));

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);

    if (githubConfigured) {
        console.log("GitHub OAuth: enabled");
    } else {
        console.log(
            "GitHub OAuth: disabled (set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env)"
        );
    }
});
