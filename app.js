// PropertyAI Concierge - Autonomous Real Estate Advisor Engine
// Powered by Automatixes
// Version: 6.0 Pro Max

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
  fallbackMailerUrl: "https://formsubmit.co/ajax/261b110198af097aa708b5e5cccb5c64",
  adminEmail: "bobrober2323@gmail.com",
  testerEmail: localStorage.getItem("propertyai_tester_email") || "",
  sessionId: getOrCreateSessionId(),
  language: "en", // "en" | "ur"
  chatHistory: [],
  
  // Conversational Lead Qualification State
  lead: {
    step: "criteria", // "criteria" -> "ask_name" -> "ask_phone" -> "ask_email" -> "completed"
    waitingFor: "discovery", // "discovery", "location", "propertyType", "budget", "timeline", "name", "phone", "email"
    intent: "",
    location: "",
    propertyType: "",
    budget: "",
    timeline: "",
    selectedProperty: "",
    name: "",
    phone: "",
    email: "",
    listingsShown: false,
    dispatched: false
  },

  // Finite Booking State Machine
  booking: {
    step: "none", // "none" | "DATETIME" | "CONFIRM" | "DONE"
    property: "",
    address: "",
    dateTime: "",
    reference: "",
    confirmed: false,
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
  initTesterEmailUI();
  initFeedbackSystem();

  const savedHistory = localStorage.getItem("propertyai_history");
  const savedLead = localStorage.getItem("propertyai_current_lead");
  const savedBooking = localStorage.getItem("propertyai_current_booking");

  if (savedLead) {
    try {
      state.lead = { ...state.lead, ...JSON.parse(savedLead) };
    } catch (e) {}
  }

  if (savedBooking) {
    try {
      state.booking = { ...state.booking, ...JSON.parse(savedBooking) };
    } catch (e) {}
  }

  if (savedHistory) {
    try {
      const parsed = JSON.parse(savedHistory);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.chatHistory = parsed;
        renderSavedHistory();
        return;
      }
    } catch (e) {}
  }
  
  sendWelcomeMessage();
});

