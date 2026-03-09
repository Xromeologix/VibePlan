import express from "express";
import session from "express-session";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("vibeplan.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    email TEXT,
    name TEXT,
    picture TEXT,
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
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
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: `${process.env.APP_URL}/auth/callback`,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };

    const qs = new URLSearchParams(options);
    res.json({ url: `${rootUrl}?${qs.toString()}` });
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
          redirect_uri: `${process.env.APP_URL}/auth/callback`,
          grant_type: "authorization_code",
        }),
      });

      const { access_token } = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

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
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).send("Authentication failed");
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
