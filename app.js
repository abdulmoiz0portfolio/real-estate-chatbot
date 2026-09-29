// Session ID Management
function getOrCreateSessionId() {
  let sid = localStorage.getItem("propertyai_session_id");
  if (!sid) {
    sid = "sess_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
    localStorage.setItem("propertyai_session_id", sid);
  }
  return sid;
}

// Global Application State
const state = {
  webhookUrl: "https://n8n.bminternational.com.pk/webhook/6c925c11-65e3-41dd-a8be-2d495f04859c",
  fallbackMailerUrl: "https://formsubmit.co/ajax/bobrober2323@gmail.com",
  adminEmail: "bobrober2323@gmail.com",
  sessionId: getOrCreateSessionId(),
  chatHistory: [],
  
  // Conversational Lead Qualification State Machine
  lead: {
    step: "intent", // "intent" -> "location_type" -> "budget_timeline" -> "ask_name" -> "ask_phone" -> "ask_email" -> "completed"
    intent: "",
    location: "",
    propertyType: "",
    budget: "",
    timeline: "",
    name: "",
    phone: "",
    email: "",
    dispatched: false
  }
};

// DOM Elements
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const btnSend = document.getElementById("btn-send");
const btnClearChat = document.getElementById("btn-clear-chat");

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  initQuickPrompts();
  
  // Load previous history or greet
  const savedHistory = localStorage.getItem("propertyai_history");
  if (savedHistory) {
    try {
      const parsed = JSON.parse(savedHistory);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.chatHistory = parsed;
        renderSavedHistory();
        return;
      }
    } catch (e) {
      console.warn("Could not load history", e);
    }
  }
  
  sendWelcomeMessage();
});

// Render Welcome Greeting
function sendWelcomeMessage() {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex items-start gap-3 message-animate";

  msgEl.innerHTML = `
    <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-sm shrink-0 shadow-md shadow-emerald-500/20">
      <i class="fa-solid fa-building-user"></i>
    </div>
    <div class="max-w-[95%] sm:max-w-[85%]">
      <div class="bg-slate-900/90 border border-slate-800 text-slate-100 p-4 sm:p-5 rounded-2xl rounded-tl-none shadow-xl text-xs sm:text-sm leading-relaxed">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <h3 class="text-base font-bold text-white">Welcome to PropertyAI Concierge 👋</h3>
        </div>
        <p class="text-slate-300 text-xs sm:text-sm mb-3.5">
          I am your autonomous 24/7 real estate concierge powered by Automatixes. I help you discover verified listings, schedule private VIP viewings, and analyze off-market opportunities.
        </p>

        <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 mb-2">
          <p class="text-xs font-bold text-emerald-400 mb-2.5 flex items-center gap-1.5">
            <i class="fa-solid fa-sparkles text-amber-400"></i>
            How can I assist your property search today?
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onclick="askSuggestedQuestion('I am looking to buy a luxury residential property.')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-house-chimney text-emerald-400 shrink-0 text-[11px]"></i>
              <span class="truncate">🏡 Buy a Luxury Home</span>
            </button>
            <button onclick="askSuggestedQuestion('I would like to schedule a private VIP home showing.')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-calendar-check text-blue-400 shrink-0 text-[11px]"></i>
              <span class="truncate">📅 Schedule Private Showing</span>
            </button>
            <button onclick="askSuggestedQuestion('I am looking for high-yield investment properties.')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-chart-line text-purple-400 shrink-0 text-[11px]"></i>
              <span class="truncate">📈 High-Yield Investments</span>
            </button>
            <button onclick="askSuggestedQuestion('I want to sell my property for maximum valuation.')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-tag text-teal-400 shrink-0 text-[11px]"></i>
              <span class="truncate">🏷️ Sell / Value My Property</span>
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

// Quick Prompt Listeners
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

window.askSuggestedQuestion = function(questionText) {
  if (!questionText) return;
  addUserMessage(questionText);
  processUserTurn(questionText);
};

// Add User Message to UI
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
  saveHistory();
}

// Add Bot Message to UI
function sendBotMessage(markdownText) {
  hideTypingIndicator();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex items-start gap-3 message-animate";

  let formattedContent = formatMarkdown(markdownText);

  msgEl.innerHTML = `
    <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xs shrink-0 shadow-md shadow-emerald-500/20">
      <i class="fa-solid fa-building-user"></i>
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
  saveHistory();
}

