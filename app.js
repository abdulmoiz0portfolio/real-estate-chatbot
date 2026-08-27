// Session ID Generation for n8n AI Chat Memory
function getOrCreateSessionId() {
  let sid = localStorage.getItem("estatebot_session_id");
  if (!sid) {
    sid = "session_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("estatebot_session_id", sid);
  }
  return sid;
}

// App State
let state = {
  engine: localStorage.getItem("estatebot_engine") || "webhook",
  webhookUrl: localStorage.getItem("estatebot_webhook") || "https://n8n.bminternational.com.pk/webhook/6c925c11-65e3-41dd-a8be-2d495f04859c",
  apiKey: localStorage.getItem("estatebot_apikey") || "",
  sessionId: getOrCreateSessionId(),
  chatHistory: []
};

// DOM Elements
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const btnSend = document.getElementById("btn-send");
const btnClearChat = document.getElementById("btn-clear-chat");
const aiEngineBadge = document.getElementById("ai-engine-badge");

// Modals
const apiModal = document.getElementById("api-modal");
const btnApiModal = document.getElementById("btn-api-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const engineSelect = document.getElementById("engine-select");
const webhookContainer = document.getElementById("webhook-container");
const customWebhookUrlInput = document.getElementById("custom-webhook-url");
const apiKeyContainer = document.getElementById("api-key-container");
const customApiKeyInput = document.getElementById("custom-api-key");
const btnSaveSettings = document.getElementById("btn-save-settings");

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  initSettings();
  initQuickPrompts();
  
  // Initial Greeting message
  if (state.chatHistory.length === 0) {
    sendWelcomeMessage();
  }
});

function sendWelcomeMessage() {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex items-start gap-3 message-animate";

  msgEl.innerHTML = `
    <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-sm shrink-0 shadow-md shadow-emerald-500/20">
      <i class="fa-solid fa-house-chimney-user"></i>
    </div>
    <div class="max-w-[95%] sm:max-w-[85%]">
      <div class="bg-slate-900/90 border border-slate-800 text-slate-100 p-4 sm:p-5 rounded-2xl rounded-tl-none shadow-xl text-xs sm:text-sm leading-relaxed">
        <h3 class="text-base font-bold text-white mb-1.5 flex items-center gap-2">
          <span>Assalam-o-Alaikum! Main PropertyBot hoon 👋</span>
        </h3>
        <p class="text-slate-300 text-xs sm:text-sm mb-3.5">
          Pakistan mein plots, ghar, apartments khareedne, baichne ya kiraye par lene ke baray mein aapki mukammal madad kar sakta hoon.
        </p>

        <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 mb-2">
          <p class="text-xs font-bold text-emerald-400 mb-2.5 flex items-center gap-1.5">
            <i class="fa-solid fa-sparkles"></i>
            Aap ye sawalat pooch saktay hain:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onclick="askSuggestedQuestion('DHA aur Bahria Town me 1 Kanal plot ka kya rate chal raha hai?')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-map-location-dot text-emerald-400 shrink-0 text-[11px]"></i>
              <span class="truncate">📍 1 Kanal plot rates (DHA/Bahria)</span>
            </button>
            <button onclick="askSuggestedQuestion('Property khareedne ke liye kon se documents zaroori hotay hain?')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-file-shield text-blue-400 shrink-0 text-[11px]"></i>
              <span class="truncate">📄 Zaroori Documents (Fard / NOC)</span>
            </button>
            <button onclick="askSuggestedQuestion('5 Marla ghar ke liye kitni down payment deni hogi?')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-calculator text-purple-400 shrink-0 text-[11px]"></i>
              <span class="truncate">💰 5 Marla Down Payment & Qist</span>
            </button>
            <button onclick="askSuggestedQuestion('Commercial plots ka rental yield aur ROI kaisa hai?')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-chart-line text-amber-400 shrink-0 text-[11px]"></i>
              <span class="truncate">📈 Commercial vs Residential ROI</span>
            </button>
          </div>
        </div>
      </div>
      <div class="text-[10px] text-slate-500 mt-1">${time}</div>
    </div>
  `;

  chatMessages.appendChild(msgEl);
  scrollToBottom();
}

// Quick Prompt Buttons
function initQuickPrompts() {
  document.querySelectorAll(".quick-prompt").forEach(btn => {
    btn.onclick = () => {
      const prompt = btn.getAttribute("data-prompt");
      if (prompt) {
        askSuggestedQuestion(prompt);
      }
    };
  });
}

