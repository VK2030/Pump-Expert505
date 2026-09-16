import express from "express";
import cors from "cors";
import loginHandler from "./_handlers/login.js";
import historyHandler from "./_handlers/history.js";
import configHandler from "./_handlers/config.js";
import questionsHandler from "./_handlers/quiz-questions.js";
import checkHandler from "./_handlers/quiz-check.js";
import viewsHandler from "./_handlers/quiz-views-increment.js";
import syncHandler from "./_handlers/admin-sync.js";
import telegramHandler from "./_handlers/telegram-send-summary.js";
import healthHandler from "./_handlers/health.js";
import testSupabaseHandler from "./_handlers/test-supabase.js";
import questionViewsHandler from "./_handlers/question-views.js";

const app = express();
app.use(cors());
// Safe body parser for Vercel Serverless environment
app.use((req: any, res: any, next: any) => {
  if (req.body) {
    if (Buffer.isBuffer(req.body)) {
      next();
    } else if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        console.warn("[API] Failed to parse string body in middleware:", e);
      }
      next();
    } else if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      next();
    } else {
      express.json({ limit: '1mb' })(req, res, next);
    }
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});

// Request logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Vercel URL Compatibility Middleware
app.use((req: any, res: any, next: any) => {
  let _path = req.query?._path || req.headers['x-matched-path'];
  
  if (!_path) {
    const match = req.url.match(/[?&]_path=([^&]+)/);
    if (match) {
      _path = decodeURIComponent(match[1]);
    }
  }

  if (_path) {
    let cleanPath = typeof _path === 'string' ? _path : _path[0];
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    if (cleanPath.startsWith('api/')) {
      cleanPath = cleanPath.substring(4);
    }
    
    const urlObj = new URL(req.url, 'http://localhost');
    urlObj.searchParams.delete('_path');
    const queryString = urlObj.search ? urlObj.search : '';
    req.url = `/api/${cleanPath}${queryString}`;
    console.log(`[API] Rewritten req.url to ${req.url}`);
  }
  next();
});

// Helper to adapt Vercel handler to Express
const adapt = (handler: any) => async (req: any, res: any) => {
  try {
    await handler(req, res);
  } catch (err: any) {
    console.error(`[API ERROR] ${req.method} ${req.url}:`, err);
    
    // Check if it's a fetch error to improve diagnostics
    if (err.message && err.message.includes('fetch failed')) {
      console.error("[DIAGNOSTIC] This fetch error likely occurred during a Supabase request from the server-side.");
      console.error("[DIAGNOSTIC] Check if SUPABASE_URL is correct and accessible from this environment.");
    }

    if (!res.headersSent) {
      res.status(500).json({ 
        error: err.message || "Unknown error",
        path: req.url,
        method: req.method
      });
    }
  }
};

// Routes
const registerRoutes = (app: any, prefix = "") => {
  app.post(`${prefix}/login`, adapt(loginHandler));
  app.all(`${prefix}/history`, adapt(historyHandler));
  app.all(`${prefix}/config`, adapt(configHandler));
  app.get(`${prefix}/quiz/questions/:moduleId`, (req: any, res: any) => {
    req.query.moduleId = req.params.moduleId;
    return adapt(questionsHandler)(req, res);
  });
  app.post(`${prefix}/quiz/check`, adapt(checkHandler));
  app.post(`${prefix}/quiz/views/increment`, adapt(viewsHandler));
  app.post(`${prefix}/admin/sync`, adapt(syncHandler));
  app.post(`${prefix}/telegram/send-summary`, adapt(telegramHandler));
  app.get(`${prefix}/question-views`, adapt(questionViewsHandler));
  app.get(`${prefix}/health`, adapt(healthHandler));
  app.get(`${prefix}/test-supabase`, adapt(testSupabaseHandler));
};

registerRoutes(app, "/api");
registerRoutes(app, "");

// Fallback for legacy or other paths
app.use("/api/*", (req, res) => {
  console.warn(`[API] 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "API Route not found" });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[API] Global Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

export default app;
