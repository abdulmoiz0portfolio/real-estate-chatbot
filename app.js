// PropertyAI Concierge - Autonomous Real Estate Advisor Engine
// Powered by Automatixes

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

  // Purge any stale legacy history or corrupted "hey" location or invalid $3 budget
  const savedHistory = localStorage.getItem("propertyai_history");
  const savedLead = localStorage.getItem("propertyai_current_lead");

  if (savedLead && (
    savedLead.includes('"hey"') || 
    savedLead.includes('"hi"') || 
    savedLead.includes('"hello"') ||
    savedLead.includes('"$3"') || 
    savedLead.includes('"$3k"') || 
    savedLead.includes('"3"')
  )) {
    localStorage.removeItem("propertyai_history");
    localStorage.removeItem("propertyai_current_lead");
  } else if (savedHistory) {
    try {
      if (
        savedHistory.includes("property in hey") || 
        savedHistory.includes("property in hi") || 
        savedHistory.includes("$3 offers") || 
        savedHistory.includes("$3 budget")
      ) {
        localStorage.removeItem("propertyai_history");
        localStorage.removeItem("propertyai_current_lead");
      } else {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.chatHistory = parsed;
          if (savedLead) {
            try { 
              const leadObj = JSON.parse(savedLead);
              // Extra safety check on location
              if (leadObj.location && ["hey", "hi", "hello", "yo", "sup"].includes(leadObj.location.toLowerCase())) {
                leadObj.location = "";
              }
              state.lead = { ...state.lead, ...leadObj };
            } catch (e) {}
          }
          renderSavedHistory();
          return;
        }
      }
    } catch (e) {
      console.warn("Could not load history", e);
    }
  }
  
  sendWelcomeMessage();
});

// Render Welcome Greeting (Exact Mobile Reference Design)
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

    <!-- 2x2 Bento Action Cards (Perfect Fit for Mobile & Desktop Split-Pane) -->
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
        askSuggestedQuestion(prompt);
      }
    };
  });
}

// Tester / Demo Email Manager
function initTesterEmailUI() {
  const input = document.getElementById("tester-email-input");
  const btnText = document.getElementById("tester-btn-text");
  if (input && state.testerEmail) {
    input.value = state.testerEmail;
  }
  if (btnText && state.testerEmail) {
    btnText.textContent = "Saved ✓";
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        window.saveTesterEmail();
      }
    });
  }
}

window.saveTesterEmail = function() {
  const input = document.getElementById("tester-email-input");
  if (!input) return;
  const email = input.value.trim().toLowerCase();
  
  if (!email || !isValidEmail(email)) {
    showResetToast("Please enter a valid email address (e.g. name@domain.com)");
    return;
  }
  
  state.testerEmail = email;
  localStorage.setItem("propertyai_tester_email", email);
  
  const btnText = document.getElementById("tester-btn-text");
  if (btnText) btnText.textContent = "Saved ✓";
  
  showResetToast(`✅ Live lead reports activated for: ${email}`);

  // Dispatch immediate confirmation alert to tester's email
  try {
    fetch(state.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "tester_email_saved",
        testerEmail: email,
        sessionId: state.sessionId,
        message: `Live lead notifications activated for: ${email}`,
        lead: {
          name: "Live Tester Registration",
          email: email,
          testerEmail: email,
          phone: "Verified Session",
          location: "Miami / Global",
          budget: "Live Alerts Active",
          timeline: "Instant"
        },
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.warn("Tester email dispatch warning:", err));
  } catch (e) {}
};

window.askSuggestedQuestion = function(questionText) {
  if (!questionText) return;
  addUserMessage(questionText);
  processUserTurn(questionText);
};

window.selectPropertyAndInquire = function(propTitle) {
  state.lead.selectedProperty = propTitle;
  const userMsg = `I would like to reserve a private showing for "${propTitle}".`;
  addUserMessage(userMsg);
  processUserTurn(userMsg);
};

// Add User Message to UI
function addUserMessage(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex justify-end message-animate";
  msgEl.innerHTML = `
    <div class="max-w-[85%] sm:max-w-[78%]">
      <div class="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-md text-xs sm:text-sm leading-relaxed">
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

  const formattedContent = isRawHtml ? content : formatMarkdown(content);

  msgEl.innerHTML = `
    <div class="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xs shrink-0 shadow-sm mt-0.5">
      <i class="fa-solid fa-house text-[11px]"></i>
    </div>
    <div class="max-w-[92%] sm:max-w-[85%] w-full">
      <div class="bg-[#0F1728]/90 border border-slate-800/90 text-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md text-xs sm:text-sm leading-relaxed">
        ${formattedContent}
      </div>
      <div class="text-[10px] text-slate-500 mt-1 flex items-center justify-between px-1">
        <span>${time}</span>
        <button type="button" onclick="openFeedbackModal('Response Quality')" class="text-slate-500 hover:text-emerald-400 text-[10px] flex items-center gap-1 transition-colors cursor-pointer" title="Rate this response">
          <i class="fa-regular fa-star text-[9px] text-amber-400/80"></i>
          <span>Feedback</span>
        </button>
      </div>
    </div>
  `;

  chatMessages.appendChild(msgEl);
  scrollToBottom();
  
  state.chatHistory.push({ role: "assistant", content: content, isHtml: isRawHtml, time });
  saveHistory();
}

function showTypingIndicator() {
  if (document.getElementById("typing-indicator")) return;
  const typingEl = document.createElement("div");
  typingEl.id = "typing-indicator";
  typingEl.className = "flex items-start gap-2.5 message-animate";
  typingEl.innerHTML = `
    <div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs shrink-0 mt-0.5">
      <i class="fa-solid fa-house text-[11px]"></i>
    </div>
    <div class="bg-[#0F1728]/90 border border-slate-800/90 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-md">
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
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 150);
  }
}