// Render Welcome Greeting
function sendWelcomeMessage() {
  const msgEl = document.createElement("div");
  msgEl.className = "welcome-section space-y-3 mb-2 message-animate";

  msgEl.innerHTML = `
    <!-- Welcome Card -->
    <div class="bg-[#0F1728]/85 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg">
      <h2 class="text-base sm:text-lg font-bold text-white mb-1.5 leading-snug">Welcome to PropertyAI Concierge</h2>
      <p class="text-slate-400 text-xs sm:text-sm leading-relaxed">
        I help you find verified listings, book private viewings, and explore off-market deals.
      </p>
    </div>

    <!-- 2x2 Bento Action Cards -->
    <div class="grid grid-cols-2 gap-2.5 sm:gap-3">
      <button onclick="askSuggestedQuestion('I am looking to buy a luxury residential home.')" class="bg-[#0F1728]/85 hover:bg-[#131F35] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] group cursor-pointer shadow-sm">
        <i class="fa-solid fa-house text-emerald-400 text-xl mb-3 block group-hover:scale-105 transition-transform"></i>
        <span class="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors block leading-snug">Buy a Luxury Home</span>
      </button>

      <button onclick="askSuggestedQuestion('I would like to schedule a private VIP home showing in Miami.')" class="bg-[#0F1728]/85 hover:bg-[#131F35] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] group cursor-pointer shadow-sm">
        <i class="fa-regular fa-calendar-check text-emerald-400 text-xl mb-3 block group-hover:scale-105 transition-transform"></i>
        <span class="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors block leading-snug">Schedule a Showing</span>
      </button>

      <button onclick="askSuggestedQuestion('I am looking for high-yield investment properties.')" class="bg-[#0F1728]/85 hover:bg-[#131F35] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] group cursor-pointer shadow-sm">
        <i class="fa-solid fa-chart-line text-emerald-400 text-xl mb-3 block group-hover:scale-105 transition-transform"></i>
        <span class="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors block leading-snug">Investments</span>
      </button>

      <button onclick="askSuggestedQuestion('I want to sell my property for maximum market valuation.')" class="bg-[#0F1728]/85 hover:bg-[#131F35] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] group cursor-pointer shadow-sm">
        <i class="fa-solid fa-tag text-emerald-400 text-xl mb-3 block group-hover:scale-105 transition-transform"></i>
        <span class="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors block leading-snug">Sell / Value Property</span>
      </button>
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
        addUserMessage(prompt);
        processUserTurn(prompt);
      }
    };
  });
}

// Tester Email Bar UI
function initTesterEmailUI() {
  const emailInput = document.getElementById("tester-email-input");
  const saveBtn = document.getElementById("btn-save-tester-email");
  const btnText = document.getElementById("tester-btn-text");

  if (!emailInput || !saveBtn) return;

  if (state.testerEmail) {
    emailInput.value = state.testerEmail;
    if (btnText) btnText.textContent = "Saved ✓";
    saveBtn.classList.add("bg-emerald-600");
  }

  saveBtn.addEventListener("click", () => {
    window.saveTesterEmail();
  });

  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      window.saveTesterEmail();
    }
  });
}

window.saveTesterEmail = function() {
  const emailInput = document.getElementById("tester-email-input");
  const saveBtn = document.getElementById("btn-save-tester-email");
  const btnText = document.getElementById("tester-btn-text");
  if (!emailInput) return;

  const email = emailInput.value.trim().toLowerCase();
  const valid = isValidEmail(email);

  if (!valid) {
    showResetToast("Please enter a valid email address (e.g. name@domain.com)");
    emailInput.focus();
    return;
  }

  state.testerEmail = email;
  localStorage.setItem("propertyai_tester_email", email);

  if (btnText) btnText.textContent = "Saved ✓";
  if (saveBtn) {
    saveBtn.classList.remove("bg-emerald-500", "hover:bg-emerald-400");
    saveBtn.classList.add("bg-emerald-600");
  }

  showResetToast(`✅ Live lead reports activated for: ${email}`);

  // Send activation ping to n8n webhook
  fetch(state.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "tester_email_saved",
      chatInput: `Live tester email connected: ${email}`,
      sessionId: state.sessionId,
      testerEmail: email,
      lead: {
        email: email,
        testerEmail: email,
        phone: "Verified Session",
        location: "Miami / Global",
        budget: "Live Alerts Active",
        timeline: "Instant"
      },
      timestamp: new Date().toISOString()
    })
  }).catch(() => {});
};

window.askSuggestedQuestion = function(questionText) {
  if (!questionText) return;
  addUserMessage(questionText);
  processUserTurn(questionText);
};

// Initiate private showing booking for a specific listing
window.selectPropertyAndInquire = function(propTitle) {
  state.booking.property = propTitle;
  state.lead.selectedProperty = propTitle;
  state.booking.address = `${state.lead.location || "Miami Metro"} • Prime Waterfront`;
  saveHistory();

  const isUrdu = state.language === "ur";
  const userMsg = isUrdu 
    ? `میں "${propTitle}" کے لیے پرائیویٹ وی آئی پی ٹور بک کرنا چاہتا ہوں۔` 
    : `I would like to reserve a private showing for "${propTitle}".`;
  
  addUserMessage(userMsg);
  
  // Transition directly into booking flow (DATETIME step)
  state.booking.step = "DATETIME";
  saveHistory();

  showTypingIndicator();
  setTimeout(() => {
    hideTypingIndicator();
    if (isUrdu) {
      let prompt = `مجھے **${propTitle}** کے لیے آپ کا پرائیویٹ وی آئی پی ٹور بک کرنے میں بے حد خوشی ہوگی۔\n\nآپ کے لیے کون سا **دن اور وقت** مناسب رہے گا؟ (مثلاً: *ہفتہ دوپہر 2:00 بجے* یا *کل صبح 11:00 بجے*)`;
      prompt += renderDateTimeChips(true);
      sendBotMessage(prompt, true);
    } else {
      let prompt = `I would be delighted to arrange your private VIP tour of **${propTitle}**.\n\nWhat **date and time** works best for your schedule? (e.g., *Saturday at 2:00 PM* or *Tomorrow morning*)`;
      prompt += renderDateTimeChips(false);
      sendBotMessage(prompt, true);
    }
  }, 350);
};

// Add User Message to UI
function addUserMessage(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex justify-end message-animate";
  
  const isUrdu = isUrduText(text);
  const rtlAttr = isUrdu ? 'dir="rtl" style="text-align: right;"' : '';

  msgEl.innerHTML = `
    <div class="max-w-[85%] sm:max-w-[78%]">
      <div class="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-md text-xs sm:text-sm leading-relaxed" ${rtlAttr}>
        ${escapeHTML(text)}
      </div>
      <div class="text-[10px] text-slate-500 text-right mt-1 pr-1">${time}</div>
    </div>
  `;
  chatMessages.appendChild(msgEl);
  scrollToBottom();
  
  state.chatHistory.push({ role: "user", content: text, time });
  saveHistory();
}

// Add Bot Message to UI (supports HTML or Markdown)
function sendBotMessage(content, isRawHtml = false) {
  hideTypingIndicator();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex items-start gap-2.5 message-animate";

  const isUrdu = state.language === "ur" || isUrduText(content);
  const rtlAttr = isUrdu ? 'dir="rtl" style="text-align: right;"' : '';
  const formattedContent = isRawHtml ? content : formatMarkdown(content);

  msgEl.innerHTML = `
    <div class="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xs shrink-0 shadow-sm mt-0.5">
      <i class="fa-solid fa-house text-[11px]"></i>
    </div>
    <div class="max-w-[92%] sm:max-w-[85%] w-full">
      <div class="bg-[#0F1728]/90 border border-slate-800/90 text-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md text-xs sm:text-sm leading-relaxed" ${rtlAttr}>
        ${formattedContent}
      </div>
      <div class="text-[10px] text-slate-500 mt-1 flex items-center justify-between px-1">
        <span>${time}</span>
        <button type="button" onclick="openFeedbackModal('Response Quality')" class="text-slate-500 hover:text-emerald-400 text-[10px] flex items-center gap-1 transition-colors cursor-pointer" title="Rate this response">
          <i class="fa-regular fa-star text-[9px] text-amber-400/80"></i>
          <span>${isUrdu ? 'رائے دیں' : 'Feedback'}</span>
        </button>
      </div>
    </div>
  `;

  chatMessages.appendChild(msgEl);
  scrollToBottom();
  
  state.chatHistory.push({ role: "assistant", content: content, isHtml: isRawHtml, time });
  saveHistory();
}

let typingTimer = null;
let typingDotsTimer = null;

function showTypingIndicator(customStatus = "") {
  if (document.getElementById("typing-indicator")) return;
  const typingEl = document.createElement("div");
  typingEl.id = "typing-indicator";
  typingEl.className = "flex items-start gap-2.5 message-animate";
  typingEl.innerHTML = `
    <div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs shrink-0 mt-0.5">
      <i class="fa-solid fa-house text-[11px]"></i>
    </div>
    <div class="bg-[#0F1728]/90 border border-slate-800/90 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 shadow-md">
      <div class="flex items-center gap-1.5">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
      <span id="typing-status-text" class="text-[11px] text-emerald-400/80 font-medium ml-1.5 transition-all">${customStatus}</span>
    </div>
  `;
  chatMessages.appendChild(typingEl);
  scrollToBottom();

  // Progressive latency indicator
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    const el = document.getElementById("typing-status-text");
    if (el) el.textContent = state.language === "ur" ? "پراپرٹی ڈیٹا بیس سے معلومات حاصل کی جا رہی ہیں..." : "Consulting verified property database...";
  }, 4000);

  clearTimeout(typingDotsTimer);
  typingDotsTimer = setTimeout(() => {
    const el = document.getElementById("typing-status-text");
    if (el) el.textContent = state.language === "ur" ? "جواب تیار ہو رہا ہے..." : "Curating optimal luxury options...";
  }, 9000);
}

function hideTypingIndicator() {
  clearTimeout(typingTimer);
  clearTimeout(typingDotsTimer);
  const typingEl = document.getElementById("typing-indicator");
  if (typingEl) typingEl.remove();
}

function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 150);
  }
}

function saveHistory() {
  try {
    localStorage.setItem("propertyai_history", JSON.stringify(state.chatHistory));
    localStorage.setItem("propertyai_current_lead", JSON.stringify(state.lead));
    localStorage.setItem("propertyai_current_booking", JSON.stringify(state.booking));
  } catch (e) {}
}

function renderSavedHistory() {
  chatMessages.innerHTML = "";
  if (!state.chatHistory || state.chatHistory.length === 0) {
    sendWelcomeMessage();
    return;
  }

  state.chatHistory.forEach(msg => {
    if (msg.role === "user") {
      const isUrdu = isUrduText(msg.content);
      const rtlAttr = isUrdu ? 'dir="rtl" style="text-align: right;"' : '';
      const msgEl = document.createElement("div");
      msgEl.className = "flex justify-end message-animate";
      msgEl.innerHTML = `
        <div class="max-w-[85%] sm:max-w-[78%]">
          <div class="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-md text-xs sm:text-sm leading-relaxed" ${rtlAttr}>
            ${escapeHTML(msg.content)}
          </div>
          <div class="text-[10px] text-slate-500 text-right mt-1 pr-1">${msg.time || ''}</div>
        </div>
      `;
      chatMessages.appendChild(msgEl);
    } else {
      const isUrdu = state.language === "ur" || isUrduText(msg.content);
      const rtlAttr = isUrdu ? 'dir="rtl" style="text-align: right;"' : '';
      const msgEl = document.createElement("div");
      msgEl.className = "flex items-start gap-2.5 message-animate";
      const body = msg.isHtml ? msg.content : formatMarkdown(msg.content);
      msgEl.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xs shrink-0 shadow-sm mt-0.5">
          <i class="fa-solid fa-house text-[11px]"></i>
        </div>
        <div class="max-w-[92%] sm:max-w-[85%] w-full">
          <div class="bg-[#0F1728]/90 border border-slate-800/90 text-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md text-xs sm:text-sm leading-relaxed" ${rtlAttr}>
            ${body}
          </div>
          <div class="text-[10px] text-slate-500 mt-1 flex items-center justify-between px-1">
            <span>${msg.time || ''}</span>
            <button type="button" onclick="openFeedbackModal('Response Quality')" class="text-slate-500 hover:text-emerald-400 text-[10px] flex items-center gap-1 transition-colors cursor-pointer" title="Rate this response">
              <i class="fa-regular fa-star text-[9px] text-amber-400/80"></i>
              <span>${isUrdu ? 'رائے دیں' : 'Feedback'}</span>
            </button>
          </div>
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
  
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>');
  html = html.replace(/^\s*[-•]\s+(.*)$/gm, '<li class="ml-4 list-disc text-slate-300 my-1">$1</li>');
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li class="ml-4 list-decimal text-slate-300 my-1">$2</li>');
  
  html = html.replace(/(<li class="[^"]*list-disc[^"]*">[\s\S]*?<\/li>\s*)+/g, (match) => {
    return `<ul class="space-y-1.5 my-2 pl-2 border-l-2 border-emerald-500/30">${match}</ul>`;
  });
  html = html.replace(/(<li class="[^"]*list-decimal[^"]*">[\s\S]*?<\/li>\s*)+/g, (match) => {
    return `<ol class="space-y-1.5 my-2 pl-2 border-l-2 border-emerald-500/30">${match}</ol>`;
  });

  html = html.replace(/\n\n/g, '<div class="h-2"></div>');
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

// Form Submission Handlers
function handleFormSubmit(inputElement) {
  if (!inputElement) return;
  const query = inputElement.value.trim();
  if (!query) return;

  inputElement.value = "";
  const desktopInput = document.getElementById("chat-input");
  const mobileInput = document.getElementById("chat-input-mobile");
  if (desktopInput) desktopInput.value = "";
  if (mobileInput) mobileInput.value = "";

  addUserMessage(query);
  processUserTurn(query);
}

window.handleMobileSubmit = function(e) {
  if (e) e.preventDefault();
  handleFormSubmit(document.getElementById("chat-input-mobile"));
};

if (chatForm) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleFormSubmit(chatInput);
  });
}

const chatFormMobile = document.getElementById("chat-form-mobile");
if (chatFormMobile) {
  chatFormMobile.addEventListener("submit", (e) => {
    window.handleMobileSubmit(e);
  });
}

// ==========================================
// INTELLIGENT ENTITY EXTRACTORS & VALIDATORS
// ==========================================

// Detect Urdu / Arabic Script
function isUrduText(text) {
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

function isGreeting(text) {
  const clean = text.toLowerCase().trim().replace(/[!.,?]+$/, "");
  const greetingPhrases = [
    "hey", "hi", "hello", "howdy", "sup", "yo", "hola",
    "good morning", "good afternoon", "good evening", "good day",
    "greetings", "hey there", "hi there", "hello there", "what's up", "whats up",
    "سلام", "السلام علیکم", "ہیلو", "ہائے", "کیا حال ہے", "کیسے ہیں"
  ];
  if (greetingPhrases.includes(clean)) return true;
  return /^(hey|hi|hello|howdy|sup|yo|hola|greetings)(\s+(there|propertyai|concierge|bot|assistant|friend|team))?$/i.test(clean);
}

function isConversationalFiller(text) {
  const clean = text.toLowerCase().trim().replace(/[!.,?]+$/, "");
  const fillers = [
    "ok", "okay", "sure", "yes", "yeah", "yup", "no", "nope", "thanks", "thank you",
    "cool", "great", "awesome", "perfect", "good", "nice", "alright", "all right",
    "help", "please", "continue", "start", "proceed", "test",
    "ٹھیک ہے", "بہت اچھا", "شکریہ", "ہاں", "جی ہاں", "نہیں"
  ];
  return fillers.includes(clean);
}

function isAffirmative(text) {
  const clean = text.toLowerCase().trim();
  return /^(yes|yeah|yup|confirm|sure|proceed|sounds good|book it|yes confirm|please confirm|ok|okay|ہاں|جی ہاں|تصدیق کریں)/i.test(clean);
}

function isChangeTime(text) {
  const clean = text.toLowerCase().trim();
  return clean.includes("change") || clean.includes("different time") || clean.includes("reschedule") || clean.includes("دوسرا وقت") || clean.includes("تبدیل");
}

function isValidEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.([a-zA-Z]{2,})/);
  if (!match) return null;
  const email = match[0].toLowerCase();
  const tld = match[1].toLowerCase();
  const commonTLDs = [
    "com", "org", "net", "edu", "gov", "mil", "co", "io", "ai", "me", "info", "biz",
    "uk", "ca", "us", "de", "fr", "au", "pk", "in", "ae", "sa", "eu", "app", "dev", "tech", "store", "online", "pro", "realestate"
  ];
  if (!commonTLDs.includes(tld)) return null;
  return email;
}

function isValidPhone(text) {
  const digits = text.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  if (/^(\d)\1{5,}$/.test(digits)) return null;
  return text.trim();
}

function cleanAndValidateName(text) {
  const cleaned = text
    .replace(/^(my name is|i am|i'm|this is|call me|name is|میرا نام|نام ہے)\s+/i, "")
    .replace(/[.!,?].*$/, "")
    .trim();
  if (cleaned.length >= 2 && !/\d{2,}/.test(cleaned)) {
    return cleaned.replace(/\b\w/g, l => l.toUpperCase());
  }
  return null;
}

function extractBudget(text) {
  let val = null;
  const dollarMatch = text.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:k|m|million|thousand|grand)?)/i);
  if (dollarMatch && dollarMatch[1]) {
    val = "$" + dollarMatch[1].trim().replace(/\s+/g, "").toUpperCase();
  } else {
    const keywordMatch = text.match(/(?:under|below|up to|around|budget|price|max|approx)\s*[:\$]?\s*(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:k|m|million|thousand|grand)?)/i);
    if (keywordMatch && keywordMatch[1]) {
      val = "$" + keywordMatch[1].trim().replace(/\s+/g, "").toUpperCase();
    } else {
      const suffixMatch = text.match(/\b(\d+(?:\.\d+)?\s*(?:k|m|million|grand))\b/i);
      if (suffixMatch && suffixMatch[1]) {
        val = "$" + suffixMatch[1].trim().replace(/\s+/g, "").toUpperCase();
      }
    }
  }
  return val;
}

function formatListingPrice(rawBudget, offsetPercent = 0) {
  if (!rawBudget) return "$850,000";
  let num = 0;
  const clean = String(rawBudget).replace(/[^0-9.km]/gi, "").toLowerCase();
  if (clean.includes("m")) num = parseFloat(clean.replace("m", "")) * 1000000;
  else if (clean.includes("k")) num = parseFloat(clean.replace("k", "")) * 1000;
  else num = parseFloat(clean);
  if (!num || isNaN(num) || num < 50000) num = 1200000;
  const adjusted = Math.round((num * (1 + offsetPercent / 100)) / 1000) * 1000;
  return "$" + adjusted.toLocaleString("en-US");
}

function extractTimeline(text) {
  const lower = text.toLowerCase();
  if (lower.includes("immediate") || lower.includes("asap") || lower.includes("ready") || lower.includes("فوری")) return "Immediate / Ready Now";
  if (lower.includes("30") || lower.includes("60") || lower.includes("1 month") || lower.includes("2 month") || lower.includes("دن")) return "30–60 Days";
  if (lower.includes("90") || lower.includes("3 month") || lower.includes("6 month") || lower.includes("ماہ")) return "3–6 Months";
  if (lower.includes("flexible") || lower.includes("لچکدار")) return "Flexible";
  return null;
}

const KNOWN_CITIES = [
  "miami", "brickell", "south beach", "miami beach", "palm beach", "boca raton", "fort lauderdale", "naples",
  "new york", "manhattan", "brooklyn", "tribeca", "soho", "los angeles", "beverly hills", "malibu", "bel air",
  "austin", "dallas", "houston", "chicago", "boston", "scottsdale", "aspen", "dubai", "london",
  "میامی", "نیویارک", "لاس اینجلس", "دبئی", "لندن"
];

function extractLocation(text) {
  if (isGreeting(text) || isConversationalFiller(text)) return null;
  const lower = text.toLowerCase().trim();
  for (const c of KNOWN_CITIES) {
    if (lower.includes(c)) {
      if (c === "میامی") return "Miami";
      if (c === "نیویارک") return "New York";
      if (c === "لاس اینجلس") return "Los Angeles";
      if (c === "دبئی") return "Dubai";
      return c.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }
  return null;
}

function extractPropertyType(text) {
  const lower = text.toLowerCase();
  if (lower.includes("penthouse") || lower.includes("پینٹ ہاؤس")) return "Luxury Penthouse";
  if (lower.includes("villa") || lower.includes("ولا")) return "Private Waterfront Villa";
  if (lower.includes("condo") || lower.includes("condominium") || lower.includes("کونڈو")) return "Modern High-Rise Condominium";
  if (lower.includes("single family") || lower.includes("house") || lower.includes("home") || lower.includes("گھر")) return "Single-Family Home";
  return null;
}

// Generate Realistic Verified Property Listings with Branded Fallback SVG Graphic
function generateListingsHtml(lead, isUrdu = false) {
  const loc = lead.location || (isUrdu ? "میامی" : "Miami Metro");
  const type = lead.propertyType || (isUrdu ? "لگژری ہوم" : "Luxury Home");
  const rawBudget = lead.budget || "$1,250,000";

  // Sleek architectural SVG fallback that renders immediately if image is slow or blocked
  const brandedFallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300' viewBox='0 0 600 300'><defs><linearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23064e3b'/><stop offset='50%25' stop-color='%230f172a'/><stop offset='100%25' stop-color='%23022c22'/></linearGradient></defs><rect width='600' height='300' fill='url(%23bg)'/><path d='M150,220 L300,90 L450,220 Z' fill='%2310b981' opacity='0.75'/><rect x='220' y='160' width='160' height='60' fill='%23059669'/><rect x='280' y='180' width='40' height='40' fill='%2334d399'/><circle cx='460' cy='80' r='20' fill='%23f59e0b' opacity='0.8'/><text x='300' y='265' font-family='system-ui,sans-serif' font-size='13' font-weight='700' fill='%23a7f3d0' text-anchor='middle' letter-spacing='2'>VERIFIED LUXURY LISTING</text></svg>";
  
  const properties = [
    {
      title: `The Grand Panorama — ${type}`,
      location: `${loc} • Prime Waterfront`,
      price: formatListingPrice(rawBudget, 0),
      beds: isUrdu ? "3 بیڈ رومز" : "3 Beds",
      baths: isUrdu ? "3.5 باتھ" : "3.5 Baths",
      sqft: "2,680 Sq Ft",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
      tag: isUrdu ? "تصدیق شدہ خصوصی" : "Verified Exclusive"
    },
    {
      title: `Azure Vista Modern Villa`,
      location: `${loc} • Gated Enclave`,
      price: formatListingPrice(rawBudget, 4),
      beds: isUrdu ? "4 بیڈ رومز" : "4 Beds",
      baths: isUrdu ? "4 باتھ" : "4 Baths",
      sqft: "3,400 Sq Ft",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
      tag: isUrdu ? "آف مارکیٹ ڈیل" : "Off-Market Deal"
    },
    {
      title: `The Reserve High-Rise Suite`,
      location: `${loc} • Financial District`,
      price: formatListingPrice(rawBudget, -5),
      beds: isUrdu ? "3 بیڈ رومز" : "3 Beds",
      baths: isUrdu ? "2.5 باتھ" : "2.5 Baths",
      sqft: "2,150 Sq Ft",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80",
      tag: isUrdu ? "قیمت پر بات چیت ممکن" : "Price Negotiable"
    }
  ];

  let cardsHtml = `
    <div class="mb-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
          <i class="fa-solid fa-sparkles text-amber-400"></i>
          ${isUrdu ? 'آپ کی ترجیحات کے مطابق 3 تصدیق شدہ پراپرٹیز ملیں:' : 'Found 3 Matching Verified Properties:'}
        </span>
        <span class="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">${escapeHTML(loc)}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
  `;

  properties.forEach(p => {
    cardsHtml += `
      <div class="property-card-glow bg-slate-950/80 rounded-xl border border-slate-800/90 overflow-hidden flex flex-col group">
        <div class="relative h-28 overflow-hidden bg-slate-900">
          <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${brandedFallbackSvg}';">
          <span class="absolute top-1.5 left-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            ${p.tag}
          </span>
          <span class="absolute bottom-1.5 right-1.5 bg-slate-900/90 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded border border-slate-800">
            ${escapeHTML(p.price)}
          </span>
        </div>
        <div class="p-2.5 flex-1 flex flex-col justify-between">
          <div>
            <h4 class="text-xs font-semibold text-white truncate">${escapeHTML(p.title)}</h4>
            <p class="text-[10px] text-slate-400 truncate mb-1.5">${escapeHTML(p.location)}</p>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-300 pt-1.5 border-t border-slate-800/60 mb-2">
            <span><i class="fa-solid fa-bed text-emerald-400 mr-1"></i>${p.beds}</span>
            <span><i class="fa-solid fa-bath text-teal-400 mr-1"></i>${p.baths}</span>
            <span><i class="fa-solid fa-ruler-combined text-slate-400 mr-1"></i>${p.sqft}</span>
          </div>
          <button onclick="selectPropertyAndInquire('${escapeHTML(p.title)}')" class="w-full py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <i class="fa-solid fa-calendar-check text-[10px]"></i>
            <span>${isUrdu ? 'وی آئی پی ٹور بک کریں' : 'Schedule VIP Tour'}</span>
          </button>
        </div>
      </div>
    `;
  });

  cardsHtml += `
      </div>
    </div>
  `;
  return cardsHtml;
}

// Interactive chips
function renderLocationChips(isUrdu = false) {
  if (isUrdu) {
    return `
      <div class="flex flex-wrap gap-1.5 mt-2.5" dir="rtl">
        <button onclick="askSuggestedQuestion('میامی، فلوریڈا')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🌴 میامی (Miami)</button>
        <button onclick="askSuggestedQuestion('نیویارک')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏙️ نیویارک</button>
        <button onclick="askSuggestedQuestion('لاس اینجلس')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">☀️ لاس اینجلس</button>
        <button onclick="askSuggestedQuestion('دبئی')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">✨ دبئی</button>
      </div>
    `;
  }
  return `
    <div class="flex flex-wrap gap-1.5 mt-2.5">
      <button onclick="askSuggestedQuestion('Miami, Florida')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🌴 Miami</button>
      <button onclick="askSuggestedQuestion('New York City')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏙️ New York</button>
      <button onclick="askSuggestedQuestion('Los Angeles')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">☀️ Los Angeles</button>
      <button onclick="askSuggestedQuestion('Austin, Texas')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🌵 Austin</button>
      <button onclick="askSuggestedQuestion('Dubai')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">✨ Dubai</button>
    </div>
  `;
}

function renderPropertyTypeChips(isUrdu = false) {
  if (isUrdu) {
    return `
      <div class="flex flex-wrap gap-1.5 mt-2.5" dir="rtl">
        <button onclick="askSuggestedQuestion('سنگل فیملی گھر')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏡 سنگل فیملی گھر</button>
        <button onclick="askSuggestedQuestion('پینٹ ہاؤس')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏙️ پینٹ ہاؤس</button>
        <button onclick="askSuggestedQuestion('واٹر فرنٹ ولا')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🌊 واٹر فرنٹ ولا</button>
        <button onclick="askSuggestedQuestion('لگژری کونڈو')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏢 لگژری کونڈو</button>
      </div>
    `;
  }
  return `
    <div class="flex flex-wrap gap-1.5 mt-2.5">
      <button onclick="askSuggestedQuestion('3-bedroom Single-Family Home')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏡 Single-Family</button>
      <button onclick="askSuggestedQuestion('Luxury Penthouse with Skyline Views')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏙️ Penthouse</button>
      <button onclick="askSuggestedQuestion('Modern High-Rise Condominium')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏢 Modern Condo</button>
      <button onclick="askSuggestedQuestion('Private Waterfront Villa')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🌊 Waterfront Villa</button>
    </div>
  `;
}

function renderBudgetChips(isUrdu = false) {
  return `
    <div class="flex flex-wrap gap-1.5 mt-2.5" ${isUrdu ? 'dir="rtl"' : ''}>
      <button onclick="askSuggestedQuestion('$500,000 to $800,000')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">💵 $500k – $800k</button>
      <button onclick="askSuggestedQuestion('$1,000,000 to $1,500,000')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">💎 $1M – $1.5M</button>
      <button onclick="askSuggestedQuestion('$2,000,000 to $3,500,000')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">👑 $2M – $3.5M</button>
      <button onclick="askSuggestedQuestion('$5,000,000+ Luxury Portfolio')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏰 $5M+ Trophy Asset</button>
    </div>
  `;
}

function renderTimelineChips(isUrdu = false) {
  if (isUrdu) {
    return `
      <div class="flex flex-wrap gap-1.5 mt-2.5" dir="rtl">
        <button onclick="askSuggestedQuestion('فوری / تیار')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">⚡ فوری / تیار</button>
        <button onclick="askSuggestedQuestion('30 سے 60 دن')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">📅 30 سے 60 دن</button>
        <button onclick="askSuggestedQuestion('3 سے 6 ماہ')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">⏳ 3 سے 6 ماہ</button>
        <button onclick="askSuggestedQuestion('لچکدار وقت')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🌴 لچکدار وقت</button>
      </div>
    `;
  }
  return `
    <div class="flex flex-wrap gap-1.5 mt-2.5">
      <button onclick="askSuggestedQuestion('Immediate / Ready Now')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">⚡ Immediate / Ready Now</button>
      <button onclick="askSuggestedQuestion('Within 30 to 60 Days')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">📅 30–60 Days</button>
      <button onclick="askSuggestedQuestion('3 to 6 Months')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">⏳ 3–6 Months</button>
      <button onclick="askSuggestedQuestion('Flexible timeline / Exploring options')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🌴 Flexible</button>
    </div>
  `;
}

function renderDateTimeChips(isUrdu = false) {
  if (isUrdu) {
    return `
      <div class="flex flex-wrap gap-1.5 mt-2.5" dir="rtl">
        <button onclick="askSuggestedQuestion('کل صبح 11:00 بجے')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">📅 کل صبح 11:00 بجے</button>
        <button onclick="askSuggestedQuestion('ہفتہ دوپہر 2:00 بجے')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">📅 ہفتہ دوپہر 2:00 بجے</button>
        <button onclick="askSuggestedQuestion('اتوار شام 4:00 بجے')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">📅 اتوار شام 4:00 بجے</button>
      </div>
    `;
  }
  return `
    <div class="flex flex-wrap gap-1.5 mt-2.5">
      <button onclick="askSuggestedQuestion('Tomorrow at 11:00 AM')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">📅 Tomorrow at 11:00 AM</button>
      <button onclick="askSuggestedQuestion('Saturday at 2:00 PM')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">📅 Saturday at 2:00 PM</button>
      <button onclick="askSuggestedQuestion('Sunday at 4:00 PM')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">📅 Sunday at 4:00 PM</button>
    </div>
  `;
}

function renderBookingConfirmChips(isUrdu = false) {
  if (isUrdu) {
    return `
      <div class="flex flex-wrap gap-1.5 mt-2.5" dir="rtl">
        <button onclick="askSuggestedQuestion('جی ہاں، تصدیق کریں')" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/60 text-[11px] font-semibold text-white transition-all">✅ جی ہاں، تصدیق کریں</button>
        <button onclick="askSuggestedQuestion('وقت تبدیل کریں')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 transition-all">🕒 وقت تبدیل کریں</button>
      </div>
    `;
  }
  return `
    <div class="flex flex-wrap gap-1.5 mt-2.5">
      <button onclick="askSuggestedQuestion('Yes, Confirm VIP Tour')" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/60 text-[11px] font-semibold text-white transition-all">✅ Confirm VIP Tour</button>
      <button onclick="askSuggestedQuestion('Change Date and Time')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 transition-all">🕒 Change Date/Time</button>
    </div>
  `;
}

// ==========================================
// N8N AI BOT INTEGRATION (Live Backend Engine)
// ==========================================
async function sendToN8nBot(userText) {
  const targetTester = state.testerEmail || state.lead.email || "";
  const payload = {
    action: "chat",
    chatInput: userText,
    message: userText,
    sessionId: state.sessionId,
    testerEmail: targetTester,
    lead: {
      ...state.lead,
      testerEmail: targetTester
    },
    history: state.chatHistory.slice(-8),
    timestamp: new Date().toISOString()
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 16000);

  try {
    const response = await fetch(state.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify(payload)
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      let replyText = "";
      if (typeof data === "string") replyText = data;
      else if (data.output) replyText = data.output;
      else if (data.text) replyText = data.text;
      else if (data.response) replyText = data.response;
      else if (data.message) replyText = data.message;
      else if (data.reply) replyText = data.reply;
      else if (Array.isArray(data) && data[0]) {
        replyText = data[0].output || data[0].text || data[0].response || data[0].message || JSON.stringify(data[0]);
      } else {
        replyText = JSON.stringify(data);
      }
      return { success: true, text: replyText };
    } else {
      return { success: false, status: response.status };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    return { success: false, error: err.message };
  }
}

// ==========================================
// MAIN CONVERSATIONAL CONTROLLER
// ==========================================
async function processUserTurn(userText) {
  showTypingIndicator();

  const text = userText.trim();
  const lower = text.toLowerCase();
  const lead = state.lead;
  const booking = state.booking;

  // Language Detection: switch to Urdu if user inputs Urdu script
  if (isUrduText(text)) {
    state.language = "ur";
  }
  const isUrdu = state.language === "ur";

  // Opportunistic extraction to keep profile up to date
  const emailInMsg = isValidEmail(text);
  if (emailInMsg && !lead.email) lead.email = emailInMsg;

  const phoneInMsg = isValidPhone(text);
  if (phoneInMsg && !lead.phone) lead.phone = phoneInMsg;

  const budgetInMsg = extractBudget(text);
  if (budgetInMsg && !lead.budget) lead.budget = budgetInMsg;

  const locInMsg = extractLocation(text);
  if (locInMsg && !lead.location) lead.location = locInMsg;

  const propTypeInMsg = extractPropertyType(text);
  if (propTypeInMsg && !lead.propertyType) lead.propertyType = propTypeInMsg;

  const timelineInMsg = extractTimeline(text);
  if (timelineInMsg && !lead.timeline) lead.timeline = timelineInMsg;

  saveHistory();

  // ==========================================
  // 1. FINITE BOOKING STATE MACHINE (BUG 1 FIX)
  // ==========================================
  if (booking.step === "DATETIME") {
    // User is submitting date/time for the selected property
    if (isGreeting(text) || isConversationalFiller(text)) {
      hideTypingIndicator();
      const prompt = isUrdu
        ? `خوش آمدید! ہم **${booking.property || 'آپ کی منتخب کردہ پراپرٹی'}** کے لیے پرائیویٹ وی آئی پی ٹور شیڈول کر رہے ہیں۔ آپ کے لیے کون سا **دن اور وقت** مناسب رہے گا؟`
        : `Hello! Continuing with scheduling your private VIP tour for **${booking.property || 'your selected property'}**: What **date and time** works best for you?`;
      sendBotMessage(prompt + renderDateTimeChips(isUrdu), true);
      return;
    }

    // Set Date & Time
    booking.dateTime = text.replace(/^(date|time|on|at|scheduled for)\s+/i, "").trim();
    booking.step = "CONFIRM";
    saveHistory();

    hideTypingIndicator();
    const clientName = lead.name || (isUrdu ? "آپ کے لیے" : "you");
    const confirmPrompt = isUrdu
      ? `بہترین! میں نے **${clientName}** کے لیے **${booking.property}** کا وی آئی پی ٹور **${booking.dateTime}** پر مخصوص کیا ہے۔\n\nکیا آپ اس پرائیویٹ ٹور کی حتمی تصدیق کرنا چاہتے ہیں؟`
      : `Excellent! I have reserved a provisional VIP tour for **${booking.property}** on **${booking.dateTime}** for **${clientName}**.\n\nWould you like me to confirm this private viewing?`;

    sendBotMessage(confirmPrompt + renderBookingConfirmChips(isUrdu), true);
    return;
  }

  if (booking.step === "CONFIRM") {
    if (isChangeTime(text)) {
      booking.step = "DATETIME";
      saveHistory();
      hideTypingIndicator();
      const changePrompt = isUrdu
        ? `کوئی مسئلہ نہیں۔ آپ **${booking.property}** کے لیے کون سا نیا **دن اور وقت** ترجیح دیں گے؟`
        : `No problem at all! What alternate **date and time** would you prefer for **${booking.property}**?`;
      sendBotMessage(changePrompt + renderDateTimeChips(isUrdu), true);
      return;
    }

    if (isAffirmative(text) || isGreeting(text) || isConversationalFiller(text)) {
      booking.step = "DONE";
      booking.confirmed = true;
      if (!booking.reference) {
        booking.reference = "PA-" + Math.floor(100000 + Math.random() * 900000);
      }
      saveHistory();

      const targetEmail = lead.email || state.testerEmail || "";
      const propTitle = booking.property || lead.selectedProperty || "The Grand Panorama — Luxury Home";
      const propAddress = booking.address || `${lead.location || "Miami Metro"} • Prime Waterfront (100 Ocean Drive, Miami Beach, FL)`;
      const buyerName = lead.name || "Valued Client";
      const buyerPhone = lead.phone || "Verified Mobile";

      // Render Confirmation Artifact Card
      const artifactHtml = `
        <div class="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/50 rounded-2xl p-4 sm:p-5 shadow-xl text-left message-animate">
          <div class="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-sm shadow-md shadow-emerald-500/25">
                <i class="fa-solid fa-calendar-check"></i>
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-bold text-white">${isUrdu ? 'وی آئی پی ٹور کنفرم ہو گیا!' : 'VIP Viewing Confirmed'}</h3>
                <p class="text-[10px] text-emerald-400 font-medium">${isUrdu ? 'پراپرٹی ایڈوائزر بکنگ' : 'Autonomous Concierge Booking'}</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold tracking-wider">${booking.reference}</span>
          </div>
          <div class="space-y-2 text-xs text-slate-200 mb-3" ${isUrdu ? 'dir="rtl"' : ''}>
            <div class="flex items-start justify-between"><span class="text-slate-400 text-[11px]">${isUrdu ? '🏡 پراپرٹی:' : '🏡 Property:'}</span><span class="font-semibold text-white text-right">${escapeHTML(propTitle)}</span></div>
            <div class="flex items-start justify-between"><span class="text-slate-400 text-[11px]">${isUrdu ? '📍 پتہ:' : '📍 Address:'}</span><span class="text-right text-slate-300">${escapeHTML(propAddress)}</span></div>
            <div class="flex items-start justify-between"><span class="text-slate-400 text-[11px]">${isUrdu ? '📅 دن اور وقت:' : '📅 Date & Time:'}</span><span class="font-bold text-emerald-400 text-right">${escapeHTML(booking.dateTime || "Saturday at 2:00 PM")}</span></div>
            <div class="flex items-start justify-between"><span class="text-slate-400 text-[11px]">${isUrdu ? '👤 خریدار کا نام:' : '👤 Buyer Name:'}</span><span class="font-semibold text-white text-right">${escapeHTML(buyerName)}</span></div>
            <div class="flex items-start justify-between"><span class="text-slate-400 text-[11px]">${isUrdu ? '📞 موبائل نمبر:' : '📞 Phone:'}</span><span class="text-slate-300 text-right">${escapeHTML(buyerPhone)}</span></div>
          </div>
          <div class="pt-2.5 border-t border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-300" ${isUrdu ? 'dir="rtl"' : ''}>
            <i class="fa-solid fa-circle-check text-emerald-400 shrink-0"></i>
            <span>${isUrdu ? `تصدیقی ای میل بھیج دی گئی ہے: <strong>${escapeHTML(targetEmail)}</strong>` : `Confirmation sent to <strong>${escapeHTML(targetEmail)}</strong>`}</span>
          </div>
        </div>
      `;

      sendBotMessage(artifactHtml, true);

      // Dispatch booking email notification
      dispatchBookingNotification();
      return;
    }
  }

  // ==========================================
  // 2. SMALL TALK RESILIENCE & CONVERSATION MEMORY (BUG 3 FIX)
  // ==========================================
  if (isGreeting(text) || isConversationalFiller(text)) {
    hideTypingIndicator();

    if (lead.step === "criteria") {
      let greet = isUrdu
        ? `خوش آمدید! 👋 میں پراپرٹی اے آئی کنسیئر ہوں، آپ کا خودکار رئیل اسٹیٹ ایڈوائزر۔\n\nآپ کس **شہر یا علاقے** میں لگژری پراپرٹی تلاش کرنا چاہتے ہیں؟`
        : `Hello! 👋 It's great to connect. I'm your autonomous real estate concierge powered by Automatixes.\n\nWhich **city or area** would you like to explore today?`;
      greet += renderLocationChips(isUrdu);
      sendBotMessage(greet, true);
      lead.waitingFor = "location";
      return;
    }

    if (lead.step === "ask_name") {
      const msg = isUrdu
        ? `خوش آمدید! آپ کے لیے ان تصدیق شدہ لسٹنگز کو محفوظ کرنے کے لیے براہ کرم اپنا **مکمل نام** درج کریں۔`
        : `Hello! To proceed with reserving these exclusive listings for you, may I please have your **full name**?`;
      sendBotMessage(msg);
      return;
    }

    if (lead.step === "ask_phone") {
      const msg = isUrdu
        ? `شکریہ **${lead.name}**! پرائیویٹ ٹور کی تصدیق اور ایس ایم ایس الرٹس کے لیے اپنا **موبائل فون نمبر** فراہم کریں۔`
        : `Hello **${lead.name}**! Please share your **mobile phone number** so our property specialist can send you private viewing confirmations.`;
      sendBotMessage(msg);
      return;
    }

    if (lead.step === "ask_email") {
      const msg = isUrdu
        ? `شکریہ! پراپرٹی پورٹ فولیو اور فلور پلانز بھیجنے کے لیے اپنا **ای میل ایڈریس** فراہم کریں۔`
        : `Hello! What is your **primary email address** so we can send over the property brochure and floor plans?`;
      sendBotMessage(msg);
      return;
    }

    if (lead.step === "completed") {
      const msg = isUrdu
        ? `خوش آمدید **${lead.name || ''}**! آپ کی تفصیلات ہمارے ریکارڈ میں محفوظ ہیں۔ کیا آپ کسی پراپرٹی کا ٹور بک کرنا چاہتے ہیں یا نیا سرچ کرنا چاہتے ہیں؟`
        : `Hello **${lead.name || ''}**! Your property inquiry is safely confirmed with our team. Would you like to schedule a private tour of any listing or explore additional areas?`;
      sendBotMessage(msg);
      return;
    }
  }

  // Quick Action: "Schedule a Showing"
  if (lower.includes("schedule a showing") || lower.includes("schedule a private") || lower.includes("ٹور بک") || lower.includes("دکھائیں")) {
    hideTypingIndicator();
    lead.intent = "Schedule VIP Showing";
    if (!lead.listingsShown) {
      lead.listingsShown = true;
      lead.step = "ask_name";
      const listingsHtml = generateListingsHtml(lead, isUrdu);
      const prompt = isUrdu
        ? `${listingsHtml}<div class="mt-2 text-slate-200">یہاں دستیاب تصدیق شدہ پراپرٹیز ہیں۔ کسی بھی پراپرٹی پر <strong>وی آئی پی ٹور بک کریں</strong> پر کلک کریں، یا اپنا <strong>مکمل نام</strong> درج کریں۔</div>`
        : `${listingsHtml}<div class="mt-2 text-slate-200">Here are verified properties available for private viewings. Click <strong>Schedule VIP Tour</strong> on any listing above, or tell me your <strong>full name</strong> to begin.</div>`;
      sendBotMessage(prompt, true);
      return;
    }
  }

  // ==========================================
  // 3. LEAD CONTACT CAPTURE FLOW (NAME -> PHONE -> EMAIL)
  // ==========================================
  if (lead.step === "ask_email") {
    const validEmail = isValidEmail(text);
    if (!validEmail) {
      hideTypingIndicator();
      const err = isUrdu
        ? `براہ کرم ایک درست ای میل ایڈریس درج کریں (مثلاً: **name@domain.com**)`
        : `That doesn't appear to be a complete email address. Please share a valid email (e.g. **name@domain.com**) so we can send over the verified listing dossier.`;
      sendBotMessage(err);
      return;
    }
    lead.email = validEmail;
    lead.step = "completed";
    lead.waitingFor = "none";
    saveHistory();

    // Dispatch lead immediately
    await dispatchLeadNotification();

    const summaryCard = isUrdu ? `
🎉 **شکریہ، ${lead.name}! آپ کی پراپرٹی کی درخواست کامیابی سے ریکارڈ ہو گئی ہے۔**

آپ کی تفصیلات کا خلاصہ:
- 👤 **کلائنٹ کا نام:** ${lead.name}
- 📞 **موبائل نمبر:** ${lead.phone}
- ✉️ **ای میل ایڈریس:** ${lead.email}
- 🏡 **دلچسپی:** ${lead.intent || 'لگژری رئیل اسٹیٹ'}
- 📍 **علاقہ:** ${lead.location || 'میامی'}
- 💰 **بجٹ:** ${lead.budget || 'کسٹم بجٹ'}
- ⏱️ **وقت:** ${lead.timeline || 'لچکدار'}
${lead.selectedProperty ? `- 🏷️ **منتخب پراپرٹی:** ${lead.selectedProperty}\n` : ''}
**ہماری ٹیم جلد ہی آپ سے رابطہ کرے گی۔**
    `.trim() : `
🎉 **Thank you, ${lead.name}! Your property request has been confirmed.**

Here is your recorded inquiry summary:
- 👤 **Client Name:** ${lead.name}
- 📞 **Mobile (SMS):** ${lead.phone}
- ✉️ **Email Address:** ${lead.email}
- 🏡 **Interest:** ${lead.intent || 'Luxury Real Estate'}
- 📍 **Target Area:** ${lead.location || 'Miami Metro'}
- 💰 **Budget:** ${lead.budget || 'Custom Range'}
- ⏱️ **Timeline:** ${lead.timeline || 'Flexible'}
${lead.selectedProperty ? `- 🏷️ **Selected Property:** ${lead.selectedProperty}\n` : ''}
**Our team will contact you soon.**
    `.trim();

    sendBotMessage(summaryCard);
    return;
  }

  if (lead.step === "ask_phone") {
    const validPhone = isValidPhone(text);
    if (!validPhone) {
      hideTypingIndicator();
      const err = isUrdu
        ? `براہ کرم ایک درست فون نمبر درج کریں (مثلاً: **+1 (555) 234-5678**)`
        : `Please provide a valid phone number (at least 7-10 digits, e.g. **+1 (555) 234-5678**) so our senior concierge can send you instant SMS updates.`;
      sendBotMessage(err);
      return;
    }
    lead.phone = validPhone;
    lead.step = "ask_email";
    lead.waitingFor = "email";
    saveHistory();

    const nextMsg = isUrdu
      ? `شکریہ، **${lead.name}**!\n\nآخر میں، اپنا **پرائمری ای میل ایڈریس** فراہم کریں تاکہ ہم آپ کا ذاتی پراپرٹی پورٹ فولیو، فلور پلانز اور قیمتوں کی شیٹ فوری بھیج سکیں؟`
      : `Thank you, **${lead.name}**!\n\nLastly, what is your **primary email address** so we can immediately send over your personalized property portfolio, HD floor plans, and pricing sheet?`;
    sendBotMessage(nextMsg);
    return;
  }

  if (lead.step === "ask_name") {
    const validatedName = cleanAndValidateName(text);
    if (!validatedName) {
      hideTypingIndicator();
      const err = isUrdu
        ? `براہ کرم اپنا **مکمل نام** درج کریں تاکہ ہم آپ کی خفیہ پراپرٹی فائل تیار کر سکیں۔`
        : `Could you please share your **full name** so I know whom to address and prepare your confidential property dossier for?`;
      sendBotMessage(err);
      return;
    }
    lead.name = validatedName;
    lead.step = "ask_phone";
    lead.waitingFor = "phone";
    saveHistory();

    const nextMsg = isUrdu
      ? `خوش آمدید، **${validatedName}**!\n\nآپ کا بہترین **موبائل فون نمبر** کیا ہے تاکہ ہمارا پرائیویٹ کلائنٹ ڈائریکٹر ایس ایم ایس پر ٹور کنفرمیشن بھیج سکے؟`
      : `Pleased to meet you, **${validatedName}**!\n\nWhat is your best **mobile phone number** so our private client director can text you VIP viewing passes and instant off-market alerts?`;
    sendBotMessage(nextMsg);
    return;
  }

  // ==========================================
  // 4. STEP-BY-STEP CRITERIA GATHERING
  // ==========================================
  if (lead.step === "criteria") {
    // 1. Location
    if (!lead.location) {
      const foundLoc = extractLocation(text);
      if (foundLoc) {
        lead.location = foundLoc;
        saveHistory();
      } else {
        hideTypingIndicator();
        let prompt = isUrdu
          ? `آپ کس **شہر یا علاقے** میں پراپرٹی خریدنا چاہتے ہیں؟`
          : `Which **city or area** are you looking to purchase or invest in?`;
        prompt += renderLocationChips(isUrdu);
        sendBotMessage(prompt, true);
        return;
      }
    }

    // 2. Property Type
    if (!lead.propertyType) {
      const foundType = extractPropertyType(text);
      if (foundType) {
        lead.propertyType = foundType;
        saveHistory();
      } else {
        hideTypingIndicator();
        let prompt = isUrdu
          ? `**${lead.location}** میں آپ کس قسم کی پراپرٹی تلاش کر رہے ہیں؟`
          : `What type of property are you envisioning in **${lead.location}**?`;
        prompt += renderPropertyTypeChips(isUrdu);
        sendBotMessage(prompt, true);
        return;
      }
    }

    // 3. Budget Range
    if (!lead.budget) {
      const foundBudget = extractBudget(text);
      if (foundBudget) {
        lead.budget = foundBudget;
        saveHistory();
      } else {
        hideTypingIndicator();
        let prompt = isUrdu
          ? `آپ کا متوقع **بجٹ کیا ہے**؟`
          : `What is your target **price range or budget**?`;
        prompt += renderBudgetChips(isUrdu);
        sendBotMessage(prompt, true);
        return;
      }
    }

    // 4. Timeline
    if (!lead.timeline) {
      const foundTimeline = extractTimeline(text);
      if (foundTimeline) {
        lead.timeline = foundTimeline;
        saveHistory();
      } else {
        hideTypingIndicator();
        let prompt = isUrdu
          ? `آپ کا خریداری کا **متوقع وقت (Timeline)** کیا ہے؟`
          : `What is your ideal **purchase or moving timeline**?`;
        prompt += renderTimelineChips(isUrdu);
        sendBotMessage(prompt, true);
        return;
      }
    }

    // All criteria gathered -> Show property listings and ask name
    if (!lead.listingsShown) {
      lead.listingsShown = true;
      lead.step = "ask_name";
      lead.waitingFor = "name";
      saveHistory();

      hideTypingIndicator();
      const listingsHtml = generateListingsHtml(lead, isUrdu);
      const prompt = isUrdu
        ? `${listingsHtml}<div class="mt-2 text-slate-200">میں نے آپ کی ترجیحات کے مطابق <strong>${escapeHTML(lead.location)}</strong> میں 3 تصدیق شدہ لسٹنگز تلاش کی ہیں۔<div class="h-2"></div>ان لسٹنگز کو محفوظ کرنے اور تفصیلی فائل تیار کرنے کے لیے براہ کرم اپنا <strong>مکمل نام</strong> درج کریں۔</div>`
        : `${listingsHtml}<div class="mt-2 text-slate-200">I have identified 3 exclusive verified listings matching your <strong>${escapeHTML(lead.propertyType)}</strong> search in <strong>${escapeHTML(lead.location)}</strong> with your <strong>${escapeHTML(lead.budget)}</strong> budget.<div class="h-2"></div>May I have your <strong>full name</strong> so I can reserve these listings and prepare your confidential property dossier?</div>`;
      sendBotMessage(prompt, true);
      return;
    }
  }

  // ==========================================
  // 5. HYBRID FALLBACK: N8N AI BOT FOR OPEN INQUIRIES
  // ==========================================
  const botResult = await sendToN8nBot(text);

  if (botResult.success && botResult.text) {
    sendBotMessage(botResult.text);
    return;
  }

  // Graceful conversational response if n8n is slow
  hideTypingIndicator();
  const fallbackReply = isUrdu
    ? `آپ کا پیغام موصول ہو گیا ہے۔ ہمارا سینئر رئیل اسٹیٹ ایڈوائزر **${lead.location || 'اس علاقے'}** کی مزید تفصیلات کے ساتھ آپ سے جلد رابطہ کرے گا۔`
    : `Thank you for sharing that detail! I've noted your preferences for your **${lead.location || 'luxury'}** property search. Would you like to explore matching listings or schedule a private viewing?`;
  sendBotMessage(fallbackReply);
}

