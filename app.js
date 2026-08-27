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
      <i class="fa-solid fa-robot"></i>
    </div>
    <div class="max-w-[95%] sm:max-w-[85%]">
      <div class="bg-slate-900/90 border border-slate-800 text-slate-100 p-4 sm:p-5 rounded-2xl rounded-tl-none shadow-xl text-xs sm:text-sm leading-relaxed">
        <h3 class="text-base font-bold text-white mb-1.5 flex items-center gap-2">
          <span>👋 Assalam-o-Alaikum & Welcome to EstateBot AI!</span>
        </h3>
        <p class="text-slate-300 text-xs sm:text-sm mb-4">
          I am your dedicated <strong>Real Estate FAQ Assistant</strong>. Ask me anything about property purchasing, required documents, down payments, legal NOC verification, and investment ROI.
        </p>

        <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 mb-2">
          <p class="text-xs font-bold text-emerald-400 mb-2.5 flex items-center gap-1.5">
            <i class="fa-solid fa-sparkles"></i>
            Suggested Questions to ask:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onclick="askSuggestedQuestion('What documents are required to buy property?')" class="text-left p-2 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-file-shield text-emerald-400 shrink-0 text-[11px]"></i>
              <span class="truncate">📄 Required documents for buying</span>
            </button>
            <button onclick="askSuggestedQuestion('How much down payment do I need for a 500k house?')" class="text-left p-2 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-calculator text-purple-400 shrink-0 text-[11px]"></i>
              <span class="truncate">💰 Down payment & mortgage plan</span>
            </button>
            <button onclick="askSuggestedQuestion('How to verify NOC and legal approval of a project?')" class="text-left p-2 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-stamp text-amber-400 shrink-0 text-[11px]"></i>
              <span class="truncate">🏛️ NOC & legal verification</span>
            </button>
            <button onclick="askSuggestedQuestion('What is the difference between Commercial & Residential ROI?')" class="text-left p-2 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-chart-line text-blue-400 shrink-0 text-[11px]"></i>
              <span class="truncate">📈 Commercial vs Residential ROI</span>
            </button>
            <button onclick="askSuggestedQuestion('How do developer installment plans work?')" class="text-left p-2 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-money-check-dollar text-teal-400 shrink-0 text-[11px]"></i>
              <span class="truncate">📅 How installment plans work</span>
            </button>
            <button onclick="askSuggestedQuestion('Islamabad aur Karachi me best real estate investment areas kon se hain?')" class="text-left p-2 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-map-location-dot text-rose-400 shrink-0 text-[11px]"></i>
              <span class="truncate">🇵🇰 Islamabad & Karachi areas</span>
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
      <i class="fa-solid fa-robot"></i>
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
      <i class="fa-solid fa-robot"></i>
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
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-white mt-2 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-white mt-2 mb-1">$1</h2>');
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

