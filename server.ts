import express from "express";
import session from "express-session";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("vibeplan.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    picture TEXT,
    password_hash TEXT,
    credits_used INTEGER DEFAULT 0,
    monthly_limit INTEGER DEFAULT 100
  );

  CREATE TABLE IF NOT EXISTS spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    platform TEXT,
    icon TEXT,
    color TEXT,
    archived INTEGER DEFAULT 0,
    last_updated TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    space_id INTEGER,
    title TEXT,
    summary TEXT,
    mermaid TEXT,
    type TEXT,
    created_at TEXT,
    progress_json TEXT,
    FOREIGN KEY(space_id) REFERENCES spaces(id)
  );
`);

const APP_URL = (process.env.APP_URL || "").replace(/\/$/, "");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1); // Trust the first proxy (Nginx/Cloudflare)
  
  // Enable CORS for the Cloudflare domain
  app.use(cors({
    origin: [
      "https://vibeplan.pages.dev",
      "https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app",
      "https://ais-pre-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app",
      "http://localhost:3000"
    ],
    credentials: true
  }));

  // Explicitly allow popups to communicate with the main window (fixes COOP issues)
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
    next();
  });

  app.use(express.json());
  
  // Email/Password Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    try {
      const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (existingUser) return res.status(400).json({ error: "User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare(
        "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)"
      ).run(email, hashedPassword, name || email.split("@")[0]);

      (req.session as any).userId = result.lastInsertRowid;
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      res.json(user);
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (!user || !user.password_hash) return res.status(401).json({ error: "Invalid credentials" });

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

      (req.session as any).userId = user.id;
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "vibeplan-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        sameSite: "none",
        httpOnly: true,
      },
    })
  );

  // Auth Routes
  app.get("/api/auth/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error("Missing GOOGLE_CLIENT_ID");
      return res.status(500).json({ 
        error: "GOOGLE_CLIENT_ID is missing. Please check your AI Studio Settings -> Environment Variables." 
      });
    }

    if (!APP_URL) {
      console.error("Missing APP_URL");
      return res.status(500).json({ 
        error: "APP_URL is missing. Please set it to your website URL in AI Studio Settings." 
      });
    }

    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: `${APP_URL}/auth/callback`,
      client_id: clientId,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };

    const qs = new URLSearchParams(options);
    const url = `${rootUrl}?${qs.toString()}`;
    console.log("Generated Auth URL for Client ID:", clientId.substring(0, 10) + "...");
    res.json({ url });
  });

  app.get("/auth/callback", async (req, res) => {
    const code = req.query.code as string;
    if (!code) return res.status(400).send("No code provided");

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${APP_URL}/auth/callback`,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("Token exchange failed:", errorData);
        return res.status(500).send(`Token exchange failed: ${errorData}`);
      }

      const { access_token } = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      if (!userResponse.ok) {
        return res.status(500).send("Failed to get user info");
      }

      const googleUser = await userResponse.json();

      // Upsert user
      let user = db
        .prepare("SELECT * FROM users WHERE google_id = ?")
        .get(googleUser.sub) as any;

      if (!user) {
        const result = db
          .prepare(
            "INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)"
          )
          .run(googleUser.sub, googleUser.email, googleUser.name, googleUser.picture);
        user = {
          id: result.lastInsertRowid,
          google_id: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          credits_used: 0,
          monthly_limit: 100,
        };
      }

      (req.session as any).userId = user.id;

      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #eee;">
              <h2 style="color: #4f46e5; margin-bottom: 0.5rem;">Authentication Successful</h2>
              <p style="color: #64748b; font-size: 0.875rem;">Syncing your vibes... this window will close shortly.</p>
              <script>
                setTimeout(() => {
                  if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                    window.close();
                  } else {
                    window.location.href = '/';
                  }
                }, 1000);
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).send(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    res.json(user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Data Routes
  app.get("/api/spaces", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const spaces = db.prepare("SELECT * FROM spaces WHERE user_id = ?").all(userId) as any[];
    
    const spacesWithIdeas = spaces.map(space => {
      const ideas = db.prepare("SELECT * FROM ideas WHERE space_id = ?").all(space.id) as any[];
      return {
        ...space,
        archived: !!space.archived,
        ideas: ideas.map(idea => ({
          ...idea,
          progress: idea.progress_json ? JSON.parse(idea.progress_json) : undefined
        }))
      };
    });

    res.json(spacesWithIdeas);
  });

  app.post("/api/spaces", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { name, platform, icon, color, archived, lastUpdated } = req.body;
    const result = db.prepare(
      "INSERT INTO spaces (user_id, name, platform, icon, color, archived, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(userId, name, platform, icon, color, archived ? 1 : 0, lastUpdated);

    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/spaces/:id", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { name, icon, archived, lastUpdated } = req.body;
    db.prepare(
      "UPDATE spaces SET name = ?, icon = ?, archived = ?, last_updated = ? WHERE id = ? AND user_id = ?"
    ).run(name, icon, archived ? 1 : 0, lastUpdated, req.params.id, userId);

    res.json({ success: true });
  });

  app.post("/api/spaces/:id/ideas", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { title, summary, mermaid, type, createdAt, progress } = req.body;
    const result = db.prepare(
      "INSERT INTO ideas (space_id, title, summary, mermaid, type, created_at, progress_json) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(req.params.id, title, summary, mermaid, type, createdAt, progress ? JSON.stringify(progress) : null);

    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/ideas/:id", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { progress } = req.body;
    db.prepare(
      "UPDATE ideas SET progress_json = ? WHERE id = ? AND space_id IN (SELECT id FROM spaces WHERE user_id = ?)"
    ).run(JSON.stringify(progress), req.params.id, userId);

    res.json({ success: true });
  });

  app.put("/api/user/credits", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { credits_used } = req.body;
    db.prepare("UPDATE users SET credits_used = ? WHERE id = ?").run(credits_used, userId);
    res.json({ success: true });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