// ==========================================
// DISPATCH NOTIFICATIONS (EMAIL & WEBHOOK)
// ==========================================

async function dispatchLeadNotification() {
  const lead = state.lead;
  const targetTester = state.testerEmail || lead.email || "";

  const transcriptText = state.chatHistory.map(m => `[${m.role.toUpperCase()} - ${m.time || ''}]: ${m.content}`).join("\n");
  const executiveSummary = `
NEW REAL ESTATE LEAD:
---------------------------------------------
Client Name:      ${lead.name}
Phone (SMS):      ${lead.phone}
Email:            ${lead.email}
Intent:           ${lead.intent || 'Luxury Real Estate'}
Target Location:  ${lead.location || 'Miami Metro'}
Budget:           ${lead.budget || 'Custom Range'}
Timeline:         ${lead.timeline || 'Flexible'}
Selected Listing: ${lead.selectedProperty || 'General Portfolio'}
Session ID:       ${state.sessionId}
Capture Time:     ${new Date().toLocaleString()}
---------------------------------------------
`.trim();

  const payload = {
    action: "lead_completed",
    message: executiveSummary,
    chatInput: `${lead.name} | ${lead.phone} | ${lead.email} | Budget: ${lead.budget}`,
    sessionId: state.sessionId,
    testerEmail: targetTester,
    lead: {
      ...lead,
      testerEmail: targetTester
    },
    summary: executiveSummary,
    transcript: transcriptText,
    timestamp: new Date().toISOString()
  };

  let n8nSuccess = false;
  try {
    const res = await fetch(state.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) n8nSuccess = true;
  } catch (e) {}

  // Dual-dispatch via FormSubmit
  try {
    await fetch(state.fallbackMailerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: `🔥 NEW REAL ESTATE LEAD: ${lead.name} - ${lead.budget} (${lead.location})`,
        _template: "table",
        _captcha: "false",
        _cc: [targetTester, "abdulmoizbaig50@gmail.com"].filter(Boolean).join(", "),
        lead_name: lead.name,
        phone_number: lead.phone,
        email_address: lead.email,
        target_budget: lead.budget,
        location: lead.location,
        timeline: lead.timeline,
        property_interest: lead.selectedProperty || lead.intent
      })
    });
  } catch (e) {}

  showResetToast(`✅ Live lead report dispatched to: ${targetTester}`);
  console.log(`[Lead Dispatched] ${lead.name} -> ${targetTester} (n8n: ${n8nSuccess})`);
}