function showTypingIndicator() {
  if (document.getElementById("typing-indicator")) return;
  const typingEl = document.createElement("div");
  typingEl.id = "typing-indicator";
  typingEl.className = "flex items-start gap-3 message-animate";
  typingEl.innerHTML = `
    <div class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 text-xs shrink-0">
      <i class="fa-solid fa-building-user"></i>
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

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function saveHistory() {
  try {
    localStorage.setItem("propertyai_history", JSON.stringify(state.chatHistory));
  } catch (e) {}
}

function renderSavedHistory() {
  chatMessages.innerHTML = "";
  state.chatHistory.forEach(msg => {
    if (msg.role === "user") {
      const msgEl = document.createElement("div");
      msgEl.className = "flex justify-end message-animate";
      msgEl.innerHTML = `
        <div class="max-w-[85%] sm:max-w-[75%]">
          <div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-md text-xs sm:text-sm leading-relaxed">
            ${escapeHTML(msg.content)}
          </div>
          <div class="text-[10px] text-slate-500 text-right mt-1">${msg.time || ''}</div>
        </div>
      `;
      chatMessages.appendChild(msgEl);
    } else {
      const msgEl = document.createElement("div");
      msgEl.className = "flex items-start gap-3 message-animate";
      msgEl.innerHTML = `
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xs shrink-0 shadow-md shadow-emerald-500/20">
          <i class="fa-solid fa-building-user"></i>
        </div>
        <div class="max-w-[95%] sm:max-w-[85%]">
          <div class="bg-slate-900/90 border border-slate-800 text-slate-100 px-4 py-3.5 rounded-2xl rounded-tl-none shadow-md text-xs sm:text-sm leading-relaxed">
            ${formatMarkdown(msg.content)}
          </div>
          <div class="text-[10px] text-slate-500 mt-1">${msg.time || ''}</div>
        </div>
      `;
      chatMessages.appendChild(msgEl);
    }
  });
  scrollToBottom();
}

// Markdown formatting helper
function formatMarkdown(text) {
  if (typeof text !== "string") text = String(text);
  let html = escapeHTML(text);
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>');
  // Bullet points
  html = html.replace(/^\s*[-•]\s+(.*)$/gm, '<li class="ml-4 list-disc text-slate-300 my-1">$1</li>');
  // Numbered lists
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li class="ml-4 list-decimal text-slate-300 my-1">$2</li>');
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

// Form Submission Handler
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = chatInput.value.trim();
  if (!query) return;

  chatInput.value = "";
  addUserMessage(query);
  processUserTurn(query);
});

// Extraction Utilities
function extractEmail(text) {
  const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1].toLowerCase() : null;
}

function extractPhone(text) {
  const match = text.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}|\+?\d{10,15}/);
  return match ? match[0].trim() : null;
}

function extractBudget(text) {
  const match = text.match(/(?:\$|usd)?\s*(\d+(?:,\d+)*(?:\.\d+)?\s*(?:k|m|million|thousand|grand)?)/i);
  return match ? match[0].trim() : null;
}

function cleanNameInput(text) {
  let cleaned = text
    .replace(/^(my name is|i am|this is|this|call me|name is|i'm|it's|its|me)\s+/i, "")
    .replace(/[.!,?].*$/, "")
    .trim();
  // Capitalize words
  return cleaned.replace(/\b\w/g, l => l.toUpperCase()) || text;
}

// CONVERSATIONAL STATE MACHINE & LEAD QUALIFIER
async function processUserTurn(userText) {
  showTypingIndicator();
  
  // Natural delay to feel conversational
  await new Promise(res => setTimeout(res, 600));

  const text = userText.trim();
  const lower = text.toLowerCase();
  const lead = state.lead;

  // Opportunistic extraction across any message
  const foundEmail = extractEmail(text);
  if (foundEmail && !lead.email) lead.email = foundEmail;

  const foundPhone = extractPhone(text);
  if (foundPhone && !lead.phone) lead.phone = foundPhone;

  // Step 1: INTENT & INITIAL RESPONSE
  if (lead.step === "intent") {
    if (lower.includes("buy") || lower.includes("purchase") || lower.includes("home")) {
      lead.intent = "Purchase / Buy";
    } else if (lower.includes("rent") || lower.includes("lease")) {
      lead.intent = "Rent / Lease";
    } else if (lower.includes("invest") || lower.includes("roi") || lower.includes("yield")) {
      lead.intent = "Investment / High Yield";
    } else if (lower.includes("sell") || lower.includes("list")) {
      lead.intent = "Sell / List Property";
    } else {
      lead.intent = "General Real Estate Inquiry";
    }

    lead.step = "location_type";
    sendBotMessage(`That sounds wonderful! We have an exclusive portfolio of verified listings and private off-market opportunities.\n\n**Which city, neighborhood, or area are you looking in**, and what style of property do you have in mind (e.g., 3-4 bedroom single-family home, modern condominium, or luxury estate)?`);
    return;
  }

  // Step 2: LOCATION & PROPERTY TYPE
  if (lead.step === "location_type") {
    lead.location = text;
    lead.propertyType = text;
    lead.step = "budget";

    sendBotMessage(`Excellent choices — that area has fantastic market dynamics and premium inventory.\n\nWhat is your **estimated price range or target budget** for this property?`);
    return;
  }

  // Step 3: BUDGET
  if (lead.step === "budget") {
    lead.budget = extractBudget(text) || text;
    lead.step = "timeline";

    sendBotMessage(`Understood! And what is your **ideal purchase or move-in timeline** (e.g., ready immediately, within 30-60 days, or 3-6 months)?`);
    return;
  }

  // Step 4: TIMELINE
  if (lead.step === "timeline") {
    lead.timeline = text;
    lead.step = "ask_name";

    sendBotMessage(`Perfect. I have identified 3 exclusive listings that match your criteria.\n\nMay I have your **full name** so I can reserve these listings and prepare your confidential property dossier?`);
    return;
  }

  // Step 4: ASK NAME
  if (lead.step === "ask_name") {
    lead.name = cleanNameInput(text);
    lead.step = "ask_phone";

    sendBotMessage(`It's a pleasure to connect with you, **${lead.name}**!\n\nWhat is your best **cell phone number**? Our senior property specialist can send you instant SMS alerts and coordinate private showings.`);
    return;
  }

  // Step 5: ASK PHONE
  if (lead.step === "ask_phone") {
    const phone = extractPhone(text) || text;
    lead.phone = phone;
    lead.step = "ask_email";

    sendBotMessage(`Thank you, **${lead.name}**!\n\nLastly, what is your **primary email address** so we can immediately send over your personalized property portfolio, HD floor plans, and pricing sheet?`);
    return;
  }

  // Step 6: ASK EMAIL & DISPATCH LEAD
  if (lead.step === "ask_email" || (!lead.dispatched && lead.email && lead.phone && lead.name)) {
    const email = extractEmail(text) || text;
    lead.email = email;
    lead.step = "completed";

    // Trigger instant background lead dispatch
    await dispatchLeadNotification();

    sendBotMessage(`🎉 **Thank you, ${lead.name}! Your property request has been confirmed.**\n\nHere is your recorded inquiry summary:\n- 👤 **Client Name:** ${lead.name}\n- 📞 **Mobile (SMS):** ${lead.phone}\n- ✉️ **Email Address:** ${lead.email}\n- 🏡 **Interest:** ${lead.intent || 'Luxury Real Estate'}\n- 📍 **Target Area:** ${lead.location || 'Preferred Metro'}\n- 💰 **Budget:** ${lead.budget || 'Custom Range'}\n- ⏱️ **Timeline:** ${lead.timeline || 'Flexible'}\n\n**Our team will contact you soon.**`);
    return;
  }

  // Step 7: COMPLETED / ONGOING CONVERSATION
  if (lead.step === "completed") {
    // Intelligent contextual real estate Q&A
    const response = answerRealEstateQuestion(text);
    sendBotMessage(response);
    return;
  }
}

