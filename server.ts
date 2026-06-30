import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  prioritizeTasks,
  planSchedule,
  getRecommendations,
  getContextReminder,
  generateCalendarEvents,
  deconstructGoal,
  processVoiceTranscription,
  planAutonomousGoal
} from "./src/geminiService";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Last Minute Life Saver backend is live." });
  });

  // Helper check for API Key
  const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      return res.status(500).json({
        error: "Gemini API key is not configured. Please add it to your Secrets under Settings in AI Studio."
      });
    }
    next();
  };

  // 1. Task Prioritization Endpoint
  app.post("/api/prioritize", checkApiKey, async (req, res) => {
    try {
      const { tasks } = req.body;
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: "tasks parameter must be an array" });
      }
      const result = await prioritizeTasks(tasks);
      res.json(result);
    } catch (error: any) {
      console.error("Error prioritizing tasks:", error);
      res.status(500).json({ error: error.message || "An error occurred while prioritizing tasks." });
    }
  });

  // 2. AI Daily Planner Endpoint
  app.post("/api/planner", checkApiKey, async (req, res) => {
    try {
      const { tasks, routine, preferences, availableTime, currentTime } = req.body;
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: "tasks parameter must be an array" });
      }
      const result = await planSchedule({ tasks, routine, preferences, availableTime, currentTime });
      res.json(result);
    } catch (error: any) {
      console.error("Error planning schedule:", error);
      res.status(500).json({ error: error.message || "An error occurred while creating daily plan." });
    }
  });

  // 3. Personalized Productivity Recommendations Endpoint
  app.post("/api/recommendations", checkApiKey, async (req, res) => {
    try {
      const { workingStyle, painPoints, dailyHabits } = req.body;
      const result = await getRecommendations({ workingStyle, painPoints, dailyHabits });
      res.json(result);
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ error: error.message || "An error occurred while generating recommendations." });
    }
  });

  // 4. Context-Aware Reminders Endpoint
  app.post("/api/context-reminders", checkApiKey, async (req, res) => {
    try {
      const { environment, currentTime, focusMode, deviceState, pendingTasks } = req.body;
      const result = await getContextReminder({ environment, currentTime, focusMode, deviceState, pendingTasks });
      res.json(result);
    } catch (error: any) {
      console.error("Error generating reminder:", error);
      res.status(500).json({ error: error.message || "An error occurred while generating reminder." });
    }
  });

  // 5. Calendar Events Endpoint
  app.post("/api/calendar-events", checkApiKey, async (req, res) => {
    try {
      const { tasks } = req.body;
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: "tasks parameter must be an array" });
      }
      const result = await generateCalendarEvents(tasks);
      res.json(result);
    } catch (error: any) {
      console.error("Error generating calendar events:", error);
      res.status(500).json({ error: error.message || "An error occurred while building calendar events." });
    }
  });

  // 6. Goal and Habit Deconstruction Endpoint
  app.post("/api/habit-architect", checkApiKey, async (req, res) => {
    try {
      const { goal, streak } = req.body;
      const result = await deconstructGoal({ goal, streak: streak || 0 });
      res.json(result);
    } catch (error: any) {
      console.error("Error deconstructing goal:", error);
      res.status(500).json({ error: error.message || "An error occurred while architecting habits." });
    }
  });

  // 7. Voice Enabled Assistance Endpoint
  app.post("/api/voice-assistant", checkApiKey, async (req, res) => {
    try {
      const { transcription } = req.body;
      if (!transcription) {
        return res.status(400).json({ error: "transcription parameter is required" });
      }
      const resultText = await processVoiceTranscription(transcription);
      res.json({ response: resultText });
    } catch (error: any) {
      console.error("Error processing voice prompt:", error);
      res.status(500).json({ error: error.message || "An error occurred while processing voice." });
    }
  });

  // 8. Autonomous Task Planning Endpoint
  app.post("/api/autonomous-agent", checkApiKey, async (req, res) => {
    try {
      const { goal } = req.body;
      if (!goal) {
        return res.status(400).json({ error: "goal parameter is required" });
      }
      const result = await planAutonomousGoal(goal);
      res.json(result);
    } catch (error: any) {
      console.error("Error creating autonomous roadmap:", error);
      res.status(500).json({ error: error.message || "An error occurred while building roadmap." });
    }
  });

  // Vite middleware for development or serving static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
