import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "2mb" }));

  app.get("/api/gemini-status", (req, res) => {
    const hasServerKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({ hasServerKey, model: "gemini-2.5-flash" });
  });

  // API route for translating Finnhub financial news or providing AI insights using Gemini
  app.post("/api/translate-news", async (req, res) => {
    try {
      const { items, prompt: directPrompt, summary } = req.body;

      const clientKey = (req.headers["x-gemini-api-key"] as string) || req.body.apiKey;
      const apiKey = clientKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ translated: null, reason: "NO_GEMINI_KEY" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      // Handle single query/prompt requests (e.g. AI Search Analysis)
      if (directPrompt || summary) {
        const queryPrompt = directPrompt || summary;
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: queryPrompt,
          });
          const text = response.text || "";
          return res.json({ translatedSummary: text, translatedHeadline: text });
        } catch (genError: any) {
          const fallbackResponse = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: queryPrompt,
          });
          const text = fallbackResponse.text || "";
          return res.json({ translatedSummary: text, translatedHeadline: text });
        }
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.json({ translated: [] });
      }

      const prompt = `Übersetze und fasse die folgenden Finanznachrichten auf Deutsch zusammen. Formatiere die Antwort strikt als valides JSON-Array, wobei jedes Objekt die originale 'id', eine prägnante deutsche 'headline' (Titel) und eine kurze deutsche 'summary' (maximal 2 Sätze) enthält. Behalte den präzisen Finanzkontext bei.

Input JSON:
${JSON.stringify(items)}`;

      let text = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        text = response.text || "";
      } catch (genError: any) {
        // Fallback to gemini-1.5-flash if primary model fails
        console.warn("Primary model gemini-2.5-flash failed, trying gemini-1.5-flash fallback:", genError?.message || genError);
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        text = fallbackResponse.text || "";
      }

      const cleanedText = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(cleanedText);
      return res.json({ translated: parsed });
    } catch (err: any) {
      console.error("News translation error:", err?.message || err);
      return res.json({ translated: null, error: err?.message || "Translation failed" });
    }
  });

  // Vite middleware for dev or static serving for production
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