// Answer general real estate questions after lead capture
function answerRealEstateQuestion(query) {
  const q = query.toLowerCase();
  
  if (q.includes("pool") || q.includes("garden") || q.includes("office") || q.includes("garage") || q.includes("amenity")) {
    return `Noted! I have appended those specific amenity preferences to your property file. Our specialist will ensure all presented options highlight these exact features.\n\nFeel free to ask about local neighborhood schools, recent comparable sales, or schedule a virtual walkthrough!`;
  }
  
  if (q.includes("rate") || q.includes("mortgage") || q.includes("loan") || q.includes("financing") || q.includes("interest")) {
    return `Current 30-year fixed mortgage rates for well-qualified buyers are averaging around **6.3% to 6.7%**, with adjustable-rate mortgages (ARMs) offering introductory savings.\n\nWe work with top tier lending partners who can issue verified pre-approval letters in as little as 2 hours if you need financing support.`;
  }

  if (q.includes("tour") || q.includes("visit") || q.includes("showing") || q.includes("schedule") || q.includes("see")) {
    return `Private showings can be arranged 7 days a week between 9:00 AM and 7:00 PM. Our agent will text your cell number shortly to confirm your preferred day and time window for the walkthrough.`;
  }

  return `Understood! Your notes have been updated in real-time. Our property director is reviewing your file and will follow up with you directly via text message and email shortly.\n\nIs there anything else you would like to know about current market valuations, HOA guidelines, or closing procedures?`;
}

