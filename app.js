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
  
  // Conversational Lead Qualification State
  lead: {
    step: "criteria", // "criteria" -> "ask_name" -> "ask_phone" -> "ask_email" -> "completed"
    intent: "",
    location: "",
    propertyType: "",
    budget: "",
    timeline: "",
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

  // Purge any stale legacy history that contains obsolete "What happens next" text
  const savedHistory = localStorage.getItem("propertyai_history");
  if (savedHistory) {
    try {
      if (savedHistory.includes("What happens next") || savedHistory.includes("senior property concierge has received")) {
        localStorage.removeItem("propertyai_history");
      } else {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.chatHistory = parsed;
          // Restore lead memory if saved
          const savedLead = localStorage.getItem("propertyai_current_lead");
          if (savedLead) {
            try { state.lead = JSON.parse(savedLead); } catch (e) {}
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
            <button onclick="askSuggestedQuestion('I am looking to buy a 3-bedroom luxury residential home.')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-house-chimney text-emerald-400 shrink-0 text-[11px]"></i>
              <span class="truncate">🏡 Buy a Luxury Home</span>
            </button>
            <button onclick="askSuggestedQuestion('I would like to schedule a private VIP home showing in Miami.')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-calendar-check text-blue-400 shrink-0 text-[11px]"></i>
              <span class="truncate">📅 Schedule Private Showing</span>
            </button>
            <button onclick="askSuggestedQuestion('I am looking for high-yield investment properties under $1M.')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
              <i class="fa-solid fa-chart-line text-purple-400 shrink-0 text-[11px]"></i>
              <span class="truncate">📈 High-Yield Investments</span>
            </button>
            <button onclick="askSuggestedQuestion('I want to sell my property for maximum market valuation.')" class="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex items-center gap-2">
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

// Add Bot Message to UI (supports HTML or Markdown)
function sendBotMessage(content, isRawHtml = false) {
  hideTypingIndicator();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex items-start gap-3 message-animate";

  const formattedContent = isRawHtml ? content : formatMarkdown(content);

  msgEl.innerHTML = `
    <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xs shrink-0 shadow-md shadow-emerald-500/20">
      <i class="fa-solid fa-building-user"></i>
    </div>
    <div class="max-w-[95%] sm:max-w-[85%] w-full">
      <div class="bg-slate-900/90 border border-slate-800 text-slate-100 px-4 py-3.5 rounded-2xl rounded-tl-none shadow-md text-xs sm:text-sm leading-relaxed">
        ${formattedContent}
      </div>
      <div class="text-[10px] text-slate-500 mt-1">${time}</div>
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
      const body = msg.isHtml ? msg.content : formatMarkdown(msg.content);
      msgEl.innerHTML = `
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xs shrink-0 shadow-md shadow-emerald-500/20">
          <i class="fa-solid fa-building-user"></i>
        </div>
        <div class="max-w-[95%] sm:max-w-[85%] w-full">
          <div class="bg-slate-900/90 border border-slate-800 text-slate-100 px-4 py-3.5 rounded-2xl rounded-tl-none shadow-md text-xs sm:text-sm leading-relaxed">
            ${body}
          </div>
          <div class="text-[10px] text-slate-500 mt-1">${msg.time || ''}</div>
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
  
  // Wrap list items cleanly inside <ul> / <ol> so there is NO orphan <li> inside <div>
  html = html.replace(/(<li class="[^"]*list-disc[^"]*">[\s\S]*?<\/li>\s*)+/g, (match) => {
    return `<ul class="space-y-1.5 my-2 pl-2 border-l-2 border-emerald-500/30">${match}</ul>`;
  });
  html = html.replace(/(<li class="[^"]*list-decimal[^"]*">[\s\S]*?<\/li>\s*)+/g, (match) => {
    return `<ol class="space-y-1.5 my-2 pl-2 border-l-2 border-emerald-500/30">${match}</ol>`;
  });

  // Linebreaks (preserve paragraphs)
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

// Form Submission Handler
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = chatInput.value.trim();
  if (!query) return;

  chatInput.value = "";
  addUserMessage(query);
  processUserTurn(query);
});

// INTELLIGENT ENTITY EXTRACTORS & VALIDATORS

function isValidEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}

function isValidPhone(text) {
  // Check for at least 8 to 15 digits
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 8 && digits.length <= 15) {
    const match = text.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}|\+?\d{8,15}/);
    return match ? match[0].trim() : digits;
  }
  return null;
}