// Global function to trigger suggested questions
window.askSuggestedQuestion = function(questionText) {
  if (!questionText) return;
  addUserMessage(questionText);
  processUserQuery(questionText);
};

// Message Rendering Functions
function addUserMessage(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex justify-end message-animate";
  msgEl.innerHTML = `
    <div class="max-w-[85%] sm:max-w-[75%]">
      <div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-md text-xs sm:text-sm leading-relaxed">
        ${escapeHTML(text)}
      </div>
      <div class="text-[10px] text-slate-500 text-right mt-1">${time}</div>
    </div>
  `;
  chatMessages.appendChild(msgEl);
  scrollToBottom();
  state.chatHistory.push({ role: "user", content: text, time });
}

function showTypingIndicator() {
  const typingEl = document.createElement("div");
  typingEl.id = "typing-indicator";
  typingEl.className = "flex items-start gap-3 message-animate";
  typingEl.innerHTML = `
    <div class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 text-xs shrink-0">
      <i class="fa-solid fa-house-chimney-user"></i>
    </div>
    <div class="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-md">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  chatMessages.appendChild(typingEl);
  scrollToBottom();
}

function hideTypingIndicator() {
  const typingEl = document.getElementById("typing-indicator");
  if (typingEl) typingEl.remove();
}

function sendBotMessage(markdownText) {
  hideTypingIndicator();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex items-start gap-3 message-animate";

  let formattedContent = formatMarkdown(markdownText);

  msgEl.innerHTML = `
    <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xs shrink-0 shadow-md shadow-emerald-500/20">
      <i class="fa-solid fa-house-chimney-user"></i>
    </div>
    <div class="max-w-[95%] sm:max-w-[85%]">
      <div class="bg-slate-900/90 border border-slate-800 text-slate-100 px-4 py-3.5 rounded-2xl rounded-tl-none shadow-md text-xs sm:text-sm leading-relaxed">
        ${formattedContent}
      </div>
      <div class="text-[10px] text-slate-500 mt-1">${time}</div>
    </div>
  `;

  chatMessages.appendChild(msgEl);
  scrollToBottom();
  state.chatHistory.push({ role: "assistant", content: markdownText, time });
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Markdown Formatter
function formatMarkdown(text) {
  if (typeof text !== "string") {
    text = JSON.stringify(text);
  }
  let html = escapeHTML(text);
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>');
  // Bullet points
  html = html.replace(/^\s*[-•]\s+(.*)$/gm, '<li class="ml-4 list-disc text-slate-300 my-0.5">$1</li>');
  // Numbered lists
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li class="ml-4 list-decimal text-slate-300 my-0.5">$2</li>');
  // Linebreaks
  html = html.replace(/\n/g, '<br/>');
  return html;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Handle Form Submission
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = chatInput.value.trim();
  if (!query) return;

  chatInput.value = "";
  addUserMessage(query);
  processUserQuery(query);
});

// Process Query Routing (n8n Webhook / OpenAI / Gemini / Built-in)
async function processUserQuery(query) {
  showTypingIndicator();

  // 1. Primary: n8n Webhook
  if (state.engine === "webhook" && state.webhookUrl) {
    try {
      const response = await callN8nWebhook(query);
      if (response) {
        sendBotMessage(response);
        return;
      }
    } catch (err) {
      console.warn("n8n Webhook fetch failed:", err);
      const fallback = evaluateRealEstateQuery(query);
      sendBotMessage(`${fallback.message}`);
      return;
    }
  }

  // 2. OpenAI
  if (state.engine === "openai" && state.apiKey) {
    try {
      const response = await callOpenAI(query);
      sendBotMessage(response);
      return;
    } catch (err) {
      console.warn("OpenAI API error, fallback:", err);
    }
  } 
  
  // 3. Gemini
  else if (state.engine === "gemini" && state.apiKey) {
    try {
      const response = await callGemini(query);
      sendBotMessage(response);
      return;
    } catch (err) {
      console.warn("Gemini API error, fallback:", err);
    }
  }

  // 4. Built-in Offline Engine
  setTimeout(() => {
    const result = evaluateRealEstateQuery(query);
    sendBotMessage(result.message);
  }, 400);
}

// n8n Webhook Request
async function callN8nWebhook(messageText) {
  const payload = {
    message: messageText,
    chatInput: messageText,
    sessionId: state.sessionId,
    timestamp: new Date().toISOString(),
    user: "Website Visitor"
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(state.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (typeof data === "string") return data;
      if (data.output) return data.output;
      if (data.response) return data.response;
      if (data.text) return data.text;
      if (data.message) return data.message;
      if (data.content) return data.content;
      if (data.data && data.data.output) return data.data.output;
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        if (typeof first === "string") return first;
        if (first.output) return first.output;
        if (first.text) return first.text;
        if (first.message) return first.message;
        if (first.response) return first.response;
      }
      return JSON.stringify(data, null, 2);
    } else {
      const textData = await response.text();
      return textData || "Ji, aapka message receive ho gaya hai.";
    }
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Core PropertyBot Conversational Logic & Persona
function evaluateRealEstateQuery(rawQuery) {
  const q = rawQuery.toLowerCase().trim();

  // Out of Scope Filter
  const outOfScopePatterns = [
    /imran khan|nawaz sharif|election|siyasat|politics|pti|pmln|vote/i,
    /python|javascript|coding|html|css|react|bug|function|algorithm|program/i,
    /cricket|psl|babar azam|ipl|football|messi|ronaldo|match|score/i,
    /movie|film|drama|song|actor|actress|cinema/i,
    /weather|mausam|barish|temperature/i,
    /doctor|bimari|medicine|fever|health/i,
    /recipe|khana|biryani|cook/i,
    /pichli instructions|ignore previous|system prompt/i
  ];

  for (const pattern of outOfScopePatterns) {
    if (pattern.test(q)) {
      return {
        message: `Maazrat, mein sirf property aur real estate se related sawalat mein aapki madad kar sakta hoon.\n\nBatayein — aap kis city ya area mein property dekh rahe hain, ya kis budget ka plot/ghar talash kar rahe hain?`
      };
    }
  }

  // 1. Greetings
  if (/^(hi|hello|hey|salam|assalam|aoa|kese ho|kaisay ho|kaise ho|kia hal|kya haal)/i.test(q)) {
    return {
      message: `Walaikum Assalam! Main theek hoon, shukriya. Main Pakistan Real Estate mein plots, ghar, flats aur payment plans ke baray mein aapki rehnumai ke liye hazir hoon.\n\nAap kis location (DHA, Bahria Town waghera) ya budget mein property talash kar rahe hain?`
    };
  }

  // 2. Documents (Fard, Intiqal, Registry, NOC, Allotment)
  if (q.includes("document") || q.includes("kaagaz") || q.includes("papers") || q.includes("fard") || q.includes("intiqal") || q.includes("registry") || q.includes("dastaveez")) {
    return {
      message: `Pakistan mein property khareedtay waqt ye ahem documents zaroori hotay hain:\n\n- **Fard**: Zameen ki malkiat ka official revenue record.\n- **Intiqal (Mutation)**: Malkiat ka ek shakhs se dosray ke naam transfer hona.\n- **Registry / Allotment Letter**: Society ya Sub-Registrar se transfer ka proof.\n- **NOC (No Objection Certificate)**: Society ka approved status aur clear dues certificate.\n\nAap kis specific society ya plot ke documents verify karwana chahtay hain?`
    };
  }

  // 3. Down Payment / Installments / Qist
  if (q.includes("down payment") || q.includes("downpayment") || q.includes("installment") || q.includes("qist") || q.includes("booking") || q.includes("plan")) {
    return {
      message: `Installment projects mein aam tor par **10% se 20% down payment** par booking hoti hai, aur baqi raqam 3 se 4 saal ki asan mahana ya quarterly aqsaat (installments) mein ada karni hoti hai.\n\nJaise agar 50 Lakh ka 5 Marla plot ho, to taqreeban **5 se 10 Lakh** down payment banti hai.\n\nAap kis city ya society ka payment plan janna chahtay hain?`
    };
  }

  // 4. Area Rates (DHA, Bahria Town, Islamabad, Karachi, Lahore, Gulberg)
  if (q.includes("dha") || q.includes("bahria") || q.includes("islamabad") || q.includes("karachi") || q.includes("lahore") || q.includes("rate") || q.includes("qeemat") || q.includes("price") || q.includes("marla") || q.includes("kanal")) {
    return {
      message: `Rates location aur phase par depend kartay hain:\n\n- **DHA / Bahria Town (5 Marla)**: Taqreeban **65 Lakh se 1.4 Crore** tak.\n- **1 Kanal Residential Plots**: Aam tor par **2.5 Crore se 6.5 Crore+** (Phase aur location ke hisab se).\n- **Commercial Plots (4 Marla)**: **3 Crore se 8 Crore+** tak demand hoti hai.\n\nAapka preferred budget kitna hai taake main aapko exact matching options guide kar sakoon?`
    };
  }

  // 5. Commercial vs Residential ROI & Rental
  if (q.includes("roi") || q.includes("rental") || q.includes("commercial") || q.includes("invest") || q.includes("kiraya") || q.includes("faida")) {
    return {
      message: `Behtareen investment ke liye:\n\n- **Commercial Property (Plazas/Shops)**: Saalana **7% se 10%** tak rental return deta hai aur long-term tenants miltay hain.\n- **Residential Ghar/Plots**: **3% se 5%** rental yield deta hai lekin safe aur fast resale value hoti hai.\n\nAap rental income ke liye dekh rahe hain ya short-term capital gain ke liye?`
    };
  }

  // 6. Contact / Agent / Visit
  if (q.includes("agent") || q.includes("call") || q.includes("number") || q.includes("phone") || q.includes("visit") || q.includes("rabta") || q.includes("milna")) {
    return {
      message: `Ji bilkul, aap hamaray verified property consultant se direct rabta kar saktay hain ya site visit schedule kar saktay hain.\n\nAap apna preferred time aur area bata dein, hamara agent aapse foran call ya WhatsApp par rabta kar le ga.`
    };
  }

  // Default fallback
  return {
    message: `Ji bilkul, main real estate ke hawalay se aapki mukammal rehnumai kar sakta hoon.\n\nAap plots, ready ghar, commercial shops ya installment plans me se kis cheez ke baray mein janna chahtay hain?`
  };
}

// Clear Chat
btnClearChat.addEventListener("click", () => {
  if (confirm("Kya aap chat history clear karna chahtay hain?")) {
    chatMessages.innerHTML = "";
    state.chatHistory = [];
    state.sessionId = getOrCreateSessionId();
    sendWelcomeMessage();
  }
});

// Settings Modal Logic
btnApiModal.addEventListener("click", () => {
  apiModal.classList.remove("hidden");
  engineSelect.value = state.engine;
  customWebhookUrlInput.value = state.webhookUrl;
  customApiKeyInput.value = state.apiKey;
  toggleConfigFields();
});

btnCloseModal.addEventListener("click", () => {
  apiModal.classList.add("hidden");
});

engineSelect.addEventListener("change", toggleConfigFields);

function toggleConfigFields() {
  const val = engineSelect.value;
  if (val === "webhook") {
    webhookContainer.classList.remove("hidden");
    apiKeyContainer.classList.add("hidden");
  } else if (val === "openai" || val === "gemini") {
    webhookContainer.classList.add("hidden");
    apiKeyContainer.classList.remove("hidden");
  } else {
    webhookContainer.classList.add("hidden");
    apiKeyContainer.classList.add("hidden");
  }
}

btnSaveSettings.addEventListener("click", () => {
  state.engine = engineSelect.value;
  state.webhookUrl = customWebhookUrlInput.value.trim();
  state.apiKey = customApiKeyInput.value.trim();
  
  localStorage.setItem("estatebot_engine", state.engine);
  localStorage.setItem("estatebot_webhook", state.webhookUrl);
  localStorage.setItem("estatebot_apikey", state.apiKey);

  updateEngineBadge();
  apiModal.classList.add("hidden");
  sendBotMessage(`Settings update ho gayi hain! Active Engine: **${state.engine.toUpperCase()}**`);
});

function initSettings() {
  updateEngineBadge();
}

function updateEngineBadge() {
  if (state.engine === "webhook") {
    aiEngineBadge.innerHTML = `<i class="fa-solid fa-bolt text-amber-400"></i><span>n8n Webhook</span>`;
    aiEngineBadge.className = "px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-medium flex items-center gap-1.5";
  } else if (state.engine === "builtin") {
    aiEngineBadge.innerHTML = `<i class="fa-solid fa-house-chimney-user text-emerald-400"></i><span>PropertyBot</span>`;
    aiEngineBadge.className = "px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium flex items-center gap-1.5";
  } else {
    aiEngineBadge.innerHTML = `<i class="fa-solid fa-cloud text-blue-400"></i><span>${state.engine.toUpperCase()} Live</span>`;
    aiEngineBadge.className = "px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-medium flex items-center gap-1.5";
  }
}

// External OpenAI LLM Call
async function callOpenAI(prompt) {
  const messages = [
    { role: "system", content: "You are PropertyBot, a friendly and professional real estate consultant for Pakistan properties. Keep answers concise, polite, and in Roman Urdu / English." },
    ...state.chatHistory.slice(-4).map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: prompt }
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${state.apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7
    })
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// External Google Gemini LLM Call
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