async function dispatchBookingNotification() {
  const lead = state.lead;
  const booking = state.booking;
  const targetTester = state.testerEmail || lead.email || "";

  const payload = {
    action: "booking_completed",
    chatInput: `Booking VIP Tour: ${booking.property} (${booking.reference})`,
    sessionId: state.sessionId,
    testerEmail: targetTester,
    lead: {
      ...lead,
      testerEmail: targetTester
    },
    booking: {
      reference: booking.reference,
      propertyName: booking.property || lead.selectedProperty || "The Grand Panorama — Luxury Home",
      propertyAddress: booking.address || `${lead.location || "Miami Metro"} • Prime Waterfront`,
      dateTime: booking.dateTime || "Saturday at 2:00 PM",
      name: lead.name || "Abdul Samad Feroz",
      phone: lead.phone || "+1 305 777 9876",
      email: targetTester
    },
    timestamp: new Date().toISOString()
  };

  let n8nSuccess = false;
  try {
    const res = await fetch(state.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) n8nSuccess = true;
  } catch (e) {}

  // Dual-dispatch via FormSubmit
  try {
    await fetch(state.fallbackMailerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: `📅 VIP VIEWING CONFIRMATION: ${booking.reference} — ${booking.property}`,
        _template: "table",
        _captcha: "false",
        _cc: [targetTester, "abdulmoizbaig50@gmail.com"].filter(Boolean).join(", "),
        booking_reference: booking.reference,
        property_name: booking.property,
        property_address: booking.address,
        scheduled_datetime: booking.dateTime,
        buyer_name: lead.name,
        phone_number: lead.phone,
        email_address: targetTester
      })
    });
  } catch (e) {}

  showResetToast(`✅ VIP booking confirmation dispatched to: ${targetTester}`);
  console.log(`[Booking Dispatched] ${booking.reference} for ${booking.property} -> ${targetTester} (n8n: ${n8nSuccess})`);
}