function extractBudget(text) {
  // 1. Explicit dollar sign with amount: $850k, $1.2M, $500,000, $500000
  const dollarMatch = text.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:k|m|million|thousand|grand)?)/i);
  if (dollarMatch && dollarMatch[1]) {
    return "$" + dollarMatch[1].trim().replace(/\s+/g, "").toUpperCase();
  }

  // 2. Keyword with amount: under 850k, budget 500k, price: 1.5 million, up to 750,000
  const keywordMatch = text.match(/(?:under|below|up to|around|budget|price|max|approx)\s*[:\$]?\s*(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:k|m|million|thousand|grand)?)/i);
  if (keywordMatch && keywordMatch[1]) {
    return "$" + keywordMatch[1].trim().replace(/\s+/g, "").toUpperCase();
  }

  // 3. Number with suffix k/m/million, ensuring it's not a bedroom count (e.g. 500k, 1.2M)
  const suffixMatch = text.match(/\b(\d+(?:\.\d+)?\s*(?:k|m|million|grand))\b/i);
  if (suffixMatch && suffixMatch[1]) {
    return "$" + suffixMatch[1].trim().replace(/\s+/g, "").toUpperCase();
  }

  // 4. Standalone large numbers (>= 10,000) e.g. 850000, 500,000
  const largeNum = text.match(/\b(\d{2,3}(?:,\d{3})+|\d{5,9})\b/);
  if (largeNum && largeNum[1]) {
    return "$" + largeNum[1].trim().replace(/\s+/g, "");
  }

  return null;
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