// n8n Webhook Request with Timeout
async function callN8nWebhook(messageText) {
  const payload = {
    message: messageText,
    chatInput: messageText,
    sessionId: state.sessionId,
    timestamp: new Date().toISOString(),
    user: "Website Visitor"
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

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
      return textData || "Message processed successfully.";
    }
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Core Real Estate FAQ Engine (Text only)
function evaluateRealEstateQuery(rawQuery) {
  const q = rawQuery.toLowerCase().trim();

  // 1. Greetings
  if (/^(hi|hello|hey|salam|assalam|aoa|kese ho|kaisay ho|good morning|good evening)/i.test(q)) {
    return {
      message: `Hello! 😊 I am your **Real Estate FAQ Assistant**.\n\nI can help you with:\n- 📄 **Required Documents** for property buying/transfer\n- 💰 **Down Payments & Mortgage/EMI Calculations**\n- 🏛️ **NOC & Legal Approvals** (CDA, LDA, SBCA)\n- 📈 **Investment ROI & Rental Yields**\n- 🇵🇰 **Property Rates & Installment Plans**\n\nWhat would you like to know?`
    };
  }

  // 2. Required Documents
  if (q.includes("document") || q.includes("kaagazat") || q.includes("papers") || q.includes("files") || q.includes("dastaveez")) {
    return {
      message: `📄 **Documents Required to Buy/Transfer Property:**\n\n1. **Buyer & Seller CNIC / NICOP Copies** (Original verified via NADRA)\n2. **Passport size Photographs** (2 to 4 copies)\n3. **Allotment Letter / Transfer Letter** issued by the housing authority/society\n4. **Non-Encumbrance Certificate (NEC)** & NOC from the relevant development authority\n5. **Tax Challan & Stamp Duty Receipts** (FBR withholding tax / CVT)\n6. **Sale Agreement (Iqraarnama)** on verified stamp paper\n\nFor Overseas Pakistanis: A verified **Power of Attorney (PoA)** stamped by the Pakistani Embassy is required.`
    };
  }

  // 3. Down Payment / Mortgage / EMI / Loan
  if (q.includes("down payment") || q.includes("mortgage") || q.includes("calculator") || q.includes("emi") || q.includes("loan") || q.includes("installment") || q.includes("qist") || q.includes("downpayment")) {
    return {
      message: `📊 **Down Payment & Mortgage Overview:**\n\n- **Standard Down Payment**: Usually **15% to 25%** of the total property value upfront.\n- **Off-Plan / Installment Projects**: Developers typically offer booking starting at **10% to 15%** down payment, with remaining balance spread over 3 to 5 years (monthly or quarterly installments).\n- **Bank Home Financing**: Banks generally finance up to **70-80%** of the property value, with interest rates typically between **12% to 18%** (KIBOR + spread in Pakistan) or **6.5% - 7.5%** in international markets.\n- **Example**: For a $500,000 / PKR 5 Crore property, a 20% down payment equals $100,000 / PKR 1 Crore.`
    };
  }

  // 4. NOC & Legal Verification
  if (q.includes("noc") || q.includes("legal") || q.includes("approval") || q.includes("society") || q.includes("verify") || q.includes("cda") || q.includes("lda") || q.includes("sbca")) {
    return {
      message: `🏛️ **How to Verify Property Legal Status & NOC:**\n\n1. **Check Official Authority Portal**: Verify the society's NOC on the official authority website (e.g. CDA/RDA for Islamabad/Rawalpindi, LDA for Lahore, SBCA for Karachi).\n2. **Approved Layout Plan (LOP)**: Ensure the specific block/phase has an approved Layout Plan, not just an initial permission letter.\n3. **Land Title & Registry (Fard/Intiqal)**: Verify the land is legally transferred in the developer's name at the local revenue office (Patwari / Sub-Registrar).\n4. **Utility Connections (Electricity/Gas/Water NOC)**: Confirm NOCs for utility supply lines are obtained.`
    };
  }

  // 5. Commercial vs Residential ROI & Rental Yield
  if (q.includes("roi") || q.includes("rental") || q.includes("investment") || q.includes("yield") || q.includes("commercial") || q.includes("residential") || q.includes("profit")) {
    return {
      message: `📈 **Commercial vs. Residential Real Estate Comparison:**\n\n| Feature | Commercial (Plazas/Shops) | Residential (Houses/Flats) |\n| :--- | :--- | :--- |\n| **Rental Yield** | **7% - 10%** annually | **3% - 5%** annually |\n| **Capital Appreciation** | Higher in developing business hubs | Steady & consistent |\n| **Lease Duration** | Long-term (3 to 10 years) | Short-term (1 to 2 years) |\n| **Maintenance Cost** | Usually borne by tenant | Borne by landlord |\n| **Initial Budget** | High entry barrier | Flexible options |\n\n**Recommendation**: For immediate passive rental income, commercial shops or corporate offices are optimal; for capital safety and long-term living security, residential plots or houses are preferred.`
    };
  }

  // 6. Cities & Rates (Islamabad, Karachi, Lahore)
  if (q.includes("islamabad") || q.includes("karachi") || q.includes("lahore") || q.includes("dha") || q.includes("bahria") || q.includes("rate") || q.includes("qeemat") || q.includes("price")) {
    return {
      message: `🇵🇰 **Top Real Estate Investment Locations & Trends:**\n\n- **Islamabad / Rawalpindi**: High capital appreciation in DHA Islamabad, Bahria Town, Park View City, and B-17 (Multi Gardens).\n- **Lahore**: High rental yields and safety in DHA Phase 6-9, Lake City, and Etihad Town.\n- **Karachi**: Prime commercial demand in Clifton, DHA Phases 5-8, and emerging projects along the Motorway (M-9).\n- **Average Plot Rates**: Residential 1 Kanal plots range from PKR 2.5 Crore to PKR 8+ Crore depending on the sector and development stage.`
    };
  }

  // 7. Schedule / Contact Agent
  if (q.includes("contact") || q.includes("call") || q.includes("agent") || q.includes("number") || q.includes("phone") || q.includes("visit") || q.includes("schedule") || q.includes("appointment")) {
    return {
      message: `📞 **Real Estate Advisory & Contact Information:**\n\n- **Live Helpline**: +1 (800) 555-REAL / +92 (300) 123-4567\n- **Email Support**: support@estatebot-faq.com\n- **Office Timings**: Monday to Saturday, 9:00 AM - 7:00 PM\n\nYou can ask any specific questions right here in the chat and our AI will assist you immediately!`
    };
  }

  // Default Smart Fallback FAQ response
  return {
    message: `Thank you for your question: **"${rawQuery}"**.\n\nOur Real Estate Knowledge Base covers property legalities, mortgage rates, developer installment plans, and market pricing.\n\nCould you please specify if you are looking for **buying advice**, **financing/down payment details**, or **legal/NOC verification**?`
  };
}

// Clear Chat
btnClearChat.addEventListener("click", () => {
  if (confirm("Are you sure you want to reset the chat conversation?")) {
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
  sendBotMessage(`⚙️ Settings updated! Active Engine: **${state.engine.toUpperCase()}**`);
});

function initSettings() {
  updateEngineBadge();
}

function updateEngineBadge() {
  if (state.engine === "webhook") {
    aiEngineBadge.innerHTML = `<i class="fa-solid fa-bolt text-amber-400"></i><span>n8n Webhook</span>`;
    aiEngineBadge.className = "px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-medium flex items-center gap-1.5";
  } else if (state.engine === "builtin") {
    aiEngineBadge.innerHTML = `<i class="fa-solid fa-microchip text-emerald-400"></i><span>Smart Engine</span>`;
    aiEngineBadge.className = "px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium flex items-center gap-1.5";
  } else {
    aiEngineBadge.innerHTML = `<i class="fa-solid fa-cloud text-blue-400"></i><span>${state.engine.toUpperCase()} Live</span>`;
    aiEngineBadge.className = "px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-medium flex items-center gap-1.5";
  }
}

// External OpenAI LLM Call
async function callOpenAI(prompt) {
  const messages = [
    {
      role: "system",
      content: `You are EstateBot, an expert real estate AI FAQ assistant. Answer questions about property buying, documentation, pricing, NOC legalities, mortgage calculations, and investment ROI. Provide clear, concise answers formatted with bullet points and bold text.`
    },
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
          text: `You are EstateBot, a professional real estate FAQ assistant. User question: ${prompt}. Provide helpful advice with bullet points, pricing guidelines, or legal documentation details.`
        }]
      }]
    })
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
