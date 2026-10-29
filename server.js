const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: "AI अभी कनेक्ट नहीं है। वेबसाइट के Environment Variables में GEMINI_API_KEY जोड़ें।"
      });
    }

    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const contents = messages
      .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .slice(-20)
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content.slice(0, 6000) }]
      }));

    if (!contents.length || contents[contents.length - 1].role !== "user") {
      return res.status(400).json({ error: "पहले अपना सवाल लिखें।" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are Personal AI, a helpful, friendly assistant. Reply in the language the user uses, especially simple Hindi when they write Hindi. Be accurate and clear." }]
          },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      const detail = data?.error?.message || "AI सेवा से जवाब नहीं मिला।";
      return res.status(response.status).json({ error: detail });
    }
    const answer = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
    if (!answer) return res.status(502).json({ error: "AI से खाली जवाब मिला। कृपया दोबारा कोशिश करें।" });
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: "कनेक्शन में समस्या है। इंटरनेट जाँचकर फिर कोशिश करें।" });
  }
});


// Text-to-video generation via Replicate. Keep the token on the server only.
app.post("/api/video", async (req, res) => {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return res.status(503).json({
        error: "AI वीडियो अभी कनेक्ट नहीं है। Render की Environment सेटिंग में REPLICATE_API_TOKEN जोड़ना होगा।"
      });
    }
    const prompt = typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "वीडियो का वर्णन लिखें।" });
    if (prompt.length > 1200) return res.status(400).json({ error: "वर्णन 1200 अक्षरों से छोटा रखें।" });

    const response = await fetch("https://api.replicate.com/v1/models/minimax/video-01/predictions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "Prefer": "wait=1"
      },
      body: JSON.stringify({ input: { prompt } })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.detail || data?.title || "वीडियो सेवा ने अनुरोध स्वीकार नहीं किया। API key और quota जाँचें।" });
    }
    res.json({ id: data.id, status: data.status, output: data.output || null, urls: data.urls || null });
  } catch (err) {
    res.status(500).json({ error: "वीडियो सेवा से कनेक्शन नहीं हो पाया। इंटरनेट और API सेटिंग जाँचें।" });
  }
});

app.get("/api/video/:id", async (req, res) => {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return res.status(503).json({ error: "वीडियो API key सेट नहीं है।" });
    const id = String(req.params.id || "");
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return res.status(400).json({ error: "गलत video job ID है।" });
    const response = await fetch("https://api.replicate.com/v1/predictions/" + encodeURIComponent(id), {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.detail || "वीडियो की स्थिति नहीं मिल पाई।" });
    res.json({ id: data.id, status: data.status, output: data.output || null, error: data.error || null });
  } catch (err) {
    res.status(500).json({ error: "वीडियो की स्थिति जाँचते समय कनेक्शन में समस्या हुई।" });
  }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`Personal AI running on port ${PORT}`));