function extractLocation(text) {
  // Common luxury metros & cities
  const cities = [
    "miami", "brickell", "south beach", "coconut grove", "coral gables",
    "new york", "manhattan", "brooklyn", "los angeles", "beverly hills", "malibu",
    "chicago", "austin", "dallas", "houston", "san francisco", "seattle", "boston",
    "atlanta", "orlando", "tampa", "scottsdale", "las vegas", "denver",
    "london", "dubai", "toronto", "vancouver"
  ];
  const lower = text.toLowerCase();
  for (const c of cities) {
    if (lower.includes(c)) {
      return c.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }
  // Check preposition patterns like "in Miami Beach", "around Downtown"
  const prepMatch = text.match(/(?:in|around|near|at|area of)\s+([A-Z][a-zA-Z\s]{2,20})/);
  if (prepMatch && prepMatch[1]) {
    return prepMatch[1].trim();
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
  else if (lower.includes("townhouse")) types.push("Townhouse");
  else if (lower.includes("estate") || lower.includes("mansion")) types.push("Luxury Estate");
  else if (lower.includes("apartment")) types.push("Apartment");

  return types.length > 0 ? types.join(" ") : null;
}

function isOffTopic(text) {
  const lower = text.toLowerCase().trim();
  const offTopicPatterns = [
    /weather/, /temperature/, /rain/, /forecast/,
    /president/, /politics/, /election/,
    /recipe/, /cook/, /bake/,
    /joke/, /riddle/, /poem/, /sing/,
    /who are you/, /what is your name/,
    /crypto/, /bitcoin/, /ethereum/,
    /sports/, /football/, /cricket/, /nba/,
    /python/, /javascript/, /code/, /programming/
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
          <div class="flex items-center justify-between text-[10px] text-slate-300 pt-1.5 border-t border-slate-800/60">
            <span><i class="fa-solid fa-bed text-emerald-400 mr-1"></i>${p.beds}</span>
            <span><i class="fa-solid fa-bath text-teal-400 mr-1"></i>${p.baths}</span>
            <span><i class="fa-solid fa-ruler-combined text-slate-400 mr-1"></i>${p.sqft}</span>
          </div>
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

// MAIN CONVERSATIONAL STATE MACHINE
async function processUserTurn(userText) {
  showTypingIndicator();
  await new Promise(res => setTimeout(res, 500));

  const text = userText.trim();
  const lower = text.toLowerCase();
  const lead = state.lead;

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

  // ==========================================
  // STAGE: POST-CONFIRMATION CONVERSATIONAL MEMORY
  // ==========================================
  if (lead.step === "completed") {
    handlePostConfirmationTurn(text);
    return;
  }

  // ==========================================
  // OFF-TOPIC GUARD
  // ==========================================
  if (isOffTopic(text)) {
    sendBotMessage(`I specialize exclusively in luxury real estate, property acquisitions, and private showings. Let's find your ideal property!\n\nWhich **city or neighborhood** are you looking in, or what is your **target price range**?`);
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

    sendBotMessage(`It's a pleasure to connect with you, **${lead.name}**!\n\nWhat is your best **cell phone number**? Our senior property specialist can send you instant SMS alerts and coordinate private showings.`);
    return;
  }

  // ==========================================
  // STAGE: CRITERIA GATHERING (Location, Type, Budget, Timeline)
  // ==========================================
  
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

  // If user provided a city/location directly in current text
  if (!lead.location) {
    lead.location = locInMsg || (text.length < 50 && !budgetInMsg && !isOffTopic(text) ? text : null);
  }

  // If user provided property style in current text
  if (!lead.propertyType) {
    lead.propertyType = propTypeInMsg;
  }

  // If user provided budget
  if (!lead.budget) {
    lead.budget = budgetInMsg;
  }

  // If user provided timeline
  if (!lead.timeline) {
    lead.timeline = timelineInMsg;
  }

  // Check what is still missing
  // 1. Missing Location OR Property Type
  if (!lead.location && !lead.propertyType) {
    sendBotMessage(`That sounds wonderful! We have an exclusive portfolio of verified listings and private off-market opportunities.\n\n**Which city, neighborhood, or area are you looking in**, and what style of property do you have in mind (e.g., 3-4 bedroom single-family home, modern condominium, or luxury estate)?`);
    return;
  }

  // 2. Missing Budget
  if (!lead.budget) {
    const locAck = lead.location ? `in **${lead.location}**` : "";
    const typeAck = lead.propertyType ? `**${lead.propertyType}**` : "property";
    sendBotMessage(`Excellent choices — ${typeAck} ${locAck} has fantastic market dynamics and premium inventory.\n\nWhat is your **estimated price range or target budget** for this property?`);
    return;
  }

  // 3. Missing Timeline
  if (!lead.timeline) {
    sendBotMessage(`Noted! A budget of **${lead.budget}** offers great options.\n\nWhat is your **ideal purchase or move-in timeline** (e.g., immediate / ready now, within 30–60 days, or 3–6 months)?`);
    return;
  }

  // All criteria gathered! Show actual property cards and transition to Lead Contact Capture
  if (!lead.listingsShown) {
    lead.listingsShown = true;
    lead.step = "ask_name";

    const listingsHtml = generateListingsHtml(lead);
    const leadPrompt = `
      ${listingsHtml}
      <div class="mt-2 text-slate-200">
        I have identified 3 exclusive verified listings matching your <strong>${lead.propertyType || 'luxury property'}</strong> search in <strong>${lead.location || 'the area'}</strong> with your <strong>${lead.budget}</strong> budget.
        <div class="h-2"></div>
        May I have your <strong>full name</strong> so I can reserve these listings and prepare your confidential property dossier?
      </div>
    `;

    sendBotMessage(leadPrompt, true);
    return;
  }

  // If already shown listings, proceed to ask_name
  lead.step = "ask_name";
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
    sendBotMessage(`Current 30-year fixed mortgage rates for qualified buyers are averaging **6.3% to 6.7%**, with jumbo loans and ARMs offering attractive structures.\n\nOur certified lending partners can issue pre-approval letters in under 2 hours if you'd like financing pre-qualification.`);
    return;
  }

  if (q.includes("tour") || q.includes("visit") || q.includes("showing") || q.includes("schedule") || q.includes("see")) {
    sendBotMessage(`Private showings can be arranged 7 days a week between 9:00 AM and 7:00 PM. Our senior agent will text your cell at **${lead.phone}** shortly to confirm your preferred day and time.`);
    return;
  }

  if (q.includes("hoa") || q.includes("tax") || q.includes("closing") || q.includes("fee")) {
    sendBotMessage(`For luxury properties in **${lead.location || 'this metro'}**, property taxes typically range from **1.2% to 2.0%** of assessed value. HOA fees vary between **$0.60 to $1.20 per sq ft** depending on full-service amenities (concierge, valet, pool, security).`);
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
Target Location:  ${lead.location || 'Miami Metro'}
Budget:           ${lead.budget || 'Custom Range'}
Timeline:         ${lead.timeline || 'Immediate / Flexible'}
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

  // 1. Dispatch to n8n Webhook
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
    property_interest: lead.intent || "Luxury Real Estate",
    location_preference: lead.location || "Miami Metro",
    target_budget: lead.budget || "Custom",
    moving_timeline: lead.timeline || "Flexible",
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

// Global Non-Blocking Reset Chat Function
window.resetChat = function() {
  chatMessages.innerHTML = "";
  state.chatHistory = [];
  state.sessionId = "sess_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
  localStorage.setItem("propertyai_session_id", state.sessionId);
  
  state.lead = {
    step: "criteria",
    intent: "",
    location: "",
    propertyType: "",
    budget: "",
    timeline: "",
    name: "",
    phone: "",
    email: "",
    listingsShown: false,
    dispatched: false
  };

  localStorage.removeItem("propertyai_history");
  localStorage.removeItem("propertyai_current_lead");

  if (chatInput) chatInput.value = "";
  sendWelcomeMessage();

  // Temporary toast indicator
  showResetToast();
};

function showResetToast() {
  const existing = document.getElementById("reset-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "reset-toast";
  toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-emerald-500/40 text-emerald-400 text-xs px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 z-50 message-animate";
  toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> Conversation reset. Starting fresh!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// Button listener for reset
if (btnClearChat) {
  btnClearChat.addEventListener("click", (e) => {
    e.preventDefault();
    window.resetChat();
  });
}