function saveHistory() {
  try {
    localStorage.setItem("propertyai_history", JSON.stringify(state.chatHistory));
    localStorage.setItem("propertyai_current_lead", JSON.stringify(state.lead));
  } catch (e) {}
}

function renderSavedHistory() {
  chatMessages.innerHTML = "";
  state.chatHistory.forEach(msg => {
    if (msg.role === "user") {
      const msgEl = document.createElement("div");
      msgEl.className = "flex justify-end message-animate";
      msgEl.innerHTML = `
        <div class="max-w-[85%] sm:max-w-[78%]">
          <div class="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-md text-xs sm:text-sm leading-relaxed">
            ${escapeHTML(msg.content)}
          </div>
          <div class="text-[10px] text-slate-500 text-right mt-1 pr-1">${msg.time || ''}</div>
        </div>
      `;
      chatMessages.appendChild(msgEl);
    } else {
      const msgEl = document.createElement("div");
      msgEl.className = "flex items-start gap-2.5 message-animate";
      const body = msg.isHtml ? msg.content : formatMarkdown(msg.content);
      msgEl.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xs shrink-0 shadow-sm mt-0.5">
          <i class="fa-solid fa-house text-[11px]"></i>
        </div>
        <div class="max-w-[92%] sm:max-w-[85%] w-full">
          <div class="bg-[#0F1728]/90 border border-slate-800/90 text-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md text-xs sm:text-sm leading-relaxed">
            ${body}
          </div>
          <div class="text-[10px] text-slate-500 mt-1 flex items-center justify-between px-1">
            <span>${msg.time || ''}</span>
            <button type="button" onclick="openFeedbackModal('Response Quality')" class="text-slate-500 hover:text-emerald-400 text-[10px] flex items-center gap-1 transition-colors cursor-pointer" title="Rate this response">
              <i class="fa-regular fa-star text-[9px] text-amber-400/80"></i>
              <span>Feedback</span>
            </button>
          </div>
        </div>
      `;
      chatMessages.appendChild(msgEl);
    }
  });
  scrollToBottom();
}

// Markdown formatting helper with proper valid HTML list wrapping
function formatMarkdown(text) {
  if (typeof text !== "string") text = String(text);
  let html = escapeHTML(text);
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>');
  // Convert list items
  html = html.replace(/^\s*[-•]\s+(.*)$/gm, '<li class="ml-4 list-disc text-slate-300 my-1">$1</li>');
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li class="ml-4 list-decimal text-slate-300 my-1">$2</li>');
  
  // Wrap list items cleanly inside <ul> / <ol>
  html = html.replace(/(<li class="[^"]*list-disc[^"]*">[\s\S]*?<\/li>\s*)+/g, (match) => {
    return `<ul class="space-y-1.5 my-2 pl-2 border-l-2 border-emerald-500/30">${match}</ul>`;
  });
  html = html.replace(/(<li class="[^"]*list-decimal[^"]*">[\s\S]*?<\/li>\s*)+/g, (match) => {
    return `<ol class="space-y-1.5 my-2 pl-2 border-l-2 border-emerald-500/30">${match}</ol>`;
  });

  // Linebreaks
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

// Form Submission Handlers (Desktop & Mobile)
function handleFormSubmit(inputElement) {
  if (!inputElement) return;
  const query = inputElement.value.trim();
  if (!query) return;

  inputElement.value = "";
  // Synchronize inputs
  const desktopInput = document.getElementById("chat-input");
  const mobileInput = document.getElementById("chat-input-mobile");
  if (desktopInput) desktopInput.value = "";
  if (mobileInput) mobileInput.value = "";

  addUserMessage(query);
  processUserTurn(query);
}

// Mobile handler called from onsubmit="handleMobileSubmit(event)"
window.handleMobileSubmit = function(e) {
  if (e) e.preventDefault();
  handleFormSubmit(document.getElementById("chat-input-mobile"));
};

// Desktop form submit listener
if (chatForm) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleFormSubmit(chatInput);
  });
}

// Mobile form submit listener (in case triggered by DOM event)
const chatFormMobile = document.getElementById("chat-form-mobile");
if (chatFormMobile) {
  chatFormMobile.addEventListener("submit", (e) => {
    window.handleMobileSubmit(e);
  });
}

// INTELLIGENT ENTITY EXTRACTORS & VALIDATORS

// Check if message is a greeting or pleasantry
function isGreeting(text) {
  const clean = text.toLowerCase().trim().replace(/[!.,?]+$/, "");
  const greetingPhrases = [
    "hey", "hi", "hello", "howdy", "sup", "yo", "hola",
    "good morning", "good afternoon", "good evening", "good day",
    "greetings", "hey there", "hi there", "hello there", "what's up", "whats up"
  ];
  if (greetingPhrases.includes(clean)) return true;
  return /^(hey|hi|hello|howdy|sup|yo|hola|greetings)(\s+(there|propertyai|concierge|bot|assistant|friend|team))?$/i.test(clean);
}

// Check if message is a conversational filler or generic agreement
function isConversationalFiller(text) {
  const clean = text.toLowerCase().trim().replace(/[!.,?]+$/, "");
  const fillers = [
    "ok", "okay", "sure", "yes", "yeah", "yup", "no", "nope", "thanks", "thank you",
    "cool", "great", "awesome", "perfect", "good", "nice", "alright", "all right",
    "help", "please", "continue", "start", "proceed", "test"
  ];
  return fillers.includes(clean);
}

function isValidEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.([a-zA-Z]{2,})/);
  if (!match) return null;
  const email = match[0].toLowerCase();
  const domainPart = email.split("@")[1];
  const tld = match[1].toLowerCase();

  // Known valid TLDs (rejects fake TLDs like .jh)
  const commonTLDs = [
    "com", "org", "net", "edu", "gov", "mil", "co", "io", "ai", "me", "info", "biz",
    "uk", "ca", "us", "de", "fr", "au", "pk", "in", "ae", "sa", "eu", "app", "dev", "tech", "store", "online", "pro", "realestate"
  ];
  if (!commonTLDs.includes(tld)) {
    return null;
  }

  // Reject domains without vowels or shorter than 3 chars (e.g. gfdldg.jh is random keyboard smash)
  const domainName = domainPart.split(".")[0];
  if (!/[aeiouy]/i.test(domainName) || domainName.length < 3) {
    return null;
  }

  // Reject obvious username keyboard mash without vowels if length > 5
  const userName = email.split("@")[0];
  if (userName.length > 5 && !/[aeiouy]/i.test(userName)) {
    return null;
  }

  return email;
}

function isValidPhone(text) {
  const digits = text.replace(/\D/g, "");
  // Check length (8 to 15 digits)
  if (digits.length < 8 || digits.length > 15) return null;

  // Reject repeated patterns or test strings like 1111111111, 00000000, 12345678, 55555555
  if (/^(\d)\1{5,}$/.test(digits)) return null;
  if (/^(01234567|12345678|23456789)/.test(digits)) return null;

  // Format cleanly if 10 digits
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return text.trim();
}

function extractBudget(text) {
  let val = null;
  // 1. Explicit dollar sign with amount: $850k, $1.2M, $500,000, $500000
  const dollarMatch = text.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:k|m|million|thousand|grand)?)/i);
  if (dollarMatch && dollarMatch[1]) {
    val = "$" + dollarMatch[1].trim().replace(/\s+/g, "").toUpperCase();
  } else {
    // 2. Keyword with amount: under 850k, budget 500k, price: 1.5 million, up to 750,000
    const keywordMatch = text.match(/(?:under|below|up to|around|budget|price|max|approx)\s*[:\$]?\s*(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:k|m|million|thousand|grand)?)/i);
    if (keywordMatch && keywordMatch[1]) {
      val = "$" + keywordMatch[1].trim().replace(/\s+/g, "").toUpperCase();
    } else {
      // 3. Number with suffix k/m/million (e.g. 500k, 1.2M)
      const suffixMatch = text.match(/\b(\d+(?:\.\d+)?\s*(?:k|m|million|grand))\b/i);
      if (suffixMatch && suffixMatch[1]) {
        val = "$" + suffixMatch[1].trim().replace(/\s+/g, "").toUpperCase();
      } else {
        // 4. Standalone large numbers (>= 10,000) e.g. 850000, 500,000
        const largeNum = text.match(/\b(\d{2,3}(?:,\d{3})+|\d{5,9})\b/);
        if (largeNum && largeNum[1]) {
          val = "$" + largeNum[1].trim().replace(/\s+/g, "");
        }
      }
    }
  }

  if (!val) return null;
  // Sanity check: Ensure budget is a real property number (reject $3, $4, or bedroom numbers)
  const cleanNum = val.replace(/[^0-9.km]/gi, "").toLowerCase();
  let numVal = 0;
  if (cleanNum.includes("m")) numVal = parseFloat(cleanNum) * 1000000;
  else if (cleanNum.includes("k")) numVal = parseFloat(cleanNum) * 1000;
  else numVal = parseFloat(cleanNum);

  if (isNaN(numVal) || numVal < 10000) {
    return null;
  }
  return val;
}

function formatListingPrice(rawBudget, offsetPercent = 0) {
  if (!rawBudget) return "$850,000";
  let num = 0;
  const clean = String(rawBudget).replace(/[^0-9.km]/gi, "").toLowerCase();
  if (clean.includes("m")) {
    num = parseFloat(clean.replace("m", "")) * 1000000;
  } else if (clean.includes("k")) {
    num = parseFloat(clean.replace("k", "")) * 1000;
  } else {
    num = parseFloat(clean);
  }
  if (!num || isNaN(num) || num < 50000) {
    num = 850000;
  }
  const adjusted = Math.round((num * (1 + offsetPercent / 100)) / 1000) * 1000;
  return "$" + adjusted.toLocaleString("en-US");
}

function extractTimeline(text) {
  const lower = text.toLowerCase();
  if (lower.includes("immediate") || lower.includes("asap") || lower.includes("right now") || lower.includes("ready now") || lower.includes("today")) {
    return "Immediate / Ready Now";
  }
  if (lower.includes("30") || lower.includes("1 month") || lower.includes("next month")) {
    return "Within 30 Days";
  }
  if (lower.includes("60") || lower.includes("2 month")) {
    return "30–60 Days";
  }
  if (lower.includes("90") || lower.includes("3 month")) {
    return "3–6 Months";
  }
  if (lower.includes("6 month") || lower.includes("year") || lower.includes("flexible")) {
    return "6+ Months / Flexible";
  }
  return null;
}

// Known major luxury real estate markets
const KNOWN_CITIES = [
  "miami", "brickell", "south beach", "miami beach", "coconut grove", "coral gables",
  "palm beach", "west palm beach", "boca raton", "fort lauderdale", "naples", "tampa", "orlando", "key west", "sunny isles", "fisher island", "bal harbour", "aventura",
  "new york", "manhattan", "brooklyn", "tribeca", "soho", "hamptons", "greenwich", "chelsea", "dumbo",
  "los angeles", "beverly hills", "malibu", "bel air", "hollywood", "brentwood", "santa monica", "newport beach", "laguna beach", "san francisco", "silicon valley", "palo alto", "san diego", "la jolla",
  "austin", "dallas", "houston", "san antonio",
  "chicago", "seattle", "boston", "atlanta", "scottsdale", "phoenix", "las vegas", "denver", "aspen", "nashville", "charlotte", "honolulu", "maui",
  "london", "dubai", "abu dhabi", "toronto", "vancouver", "paris", "monaco", "singapore", "sydney"
];

function extractLocation(text) {
  // Never treat greetings or fillers as locations
  if (isGreeting(text) || isConversationalFiller(text)) {
    return null;
  }

  const lower = text.toLowerCase().trim();
  
  // 1. Exact or substring match in known luxury cities
  for (const c of KNOWN_CITIES) {
    const regex = new RegExp(`\\b${c}\\b`, "i");
    if (regex.test(lower)) {
      return c.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }

  // 2. Preposition pattern match: "in Miami", "around Tribeca", "near Scottsdale", "relocating to Denver"
  const prepMatch = text.match(/(?:in|around|near|at|area of|relocating to|moving to)\s+([A-Za-z\s]{2,25})/i);
  if (prepMatch && prepMatch[1]) {
    const candidate = prepMatch[1].trim().replace(/[.,!?;]+$/, "");
    if (!isGreeting(candidate) && !isConversationalFiller(candidate) && candidate.length >= 3 && !extractBudget(candidate)) {
      return candidate.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }

  return null;
}

function extractPropertyType(text) {
  const lower = text.toLowerCase();
  const types = [];
  
  // Bed count
  const bedMatch = text.match(/(\d+)\s*(?:bed|bedroom|br|bhk)/i);
  if (bedMatch) {
    types.push(`${bedMatch[1]}-Bedroom`);
  }

  if (lower.includes("penthouse")) types.push("Luxury Penthouse");
  else if (lower.includes("condo") || lower.includes("condominium")) types.push("Modern Condominium");
  else if (lower.includes("villa")) types.push("Private Villa");
  else if (lower.includes("single family") || lower.includes("single-family") || lower.includes("house") || lower.includes("home")) types.push("Single-Family Home");
  else if (lower.includes("townhouse") || lower.includes("townhome")) types.push("Townhouse");
  else if (lower.includes("estate") || lower.includes("mansion")) types.push("Luxury Estate");
  else if (lower.includes("apartment")) types.push("Apartment");

  return types.length > 0 ? types.join(" ") : null;
}

function isOffTopic(text) {
  const lower = text.toLowerCase().trim();
  const offTopicPatterns = [
    /\bweather\b/, /\btemperature\b/, /\brain\b/, /\bforecast\b/,
    /\bpresident\b/, /\bpolitics\b/, /\belection\b/,
    /\brecipe\b/, /\bcook\b/, /\bbake\b/,
    /\bjoke\b/, /\briddle\b/, /\bpoem\b/, /\bsing\b/,
    /\bcrypto\b/, /\bbitcoin\b/, /\bethereum\b/,
    /\bsports\b/, /\bfootball\b/, /\bcricket\b/, /\bnba\b/,
    /\bpython\b/, /\bjavascript\b/, /\bprogramming\b/
  ];
  return offTopicPatterns.some(p => p.test(lower));
}

function cleanAndValidateName(text) {
  let cleaned = text
    .replace(/^(my name is|i am|this is|this|call me|name is|i'm|it's|its|me)\s+/i, "")
    .replace(/[.!,?].*$/, "")
    .trim();
  
  // Check if it has at least 2 alphabetic characters and no digits
  if (cleaned.length >= 2 && /[a-zA-Z]{2,}/.test(cleaned) && !/\d{2,}/.test(cleaned)) {
    return cleaned.replace(/\b\w/g, l => l.toUpperCase());
  }
  return null;
}

// Generate Realistic Verified Property Listings
function generateListingsHtml(lead) {
  const loc = lead.location || "Miami Metro";
  const type = lead.propertyType || "Luxury Home";
  const rawBudget = lead.budget || "$850,000";
  
  const properties = [
    {
      title: `The Grand Panorama — ${type}`,
      location: `${loc} • Prime Waterfront`,
      price: formatListingPrice(rawBudget, 0),
      beds: "3 Beds",
      baths: "3.5 Baths",
      sqft: "2,680 Sq Ft",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
      tag: "Verified Exclusive"
    },
    {
      title: `Azure Vista Modern Villa`,
      location: `${loc} • Gated Enclave`,
      price: formatListingPrice(rawBudget, 5),
      beds: "4 Beds",
      baths: "4 Baths",
      sqft: "3,400 Sq Ft",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
      tag: "Off-Market Deal"
    },
    {
      title: `The Reserve High-Rise Suite`,
      location: `${loc} • Financial District`,
      price: formatListingPrice(rawBudget, -6),
      beds: "3 Beds",
      baths: "2.5 Baths",
      sqft: "2,150 Sq Ft",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80",
      tag: "Price Negotiable"
    }
  ];

  let cardsHtml = `
    <div class="mb-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
          <i class="fa-solid fa-sparkles text-amber-400"></i>
          Found 3 Matching Verified Properties:
        </span>
        <span class="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">${escapeHTML(loc)}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
  `;

  properties.forEach(p => {
    cardsHtml += `
      <div class="property-card-glow bg-slate-950/80 rounded-xl border border-slate-800/90 overflow-hidden flex flex-col group">
        <div class="relative h-28 overflow-hidden">
          <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
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
            <span>Schedule VIP Tour</span>
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

// Helpers to render interactive prompt chips in messages
function renderLocationChips() {
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

function renderPropertyTypeChips() {
  return `
    <div class="flex flex-wrap gap-1.5 mt-2.5">
      <button onclick="askSuggestedQuestion('3-bedroom Single-Family Home')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏡 Single-Family</button>
      <button onclick="askSuggestedQuestion('Luxury Penthouse with Skyline Views')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏙️ Penthouse</button>
      <button onclick="askSuggestedQuestion('Modern High-Rise Condominium')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏢 Modern Condo</button>
      <button onclick="askSuggestedQuestion('Private Waterfront Villa')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🌊 Waterfront Villa</button>
    </div>
  `;
}

function renderBudgetChips() {
  return `
    <div class="flex flex-wrap gap-1.5 mt-2.5">
      <button onclick="askSuggestedQuestion('$500,000 to $800,000')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">💵 $500k – $800k</button>
      <button onclick="askSuggestedQuestion('$1,000,000 to $1,500,000')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">💎 $1M – $1.5M</button>
      <button onclick="askSuggestedQuestion('$2,000,000 to $3,500,000')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">👑 $2M – $3.5M</button>
      <button onclick="askSuggestedQuestion('$5,000,000+ Luxury Portfolio')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🏰 $5M+ Trophy Asset</button>
    </div>
  `;
}

function renderTimelineChips() {
  return `
    <div class="flex flex-wrap gap-1.5 mt-2.5">
      <button onclick="askSuggestedQuestion('Immediate / Ready Now')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">⚡ Immediate / Ready Now</button>
      <button onclick="askSuggestedQuestion('Within 30 to 60 Days')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">📅 30–60 Days</button>
      <button onclick="askSuggestedQuestion('3 to 6 Months')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">⏳ 3–6 Months</button>
      <button onclick="askSuggestedQuestion('Flexible timeline / Exploring options')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-200 transition-all">🌴 Flexible</button>
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

  try {
    const response = await fetch(state.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

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
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        status: response.status,
        message: err.message || `HTTP ${response.status}`
      };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// MAIN CONVERSATIONAL STATE MACHINE (100% Routed to n8n AI Bot)
async function processUserTurn(userText) {
  showTypingIndicator();

  const text = userText.trim();
  const lead = state.lead;

  // Opportunistic extraction to keep local lead profile in sync
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

  // 1. Send completely to n8n AI Bot Webhook
  const botResult = await sendToN8nBot(text);

  if (botResult.success && botResult.text) {
    sendBotMessage(botResult.text);

    // If email is captured and not dispatched yet, trigger lead dispatch
    if (lead.email && !lead.dispatched) {
      lead.dispatched = true;
      dispatchLeadNotification();
    }
    return;
  }

  // 2. If n8n returns 404 (Workflow Inactive / Deactivated) or server offline:
  if (!botResult.success) {
    if (botResult.status === 404) {
      sendBotMessage(`⚠️ **n8n AI Workflow is Inactive (Deactivated)**\n\nThe conversation is routed directly to your n8n AI agent, but the workflow toggle is currently **OFF** in your n8n canvas.\n\n👉 **Please open your n8n dashboard and toggle the workflow to Active (ON)** in the top-right corner to chat with your live Groq AI model.\n\n*(Running local concierge mode while n8n is inactive)*`);
    }
    processLocalFallback(text);
  }
}

// LOCAL CONCIERGE FALLBACK (Runs only if n8n webhook is inactive or down)
async function processLocalFallback(userText) {
  await new Promise(res => setTimeout(res, 350));
  const text = userText.trim();
  const lower = text.toLowerCase();
  const lead = state.lead;

  // ==========================================
  // STAGE: POST-CONFIRMATION CONVERSATIONAL MEMORY
  // ==========================================
  if (lead.step === "completed") {
    handlePostConfirmationTurn(text);
    return;
  }

  // ==========================================
  // GREETINGS & CASUAL INTRODUCTIONS
  // ==========================================
  if (isGreeting(text)) {
    // If the user greeted us, give a warm executive welcome without misinterpreting
    if (lead.step === "criteria") {
      let greetingResponse = `Hello! 👋 It's a pleasure to connect with you. I am your autonomous real estate concierge powered by Automatixes.\n\nWhether you're looking to **buy a luxury home**, **explore high-yield investment properties**, or **schedule a private tour**, I'm here to curate verified off-market listings for you.\n\nWhich **city or area** would you like to explore today?`;
      greetingResponse += renderLocationChips();
      sendBotMessage(greetingResponse, true);
      lead.waitingFor = "location";
      return;
    } else if (lead.step === "ask_name") {
      sendBotMessage(`Hello! 👋 To proceed with reserving these exclusive listings, may I please have your **full name**?`);
      return;
    } else if (lead.step === "ask_phone") {
      sendBotMessage(`Hello! We just need your **best mobile phone number** so our property specialist can send you private viewing confirmations.`);
      return;
    } else if (lead.step === "ask_email") {
      sendBotMessage(`Hello! What is your **primary email address** so we can send over the property brochure and floor plans?`);
      return;
    }
  }

  // ==========================================
  // OFF-TOPIC GUARD
  // ==========================================
  if (isOffTopic(text)) {
    sendBotMessage(`I specialize exclusively in luxury real estate, property acquisitions, and private showings. Let's find your ideal property!\n\nWhich **city or neighborhood** are you looking in, or what is your **target price range**?` + renderLocationChips(), true);
    return;
  }

  // ==========================================
  // STAGE: ASKING CONTACT INFORMATION
  // ==========================================
  if (lead.step === "ask_email") {
    const validEmail = isValidEmail(text);
    if (!validEmail) {
      sendBotMessage(`That doesn't appear to be a complete email address. Please share a valid email (e.g. **name@domain.com**) so we can send over the verified listing dossier and pricing details.`);
      return;
    }
    lead.email = validEmail;
    lead.step = "completed";
    lead.waitingFor = "none";

    // Dispatch lead immediately
    await dispatchLeadNotification();

    // Summary Card with strictly required closing message
    const summaryCard = `
🎉 **Thank you, ${lead.name}! Your property request has been confirmed.**

Here is your recorded inquiry summary:
- 👤 **Client Name:** ${lead.name}
- 📞 **Mobile (SMS):** ${lead.phone}
- ✉️ **Email Address:** ${lead.email}
- 🏡 **Interest:** ${lead.intent || 'Luxury Real Estate'}
- 📍 **Target Area:** ${lead.location || 'Prime Metro'}
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
      sendBotMessage(`Please provide a valid cell phone number (at least 8-10 digits, e.g. **+1 (555) 234-5678**) so our senior concierge can send you instant SMS alerts and private tour confirmations.`);
      return;
    }
    lead.phone = validPhone;
    lead.step = "ask_email";
    lead.waitingFor = "email";

    sendBotMessage(`Thank you, **${lead.name}**!\n\nLastly, what is your **primary email address** so we can immediately send over your personalized property portfolio, HD floor plans, and pricing sheet?`);
    return;
  }

  if (lead.step === "ask_name") {
    const validatedName = cleanAndValidateName(text);
    if (!validatedName) {
      sendBotMessage(`Could you please share your **full name** so I know whom to address and prepare your confidential property dossier for?`);
      return;
    }
    lead.name = validatedName;
    lead.step = "ask_phone";
    lead.waitingFor = "phone";

    sendBotMessage(`It's a pleasure to connect with you, **${lead.name}**!\n\nWhat is your best **cell phone number**? Our senior property specialist can send you instant SMS alerts and coordinate private showings.`);
    return;
  }

  // ==========================================
  // STAGE: CRITERIA GATHERING (Location, Type, Budget, Timeline)
  // ==========================================
  
  // Opportunistic extraction across ANY message
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

  // Set Intent if detected
  if (!lead.intent) {
    if (lower.includes("buy") || lower.includes("purchase") || lower.includes("home") || lower.includes("house")) {
      lead.intent = "Purchase / Buy";
    } else if (lower.includes("rent") || lower.includes("lease")) {
      lead.intent = "Rent / Lease";
    } else if (lower.includes("invest") || lower.includes("roi") || lower.includes("yield")) {
      lead.intent = "High-Yield Investment";
    } else if (lower.includes("sell") || lower.includes("list")) {
      lead.intent = "Sell / List Property";
    }
  }

  // Context-aware response handling when bot was specifically waiting for a piece of criteria:
  if (!lead.location && lead.waitingFor === "location") {
    // If user provided a short text answering the location question and it's not a filler/greeting
    if (text.length >= 2 && text.length <= 40 && !isGreeting(text) && !isConversationalFiller(text) && !budgetInMsg && !isOffTopic(text)) {
      lead.location = text.replace(/[.,!?;]+$/, "").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }

  if (!lead.propertyType && lead.waitingFor === "propertyType") {
    if (propTypeInMsg) {
      lead.propertyType = propTypeInMsg;
    } else if (text.length >= 3 && text.length <= 50 && !isGreeting(text) && !isConversationalFiller(text) && !budgetInMsg) {
      lead.propertyType = text.replace(/[.,!?;]+$/, "");
    }
  }

  // Check what is still missing and prompt accordingly
  // 1. Missing Location AND Property Type
  if (!lead.location && !lead.propertyType) {
    lead.waitingFor = "location";
    let msg = `That sounds wonderful! We have an exclusive portfolio of verified listings and private off-market opportunities.\n\n**Which city, neighborhood, or area are you looking in**, and what style of property do you have in mind?`;
    msg += renderLocationChips();
    sendBotMessage(msg, true);
    return;
  }

  // 2. Missing Location
  if (!lead.location) {
    lead.waitingFor = "location";
    let msg = `Noted! A **${lead.propertyType}** is a fantastic choice.\n\nWhich **city, neighborhood, or metro area** should we focus your search in?`;
    msg += renderLocationChips();
    sendBotMessage(msg, true);
    return;
  }

  // 3. Missing Property Type
  if (!lead.propertyType) {
    lead.waitingFor = "propertyType";
    let msg = `Excellent! **${lead.location}** has remarkable market dynamics and premier inventory.\n\nWhat style of property are you interested in acquiring in **${lead.location}**?`;
    msg += renderPropertyTypeChips();
    sendBotMessage(msg, true);
    return;
  }

  // 4. Missing Budget
  if (!lead.budget) {
    if (lead.waitingFor === "budget") {
      const rawNum = text.match(/\b\d+\b/);
      if (rawNum && parseInt(rawNum[0]) < 10000) {
        let msg = `A figure of **$${rawNum[0]}** seems below standard property thresholds (our verified luxury inventory begins around **$500,000** up to **$10M+**).\n\nWhat is your target property acquisition budget? Or feel free to select a bracket below:`;
        msg += renderBudgetChips();
        sendBotMessage(msg, true);
        return;
      }
      if (isConversationalFiller(text) || text.length <= 6) {
        let msg = `No problem! We have options across every luxury tier. Which target price range fits your plans best?`;
        msg += renderBudgetChips();
        sendBotMessage(msg, true);
        return;
      }
    }
    lead.waitingFor = "budget";
    const locAck = lead.location ? `in **${lead.location}**` : "";
    const typeAck = lead.propertyType ? `**${lead.propertyType}**` : "luxury property";
    let msg = `Excellent choices — ${typeAck} ${locAck} has fantastic market dynamics and premium inventory.\n\nWhat is your **estimated price range or target budget** for this property?`;
    msg += renderBudgetChips();
    sendBotMessage(msg, true);
    return;
  }

  // 5. Missing Timeline
  if (!lead.timeline) {
    if (lead.waitingFor === "timeline") {
      if (isConversationalFiller(text) || text.length <= 8) {
        lead.timeline = "Flexible / Exploring Options";
      }
    }
    if (!lead.timeline) {
      lead.waitingFor = "timeline";
      let msg = `Noted! A budget of **${lead.budget}** offers great options in **${lead.location}**.\n\nWhat is your **ideal purchase or move-in timeline**?`;
      msg += renderTimelineChips();
      sendBotMessage(msg, true);
      return;
    }
  }

  // All 4 criteria gathered! Show actual property cards and transition to Lead Contact Capture
  if (!lead.listingsShown) {
    lead.listingsShown = true;
    lead.step = "ask_name";
    lead.waitingFor = "name";

    const listingsHtml = generateListingsHtml(lead);
    const leadPrompt = `
      ${listingsHtml}
      <div class="mt-2 text-slate-200">
        I have identified 3 exclusive verified listings matching your <strong>${escapeHTML(lead.propertyType || 'luxury property')}</strong> search in <strong>${escapeHTML(lead.location || 'the area')}</strong> with your <strong>${escapeHTML(lead.budget)}</strong> budget.
        <div class="h-2"></div>
        May I have your <strong>full name</strong> so I can reserve these listings and prepare your confidential property dossier?
      </div>
    `;

    sendBotMessage(leadPrompt, true);
    return;
  }

  // If already shown listings, proceed to ask_name
  lead.step = "ask_name";
  lead.waitingFor = "name";
  sendBotMessage(`May I have your **full name** so I can reserve these listings and prepare your confidential property dossier?`);
}

// POST-CONFIRMATION CONVERSATIONAL MEMORY & INTELLIGENT HANDLER
function handlePostConfirmationTurn(text) {
  const q = text.toLowerCase().trim();
  const lead = state.lead;

  // 1. Inquiries about recorded lead details (Memory Recall)
  if (q.includes("budget") || q.includes("price") || q.includes("cost")) {
    sendBotMessage(`Your recorded budget is **${lead.budget || '$850,000'}** for your search in **${lead.location || 'Miami Metro'}**.\n\nWould you like me to adjust your price range or explore properties in a different bracket?`);
    return;
  }

  if (q.includes("phone") || q.includes("number") || q.includes("sms") || q.includes("mobile")) {
    sendBotMessage(`Your recorded mobile number is **${lead.phone}**.\n\nOur concierge will reach out to this number with SMS notifications and tour updates.`);
    return;
  }

  if (q.includes("email") || q.includes("inbox") || q.includes("portfolio")) {
    sendBotMessage(`Your recorded email address is **${lead.email}**.\n\nYour curated property brochure, floor plans, and market analysis are queued for this address.`);
    return;
  }

  if (q.includes("name") || q.includes("who am i")) {
    sendBotMessage(`You are registered as **${lead.name}** in our executive client directory.`);
    return;
  }

  if (q.includes("location") || q.includes("area") || q.includes("city") || q.includes("neighborhood")) {
    sendBotMessage(`Your target search area is currently set to **${lead.location || 'Miami Metro'}**.`);
    return;
  }

  if (q.includes("timeline") || q.includes("when") || q.includes("move")) {
    sendBotMessage(`Your preferred timeline is recorded as **${lead.timeline || 'Flexible'}**.`);
    return;
  }

  // 2. Real-time updates to existing profile
  const newBudget = extractBudget(text);
  if (newBudget && (q.includes("change") || q.includes("update") || q.includes("make it") || q.includes("set budget"))) {
    lead.budget = newBudget;
    saveHistory();
    dispatchLeadNotification();
    sendBotMessage(`✅ Updated! Your budget is now saved as **${newBudget}**. We have updated your property advisor's file.`);
    return;
  }

  // 3. Common real estate inquiries
  if (q.includes("rate") || q.includes("mortgage") || q.includes("loan") || q.includes("financing") || q.includes("interest")) {
    sendBotMessage(`Current 30-year fixed mortgage rates for qualified luxury buyers are averaging **6.3% to 6.7%**, with customized jumbo loan structures and interest-only options available.\n\nOur certified lending partners can issue pre-approval letters in under 2 hours if you'd like financing pre-qualification.`);
    return;
  }

  if (q.includes("tour") || q.includes("visit") || q.includes("showing") || q.includes("schedule") || q.includes("see")) {
    sendBotMessage(`Private VIP showings can be arranged 7 days a week between 9:00 AM and 7:00 PM. Our senior agent will text your cell at **${lead.phone}** shortly to confirm your preferred day and time.`);
    return;
  }

  if (q.includes("hoa") || q.includes("tax") || q.includes("closing") || q.includes("fee")) {
    sendBotMessage(`For luxury properties in **${lead.location || 'this metro'}**, property taxes typically range from **1.2% to 2.0%** of assessed value. HOA fees vary between **$0.60 to $1.20 per sq ft** depending on full-service amenities (concierge, valet, pool, security).`);
    return;
  }

  if (q.includes("contact") || q.includes("call") || q.includes("reach") || q.includes("team")) {
    sendBotMessage(`Our senior acquisitions team is reviewing your profile right now. You will receive a direct text message on **${lead.phone}** and a comprehensive email package at **${lead.email}** within the hour.`);
    return;
  }

  // 4. Start over or new search
  if (q.includes("new search") || q.includes("start over") || q.includes("reset") || q.includes("another")) {
    sendBotMessage(`To start a brand new inquiry or search in a different market, click the **Reset** button (<i class="fa-solid fa-rotate-right"></i>) in the top right header!`);
    return;
  }

  // 5. Gibberish or unparseable input check
  if (text.length < 3 || /^[a-z]{6,}$/i.test(text) && !/[aeiouy]{2}/i.test(text)) {
    sendBotMessage(`I didn't quite catch that. Your property profile for **${lead.location || 'your preferred area'}** is safely confirmed! Feel free to ask about local market statistics, private tour availability, or financing options.`);
    return;
  }

  // 6. Natural contextual reply
  sendBotMessage(`Understood! I've appended that note to your file. Our senior property advisor will review these preferences and follow up directly via text and email.\n\nIs there anything specific you would like to know about neighborhood schools, recent comparable sales, or HOA guidelines?`);
}

// Dispatch Lead Notification to Email and Webhook
async function dispatchLeadNotification() {
  const lead = state.lead;
  
  // Format summary & transcript
  const transcriptText = state.chatHistory.map(m => `[${m.role.toUpperCase()} - ${m.time || ''}]: ${m.content}`).join("\n");
  
  const executiveSummary = `
NEW REAL ESTATE LEAD RECEIVED:
---------------------------------------------
Client Name:      ${lead.name}
Phone (SMS):      ${lead.phone}
Email:            ${lead.email}
Intent:           ${lead.intent || 'Luxury Real Estate'}
Target Location:  ${lead.location || 'Prime Metro'}
Budget:           ${lead.budget || 'Custom Range'}
Timeline:         ${lead.timeline || 'Immediate / Flexible'}
Selected Listing: ${lead.selectedProperty || 'General Portfolio'}
Session ID:       ${state.sessionId}
Capture Time:     ${new Date().toLocaleString()}
---------------------------------------------
Lead Summary:
The client expressed active interest in ${lead.intent || 'luxury property'} in ${lead.location || 'the target area'}.
Target budget stated as ${lead.budget || 'Custom'} with timeline ${lead.timeline || 'Flexible'}.
Contact details verified via conversational assistant.
---------------------------------------------
`.trim();

  // Save to localStorage leads archive
  try {
    const savedLeads = JSON.parse(localStorage.getItem("automatixes_captured_leads") || "[]");
    savedLeads.push({
      ...lead,
      capturedAt: new Date().toISOString(),
      summary: executiveSummary
    });
    localStorage.setItem("automatixes_captured_leads", JSON.stringify(savedLeads));
  } catch (e) {
    console.warn("Storage error", e);
  }

  const targetTester = state.testerEmail || lead.email || "";

  // 1. Primary Dispatch to n8n Webhook
  const n8nPayload = {
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

  let n8nDispatched = false;
  try {
    const res = await fetch(state.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload)
    });
    if (res.ok) {
      n8nDispatched = true;
      console.log(">>> [n8n] Lead notification successfully dispatched via n8n.");
    }
  } catch (err) {
    console.warn("n8n webhook dispatch warning:", err);
  }

  // 2. Fallback to FormSubmit ONLY if n8n was not reachable
  if (!n8nDispatched) {
    try {
      const emailPayload = {
        _subject: `🔥 NEW REAL ESTATE LEAD: ${lead.name} - ${lead.budget} (${lead.location})`,
        _template: "table",
        _captcha: "false",
        _cc: [targetTester, "abdulmoizbaig50@gmail.com"].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", "),
        lead_name: lead.name,
        phone_number: lead.phone,
        email_address: lead.email,
        demo_tester_email: targetTester || "Not specified",
        property_interest: lead.intent || "Luxury Real Estate",
        location_preference: lead.location || "Miami Metro",
        target_budget: lead.budget || "Custom",
        moving_timeline: lead.timeline || "Flexible",
        ai_executive_summary: executiveSummary,
        chat_transcript: transcriptText
      };
      await fetch(state.fallbackMailerUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(emailPayload)
      });
      console.log(">>> [Fallback] Dispatched lead via FormSubmit.");
    } catch (fbErr) {
      console.warn("Direct mailer fallback warning:", fbErr);
    }
  }

  if (targetTester) {
    showResetToast(`✅ Live lead report dispatched to: ${targetTester}`);
  }

  console.log(">>> [SUCCESS] Real estate lead dispatched for:", lead.name, lead.phone, lead.email, "Tester:", targetTester);
}

// Global Non-Blocking Reset Chat Function
window.resetChat = function() {
  chatMessages.innerHTML = "";
  state.chatHistory = [];
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

  localStorage.removeItem("propertyai_history");
  localStorage.removeItem("propertyai_current_lead");

  if (chatInput) chatInput.value = "";
  const mobileInput = document.getElementById("chat-input-mobile");
  if (mobileInput) mobileInput.value = "";
  sendWelcomeMessage();

  // Temporary toast indicator
  showResetToast();
};

function showResetToast(msg = "Conversation reset. Starting fresh!") {
  const existing = document.getElementById("reset-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "reset-toast";
  toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-emerald-500/40 text-emerald-400 text-xs px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 z-50 message-animate";
  toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> ${escapeHTML(msg)}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// Button listener for reset
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
  requestAnimationFrame(() => {
    modal.classList.remove("opacity-0");
    modal.classList.add("opacity-100");
    content.classList.remove("scale-95");
    content.classList.add("scale-100");
  });
};

window.closeFeedbackModal = function() {
  const modal = document.getElementById("feedback-modal");
  const content = document.getElementById("feedback-modal-content");
  if (!modal || !content) return;

  modal.classList.remove("opacity-100");
  modal.classList.add("opacity-0");
  content.classList.remove("scale-100");
  content.classList.add("scale-95");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 200);
};

window.submitFeedback = async function() {
  const btn = document.getElementById("btn-submit-feedback");
  const btnText = document.getElementById("feedback-btn-text");
  const commentsInput = document.getElementById("feedback-comments");
  const emailInput = document.getElementById("feedback-email-input");

  const comments = (commentsInput ? commentsInput.value.trim() : "");
  const email = (emailInput ? emailInput.value.trim() : "") || state.testerEmail || state.lead.email || "anonymous-tester@realestate.ai";

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = "Sending...";

  const feedbackPayload = {
    action: "feedback_submitted",
    rating: currentFeedbackRating,
    ratingText: ratingDescriptions[currentFeedbackRating] || `${currentFeedbackRating} Stars`,
    category: currentFeedbackCategory,
    comments: comments || "User rated experience without text comment.",
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
  } catch (err) {
    console.warn("n8n feedback dispatch warning:", err);
  }

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