// Global Non-Blocking Reset Chat Function
window.resetChat = function() {
  chatMessages.innerHTML = "";
  state.chatHistory = [];
  state.language = "en";
  state.sessionId = "sess_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
  localStorage.setItem("propertyai_session_id", state.sessionId);
  
  state.lead = {
    step: "criteria",
    waitingFor: "discovery",
    intent: "",
    location: "",
    propertyType: "",
    budget: "",
    timeline: "",
    selectedProperty: "",
    name: "",
    phone: "",
    email: "",
    listingsShown: false,
    dispatched: false
  };

  state.booking = {
    step: "none",
    property: "",
    address: "",
    dateTime: "",
    reference: "",
    confirmed: false,
    dispatched: false
  };

  localStorage.removeItem("propertyai_history");
  localStorage.removeItem("propertyai_current_lead");
  localStorage.removeItem("propertyai_current_booking");

  if (chatInput) chatInput.value = "";
  const mobileInput = document.getElementById("chat-input-mobile");
  if (mobileInput) mobileInput.value = "";

  sendWelcomeMessage();
  showResetToast("Conversation reset. Starting fresh!");
};

function showResetToast(msg = "Conversation reset. Starting fresh!") {
  const existing = document.getElementById("reset-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "reset-toast";
  toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-emerald-500/40 text-emerald-400 text-xs px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 z-[9999] message-animate";
  toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> ${escapeHTML(msg)}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

if (btnClearChat) {
  btnClearChat.addEventListener("click", (e) => {
    e.preventDefault();
    window.resetChat();
  });
}

// ==========================================
// FEEDBACK MODAL CONTROLLER
// ==========================================
let currentFeedbackRating = 5;
let currentFeedbackCategory = "Response Quality";

const ratingDescriptions = {
  1: "1 Star - Needs Improvement",
  2: "2 Stars - Fair",
  3: "3 Stars - Good",
  4: "4 Stars - Very Good",
  5: "5 Stars - Outstanding"
};

function initFeedbackSystem() {
  const container = document.getElementById("star-rating-container");
  if (container) {
    const stars = container.querySelectorAll("i");
    stars.forEach(star => {
      star.addEventListener("click", () => {
        const val = parseInt(star.getAttribute("data-value") || "5", 10);
        setFeedbackRating(val);
      });
    });
  }

  const tagsContainer = document.getElementById("feedback-tags-container");
  if (tagsContainer) {
    const tags = tagsContainer.querySelectorAll(".feedback-tag");
    tags.forEach(tag => {
      tag.addEventListener("click", () => {
        tags.forEach(t => {
          t.className = "feedback-tag px-2.5 py-1 rounded-lg text-[11px] border border-slate-700 bg-slate-800 text-slate-300 hover:border-emerald-500 transition-all cursor-pointer";
        });
        tag.className = "feedback-tag px-2.5 py-1 rounded-lg text-[11px] border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-medium transition-all cursor-pointer";
        currentFeedbackCategory = tag.getAttribute("data-tag") || "Response Quality";
      });
    });
  }
}

function setFeedbackRating(val) {
  currentFeedbackRating = val;
  const container = document.getElementById("star-rating-container");
  if (!container) return;
  const stars = container.querySelectorAll("i");
  stars.forEach(s => {
    const sVal = parseInt(s.getAttribute("data-value") || "0", 10);
    if (sVal <= val) {
      s.className = "fa-solid fa-star transition-all duration-150 cursor-pointer hover:scale-110 text-amber-400";
    } else {
      s.className = "fa-solid fa-star transition-all duration-150 cursor-pointer hover:scale-110 text-slate-700";
    }
  });
  const label = document.getElementById("rating-label");
  if (label) {
    label.textContent = ratingDescriptions[val] || `${val} Stars`;
  }
}

window.openFeedbackModal = function(category) {
  const modal = document.getElementById("feedback-modal");
  const content = document.getElementById("feedback-modal-content");
  if (!modal || !content) return;

  if (category) {
    currentFeedbackCategory = category;
    const tags = document.querySelectorAll(".feedback-tag");
    tags.forEach(t => {
      if (t.getAttribute("data-tag") === category) {
        t.className = "feedback-tag px-2.5 py-1 rounded-lg text-[11px] border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-medium transition-all cursor-pointer";
      } else {
        t.className = "feedback-tag px-2.5 py-1 rounded-lg text-[11px] border border-slate-700 bg-slate-800 text-slate-300 hover:border-emerald-500 transition-all cursor-pointer";
      }
    });
  }

  const emailInput = document.getElementById("feedback-email-input");
  if (emailInput && !emailInput.value) {
    emailInput.value = state.testerEmail || state.lead.email || "";
  }

  setFeedbackRating(currentFeedbackRating);

  modal.classList.remove("hidden");
  modal.style.display = "flex";
  modal.style.opacity = "1";
  modal.style.pointerEvents = "auto";
  content.classList.remove("scale-95");
  content.classList.add("scale-100");
};

window.closeFeedbackModal = function() {
  const modal = document.getElementById("feedback-modal");
  const content = document.getElementById("feedback-modal-content");
  if (!modal || !content) return;

  modal.style.opacity = "0";
  content.classList.remove("scale-100");
  content.classList.add("scale-95");

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }, 200);
};

