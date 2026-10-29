const form = document.getElementById("chatForm");
const promptBox = document.getElementById("prompt");
const messagesEl = document.getElementById("messages");
const sendButton = document.getElementById("send");
const welcome = document.getElementById("welcome");
let history = [];

function addBubble(role, text, extraClass = "") {
  if (welcome && welcome.isConnected) welcome.remove();
  const div = document.createElement("div");
  div.className = `bubble ${role} ${extraClass}`.trim();
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => {
    promptBox.value = button.textContent;
    promptBox.focus();
  });
});

document.getElementById("newChat").addEventListener("click", () => {
  history = [];
  messagesEl.innerHTML = "";
  const div = document.createElement("div");
  div.className = "welcome";
  div.innerHTML = '<div class="big-spark">✦</div><h2>नमस्ते! मैं Personal AI हूँ 👋</h2><p>मुझसे पढ़ाई, सामान्य ज्ञान या किसी भी सवाल के बारे में पूछो।</p>';
  messagesEl.appendChild(div);
});

promptBox.addEventListener("input", () => {
  promptBox.style.height = "auto";
  promptBox.style.height = Math.min(promptBox.scrollHeight, 150) + "px";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = promptBox.value.trim();
  if (!text || sendButton.disabled) return;
  history.push({ role: "user", content: text });
  addBubble("user", text);
  promptBox.value = "";
  promptBox.style.height = "auto";
  sendButton.disabled = true;
  const typing = addBubble("assistant", "Personal AI जवाब सोच रहा है…", "typing");
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    });
    const data = await response.json();
    typing.remove();
    if (!response.ok) {
      addBubble("assistant", data.error || "अभी जवाब नहीं मिल पाया।", "error");
      history.pop();
    } else {
      history.push({ role: "assistant", content: data.answer });
      addBubble("assistant", data.answer);
    }
  } catch (err) {
    typing.remove();
    addBubble("assistant", "सर्वर से कनेक्शन नहीं हो पाया। कृपया इंटरनेट और वेबसाइट की सेटिंग जाँचें।", "error");
    history.pop();
  } finally {
    sendButton.disabled = false;
    promptBox.focus();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

// Tab navigation
const chatTab = document.getElementById("chatTab");
const videoTab = document.getElementById("videoTab");
const chatPanel = document.getElementById("chatPanel");
const videoPanel = document.getElementById("videoPanel");
function showPanel(which) {
  const isChat = which === "chat";
  chatPanel.hidden = !isChat;
  videoPanel.hidden = isChat;
  chatTab.classList.toggle("active", isChat);
  videoTab.classList.toggle("active", !isChat);
}
chatTab.addEventListener("click", () => showPanel("chat"));
videoTab.addEventListener("click", () => showPanel("video"));

const videoForm = document.getElementById("videoForm");
const videoPrompt = document.getElementById("videoPrompt");
const generateVideo = document.getElementById("generateVideo");
const videoStatus = document.getElementById("videoStatus");
const videoResult = document.getElementById("videoResult");

function getOutputUrl(output) {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output.find(x => typeof x === "string" && /^https?:\/\//.test(x)) || "";
  if (output && typeof output === "object") {
    for (const value of Object.values(output)) {
      const url = getOutputUrl(value);
      if (url) return url;
    }
  }
  return "";
}

async function watchVideoJob(id) {
  for (let attempt = 0; attempt < 90; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const response = await fetch("/api/video/" + encodeURIComponent(id));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "वीडियो की स्थिति नहीं मिल पाई।");
    if (data.status === "succeeded") {
      const url = getOutputUrl(data.output);
      if (!url) throw new Error("वीडियो तैयार हुआ, लेकिन उसका लिंक नहीं मिला।");
      videoResult.innerHTML = "";
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.src = url;
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "वीडियो खोलें / सेव करें";
      videoResult.append(video, link);
      videoResult.hidden = false;
      videoStatus.textContent = "वीडियो तैयार है! 🎉";
      return;
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error || "वीडियो नहीं बन पाया। दोबारा कोशिश करें।");
    }
    videoStatus.textContent = "वीडियो बन रहा है… (" + data.status + ") इसमें कुछ मिनट लग सकते हैं।";
  }
  throw new Error("वीडियो बनाने में ज़्यादा समय लग रहा है। थोड़ी देर बाद फिर जाँचें।");
}

videoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = videoPrompt.value.trim();
  if (!prompt || generateVideo.disabled) return;
  generateVideo.disabled = true;
  videoResult.hidden = true;
  videoResult.innerHTML = "";
  videoStatus.textContent = "वीडियो बनाने का अनुरोध भेज रहे हैं…";
  try {
    const response = await fetch("/api/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "वीडियो बनाने का अनुरोध असफल हुआ।");
    if (data.status === "succeeded") {
      const url = getOutputUrl(data.output);
      if (!url) throw new Error("वीडियो तैयार हुआ, लेकिन उसका लिंक नहीं मिला।");
      const video = document.createElement("video");
      video.controls = true; video.playsInline = true; video.src = url;
      const link = document.createElement("a");
      link.href = url; link.target = "_blank"; link.rel = "noopener";
      link.textContent = "वीडियो खोलें / सेव करें";
      videoResult.append(video, link); videoResult.hidden = false;
      videoStatus.textContent = "वीडियो तैयार है! 🎉";
    } else if (data.id) {
      await watchVideoJob(data.id);
    } else {
      throw new Error("वीडियो सेवा ने job ID नहीं दी।");
    }
  } catch (error) {
    videoStatus.textContent = "समस्या: " + error.message;
  } finally {
    generateVideo.disabled = false;
  }
});