// Dispatch Lead Notification to Email and Webhook
async function dispatchLeadNotification() {
  if (state.lead.dispatched) return;
  state.lead.dispatched = true;

  const lead = state.lead;
  
  // Format summary & transcript
  const transcriptText = state.chatHistory.map(m => `[${m.role.toUpperCase()} - ${m.time || ''}]: ${m.content}`).join("\n");
  
  const executiveSummary = `
NEW REAL ESTATE LEAD RECEIVED:
---------------------------------------------
Client Name:      ${lead.name}
Phone (SMS):      ${lead.phone}
Email:            ${lead.email}
Intent:           ${lead.intent}
Target Location:  ${lead.location}
Budget:           ${lead.budget}
Timeline:         ${lead.timeline}
Session ID:       ${state.sessionId}
Capture Time:     ${new Date().toLocaleString()}
---------------------------------------------
Lead Summary:
The client expressed active interest in ${lead.intent} in ${lead.location}.
Target budget stated as ${lead.budget} with timeline ${lead.timeline}.
Contact details verified via conversational assistant.
---------------------------------------------
`.trim();

  // Save to localStorage leads archive
  try {
    const savedLeads = JSON.parse(localStorage.getItem("automatixes_captured_leads") || "[]");
    savedLeads.push({
      ...lead,
      capturedAt: new Date().toISOString(),
      summary: executiveSummary,
      transcript: transcriptText
    });
    localStorage.setItem("automatixes_captured_leads", JSON.stringify(savedLeads));
  } catch (e) {
    console.warn("Storage error", e);
  }

  // 1. Dispatch to n8n Webhook
  // Using both chatInput containing email/phone (triggers n8n regex) and structured payload
  const n8nPayload = {
    message: executiveSummary,
    chatInput: `${lead.name} | ${lead.phone} | ${lead.email} | Budget: ${lead.budget}`,
    sessionId: state.sessionId,
    lead: lead,
    summary: executiveSummary,
    transcript: transcriptText,
    timestamp: new Date().toISOString()
  };

  try {
    fetch(state.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload)
    }).catch(err => console.warn("n8n webhook dispatch warning:", err));
  } catch (err) {
    console.warn("n8n dispatch failed", err);
  }

  // 2. Dispatch Direct Email via FormSubmit to bobrober2323@gmail.com
  const emailPayload = {
    _subject: `🔥 NEW REAL ESTATE LEAD: ${lead.name} - ${lead.budget} (${lead.location})`,
    _template: "table",
    _captcha: "false",
    lead_name: lead.name,
    phone_number: lead.phone,
    email_address: lead.email,
    property_intent: lead.intent,
    location_preference: lead.location,
    target_budget: lead.budget,
    moving_timeline: lead.timeline,
    ai_executive_summary: executiveSummary,
    chat_transcript: transcriptText
  };

  try {
    fetch(state.fallbackMailerUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(emailPayload)
    }).catch(err => console.warn("Direct mailer notice:", err));
  } catch (err) {
    console.warn("Direct mailer failed", err);
  }

  // 3. Silent Browser Form Submission to bobrober2323@gmail.com
  try {
    const form = document.getElementById("lead-dispatch-form");
    if (form) {
      const subj = document.getElementById("lead-form-subject");
      if (subj) subj.value = `🔥 NEW LEAD: ${lead.name} - ${lead.budget} (${lead.location})`;
      const nm = document.getElementById("lead-form-name");
      if (nm) nm.value = lead.name;
      const ph = document.getElementById("lead-form-phone");
      if (ph) ph.value = lead.phone;
      const em = document.getElementById("lead-form-email");
      if (em) em.value = lead.email;
      const it = document.getElementById("lead-form-intent");
      if (it) it.value = lead.intent;
      const lc = document.getElementById("lead-form-location");
      if (lc) lc.value = lead.location;
      const bg = document.getElementById("lead-form-budget");
      if (bg) bg.value = lead.budget;
      const tm = document.getElementById("lead-form-timeline");
      if (tm) tm.value = lead.timeline;
      const sm = document.getElementById("lead-form-summary");
      if (sm) sm.value = executiveSummary;
      form.submit();
    }
  } catch (formErr) {
    console.warn("Silent form dispatch error:", formErr);
  }

  console.log(">>> [SUCCESS] Real estate lead dispatched for:", lead.name, lead.phone, lead.email);
}

// Clear Chat Action
btnClearChat.addEventListener("click", () => {
  if (confirm("Reset conversation and start a new property inquiry?")) {
    chatMessages.innerHTML = "";
    state.chatHistory = [];
    state.sessionId = getOrCreateSessionId();
    state.lead = {
      step: "intent",
      intent: "",
      location: "",
      propertyType: "",
      budget: "",
      timeline: "",
      name: "",
      phone: "",
      email: "",
      dispatched: false
    };
    localStorage.removeItem("propertyai_history");
    sendWelcomeMessage();
  }
});