window.submitFeedback = async function() {
  const btn = document.getElementById("btn-submit-feedback");
  const btnText = document.getElementById("feedback-btn-text");
  const commentsInput = document.getElementById("feedback-comments");
  const emailInput = document.getElementById("feedback-email-input");

  const comments = (commentsInput ? commentsInput.value.trim() : "");
  const email = (emailInput ? emailInput.value.trim() : "") || state.testerEmail || state.lead.email || "";

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = "Sending...";

  const feedbackPayload = {
    action: "feedback_submitted",
    rating: currentFeedbackRating,
    ratingText: ratingDescriptions[currentFeedbackRating] || `${currentFeedbackRating} Stars`,
    category: currentFeedbackCategory,
    comments: comments || "User submitted feedback via PropertyAI modal.",
    testerEmail: email,
    sessionId: state.sessionId,
    timestamp: new Date().toISOString()
  };

  // 1. Send to n8n Webhook
  try {
    await fetch(state.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedbackPayload)
    });
  } catch (err) {}

  // 2. FormSubmit Fallback
  try {
    await fetch(state.fallbackMailerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: `⭐ PROPERTYAI USER FEEDBACK: ${currentFeedbackRating}/5 Stars (${currentFeedbackCategory})`,
        _template: "table",
        _captcha: "false",
        rating: `${currentFeedbackRating} / 5 Stars`,
        category: currentFeedbackCategory,
        comments: comments || "None",
        user_email: email,
        session_id: state.sessionId
      })
    });
  } catch (fbErr) {}

  if (btn) btn.disabled = false;
  if (btnText) btnText.textContent = "Submit Feedback";
  if (commentsInput) commentsInput.value = "";

  closeFeedbackModal();
  showResetToast(`🎉 Thank you! Your feedback (${currentFeedbackRating}★) was submitted.`);
};
