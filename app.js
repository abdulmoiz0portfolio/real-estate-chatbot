// Property Database with rich specs and high quality images
const PROPERTIES = [
  {
    id: "prop-1",
    title: "Azure Horizon Luxury Villa",
    type: "villa",
    status: "sale",
    price: 850000,
    formattedPrice: "$850,000",
    location: "Palm View Heights / Sector F-7",
    city: "Islamabad / Dubai",
    beds: 5,
    baths: 6,
    sqft: "5,200 sq ft",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
    features: ["Infinity Pool", "Smart Home", "Solar Powered", "Double Garage"],
    description: "Ultra-luxury modern villa featuring panoramic views, floor-to-ceiling glass walls, private cinema, and designer landscaping."
  },
  {
    id: "prop-2",
    title: "Skyline Modern Penthouse",
    type: "apartment",
    status: "rent",
    price: 3200,
    formattedPrice: "$3,200 / month",
    location: "Downtown Marina Boulevard",
    city: "Downtown / Karachi",
    beds: 3,
    baths: 3,
    sqft: "2,400 sq ft",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    features: ["Private Rooftop", "24/7 Concierge", "Valet Parking", "Gym & Spa"],
    description: "High-floor penthouse with stunning 360-degree city skyline views, premium Italian marble, and keyless biometric entry."
  },
  {
    id: "prop-3",
    title: "The Maple Grove Family Residence",
    type: "house",
    status: "sale",
    price: 495000,
    formattedPrice: "$495,000",
    location: "Oakridge Estates / Bahria Town",
    city: "Suburban / Lahore",
    beds: 4,
    baths: 4,
    sqft: "3,600 sq ft",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    features: ["Lush Backyard", "Chef's Kitchen", "Gated Security", "Near Top Schools"],
    description: "Spacious suburban home in a serene gated community with clubhouse access, parks, and 24/7 security patrol."
  },
  {
    id: "prop-4",
    title: "The Boulevard Studio Apartment",
    type: "apartment",
    status: "rent",
    price: 1450,
    formattedPrice: "$1,450 / month",
    location: "Financial District / Blue Area",
    city: "City Center",
    beds: 1,
    baths: 1,
    sqft: "750 sq ft",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    features: ["Fully Furnished", "High-speed Internet", "Metro Access", "Rooftop Pool"],
    description: "Turnkey furnished apartment tailored for young professionals and executives with walking distance to rapid transit."
  },
  {
    id: "prop-5",
    title: "Prime Commercial Corner Plot (1 Kanal)",
    type: "plot",
    status: "sale",
    price: 620000,
    formattedPrice: "$620,000 (PKR ~17.5 Cr)",
    location: "DHA Phase 6 Commercial Hub",
    city: "DHA / Islamabad / Lahore",
    beds: 0,
    baths: 0,
    sqft: "4,500 sq ft (1 Kanal)",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    features: ["Main Boulevard", "Direct Road Access", "High ROI 12-15%", "Immediate Possession"],
    description: "High-demand commercial plot with permission for 6-story plaza development. Excellent capital appreciation and rental yield."
  },
  {
    id: "prop-6",
    title: "Emerald Bay Coastal Villa",
    type: "villa",
    status: "sale",
    price: 1250000,
    formattedPrice: "$1,250,000",
    location: "Seaside Drive / Waterfront",
    city: "Waterfront",
    beds: 6,
    baths: 7,
    sqft: "7,000 sq ft",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
    features: ["Private Beach Access", "Helipad Access", "Wine Cellar", "Guest House"],
    description: "Masterpiece waterfront estate offering private direct beachfront, infinity edge deck, and state of the art finishes."
  }
];

// App State
let state = {
  engine: localStorage.getItem("estatebot_engine") || "builtin",
  apiKey: localStorage.getItem("estatebot_apikey") || "",
  chatHistory: []
};

// DOM Elements
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const btnSend = document.getElementById("btn-send");
const btnClearChat = document.getElementById("btn-clear-chat");
const hotListingsContainer = document.getElementById("hot-listings-container");
const aiEngineBadge = document.getElementById("ai-engine-badge");

// Modals
const apiModal = document.getElementById("api-modal");
const btnApiModal = document.getElementById("btn-api-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const engineSelect = document.getElementById("engine-select");
const apiKeyContainer = document.getElementById("api-key-container");
const customApiKeyInput = document.getElementById("custom-api-key");
const btnSaveSettings = document.getElementById("btn-save-settings");

const bookingModal = document.getElementById("booking-modal");
const btnCloseBooking = document.getElementById("btn-close-booking");
const bookingForm = document.getElementById("booking-form");
const bookingPropertyTitle = document.getElementById("booking-property-title");
let currentBookingProperty = null;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderHotListings();
  initSettings();
  initQuickPrompts();
  
  // Initial Greeting message
  if (state.chatHistory.length === 0) {
    sendBotMessage(
      `👋 **Hello & Welcome to EstateBot AI!**\n\nI am your 24/7 Real Estate Assistant. Whether you're looking to **buy a luxury home**, **find a rental apartment**, **invest in commercial plots**, or **calculate mortgages & ROI**, I'm here to help!\n\n💡 *Tip: You can ask me in English or Roman Urdu.* How can I assist your property search today?`,
      PROPERTIES.slice(0, 2)
    );
  }
});

// Render Hot Listings in Left Sidebar
function renderHotListings() {
  if (!hotListingsContainer) return;
  hotListingsContainer.innerHTML = PROPERTIES.slice(0, 4).map(prop => `
    <div class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 transition-all property-card-glow cursor-pointer" onclick="handleCardClick('${prop.id}')">
      <div class="flex gap-3">
        <img src="${prop.image}" alt="${prop.title}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${prop.status === 'rent' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}">
              For ${prop.status.toUpperCase()}
            </span>
            <span class="text-xs font-extrabold text-white">${prop.formattedPrice}</span>
          </div>
          <h4 class="text-xs font-semibold text-slate-200 truncate mt-1">${prop.title}</h4>
          <p class="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
            <i class="fa-solid fa-location-dot text-rose-400 text-[9px]"></i>
            ${prop.location}
          </p>
        </div>
      </div>
    </div>
  `).join("");
}

// Quick Prompt Buttons
function initQuickPrompts() {
  document.querySelectorAll(".quick-prompt").forEach(btn => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-prompt");
      if (prompt) {
        addUserMessage(prompt);
        processUserQuery(prompt);
      }
    });
  });
}

// Message Rendering Functions
function addUserMessage(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex justify-end message-animate";
  msgEl.innerHTML = `
    <div class="max-w-[85%] sm:max-w-[70%]">
      <div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none shadow-md text-xs sm:text-sm leading-relaxed">
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
  typingEl.className = "flex items-start gap-2.5 message-animate";
  typingEl.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 text-xs shrink-0">
      <i class="fa-solid fa-robot"></i>
    </div>
    <div class="bg-slate-800/90 border border-slate-700/80 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-md">
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

function sendBotMessage(markdownText, attachedProperties = null) {
  hideTypingIndicator();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement("div");
  msgEl.className = "flex items-start gap-2.5 message-animate";

  let formattedContent = formatMarkdown(markdownText);

  let cardsHtml = "";
  if (attachedProperties && attachedProperties.length > 0) {
    cardsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        ${attachedProperties.map(prop => `
          <div class="bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg property-card-glow flex flex-col justify-between">
            <div class="relative h-32 w-full overflow-hidden">
              <img src="${prop.image}" alt="${prop.title}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              <span class="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${prop.status === 'rent' ? 'bg-blue-600/90 text-white' : 'bg-emerald-600/90 text-white'} backdrop-blur-sm">
                For ${prop.status.toUpperCase()}
              </span>
              <span class="absolute bottom-2 right-2 text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900/90 text-emerald-400 backdrop-blur-sm border border-slate-700/50">
                ${prop.formattedPrice}
              </span>
            </div>
            <div class="p-3">
              <h4 class="text-xs font-bold text-white truncate">${prop.title}</h4>
              <p class="text-[11px] text-slate-400 flex items-center gap-1 mt-1 truncate">
                <i class="fa-solid fa-location-dot text-rose-400 text-[10px]"></i>
                ${prop.location}
              </p>
              <div class="flex items-center gap-3 text-[10px] text-slate-300 my-2 pt-2 border-t border-slate-800/80">
                ${prop.beds ? `<span><i class="fa-solid fa-bed text-emerald-400 mr-1"></i>${prop.beds} Beds</span>` : ''}
                ${prop.baths ? `<span><i class="fa-solid fa-bath text-blue-400 mr-1"></i>${prop.baths} Baths</span>` : ''}
                <span><i class="fa-solid fa-ruler-combined text-amber-400 mr-1"></i>${prop.sqft}</span>
              </div>
              <div class="flex items-center gap-2 pt-1">
                <button onclick="openBookingModal('${prop.id}')" class="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5">
                  <i class="fa-regular fa-calendar-check"></i>
                  Book Tour
                </button>
                <button onclick="sendPropertyInquiry('${prop.id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition-all">
                  Details
                </button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  msgEl.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xs shrink-0 shadow-md">
      <i class="fa-solid fa-robot"></i>
    </div>
    <div class="max-w-[92%] sm:max-w-[80%]">
      <div class="bg-slate-800/90 border border-slate-700/80 text-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-md text-xs sm:text-sm leading-relaxed">
        ${formattedContent}
        ${cardsHtml}
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

// Markdown Formatter (Bold, Bullet lists, Code, Line breaks)
function formatMarkdown(text) {
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
  return str
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

// Process Query Routing (Built-in or LLM API)
async function processUserQuery(query) {
  showTypingIndicator();

  // If user configured OpenAI or Gemini API
  if (state.engine === "openai" && state.apiKey) {
    try {
      const response = await callOpenAI(query);
      sendBotMessage(response);
      return;
    } catch (err) {
      console.warn("OpenAI API call failed, falling back to smart engine:", err);
    }
  } else if (state.engine === "gemini" && state.apiKey) {
    try {
      const response = await callGemini(query);
      sendBotMessage(response);
      return;
    } catch (err) {
      console.warn("Gemini API call failed, falling back to smart engine:", err);
    }
  }

  // Built-in intelligent Real Estate response engine
  setTimeout(() => {
    const result = evaluateRealEstateQuery(query);
    sendBotMessage(result.message, result.properties);
  }, 600);
}

// Core Real Estate Logic & Multi-lingual Roman Urdu / English Engine
function evaluateRealEstateQuery(rawQuery) {
  const q = rawQuery.toLowerCase().trim();

  // 1. Greetings
  if (/^(hi|hello|hey|salam|assalam|aOA|kese ho|kaisay ho|good morning|good evening)/i.test(q)) {
    return {
      message: `Hello! 😊 I am your **EstateBot Real Estate Consultant**. I can assist you with:\n\n- Finding **Villas, Houses, Apartments & Commercial Plots**\n- Booking a **property tour/visit**\n- Calculating **Mortgage EMI & Down payments**\n- Best **Investment opportunities & ROI**\n\nWhat type of property are you interested in today?`,
      properties: PROPERTIES.slice(0, 2)
    };
  }

  // 2. Schedule Site Visit / Tour / Visit Booking
  if (q.includes("schedule") || q.includes("visit") || q.includes("tour") || q.includes("dekhna") || q.includes("booking") || q.includes("appointment")) {
    return {
      message: `📅 **Property Site Visit Booking**\n\nYou can easily book an on-site private tour with one of our certified agents!\n\nPlease select any property below and click **"Book Tour"**, or tell me your preferred city/locality and timing.`,
      properties: PROPERTIES.slice(0, 3)
    };
  }

  // 3. Mortgage / EMI / Down Payment / Loan / Installment
  if (q.includes("mortgage") || q.includes("down payment") || q.includes("calculator") || q.includes("emi") || q.includes("loan") || q.includes("installment") || q.includes("qist") || q.includes("downpayment")) {
    return {
      message: `📊 **Mortgage & Financing Guide**\n\nFor a standard home purchase:\n- **Standard Down Payment**: 20% down (e.g., on a $500,000 property = $100,000 down payment).\n- **Estimated Interest Rate**: 6.5% - 7.5% per annum.\n- **Estimated Monthly Payment (30-year fixed on $400k loan)**: ~$2,528 / month (principal + interest).\n- **Flexible Developer Payment Plans**: Available with 10% down and 3 to 5-year easy installments for new off-plan projects!\n\nWould you like a custom mortgage estimate for a specific property?`
    };
  }

  // 4. Rent / Rental Search
  if (q.includes("rent") || q.includes("kiraya") || q.includes("monthly") || q.includes("tenant")) {
    const rentalProps = PROPERTIES.filter(p => p.status === "rent");
    return {
      message: `🏢 Here are our top **Rental Properties** currently available for immediate lease. All units include premium maintenance and verified landlord contracts:`,
      properties: rentalProps
    };
  }

  // 5. Luxury Villa / House Search
  if (q.includes("villa") || q.includes("luxury") || q.includes("bungalow") || q.includes("ghar") || q.includes("house") || q.includes("mansion") || q.includes("kothi")) {
    const villaProps = PROPERTIES.filter(p => p.type === "villa" || p.type === "house");
    return {
      message: `🏡 Here are the premier **Luxury Villas & Houses** matching your search criteria:`,
      properties: villaProps
    };
  }

  // 6. Apartment / Flat / Studio / Penthouse
  if (q.includes("apartment") || q.includes("flat") || q.includes("studio") || q.includes("penthouse")) {
    const aptProps = PROPERTIES.filter(p => p.type === "apartment");
    return {
      message: `🏢 Here are modern **Apartments & Penthouses** in prime central locations:`,
      properties: aptProps
    };
  }

  // 7. Plots / Commercial / Investment / ROI
  if (q.includes("plot") || q.includes("commercial") || q.includes("invest") || q.includes("roi") || q.includes("zameen") || q.includes("karachi") || q.includes("islamabad") || q.includes("lahore") || q.includes("dha") || q.includes("bahria")) {
    const plotProps = PROPERTIES.filter(p => p.type === "plot" || p.price > 500000);
    return {
      message: `📈 **High-Yield Real Estate Investment Opportunities**\n\n- **Commercial Plots & Plazas**: Projected Annual Capital Gain: 12% - 18%\n- **Rental Yield**: 6% - 8% in central hubs\n- **Approved Authorities**: NOC Verified & Clear Titles\n\nTake a look at these top investment options:`,
      properties: plotProps
    };
  }

  // 8. Roman Urdu Support ("kya price hai", "kharidna hai", "rate batao")
  if (q.includes("chahiye") || q.includes("kharidna") || q.includes("lena hai") || q.includes("rate") || q.includes("qeemat") || q.includes("paisa") || q.includes("kitna")) {
    return {
      message: `Ji bilkul! Hamaray paas **Ready to Move Houses**, **Luxury Villas**, **Apartments for Rent**, or **Commercial Plots** available hain.\n\nAap apna **Budget** or **Location** (e.g. Islamabad, Lahore, Karachi ya Downtown) bataiye, taake main aapko best options dikha sakoon:`,
      properties: PROPERTIES.slice(0, 3)
    };
  }

  // 9. Contact / Agent Connect
  if (q.includes("contact") || q.includes("number") || q.includes("agent") || q.includes("call") || q.includes("phone") || q.includes("rabta")) {
    return {
      message: `📞 **Contact Certified Real Estate Agents**\n\n- **Helpline**: +1 (800) 555-REAL / +92 300 1234567\n- **Email**: inquiries@estatebot-demo.com\n- **Office Hours**: 24/7 Live Support\n\nYou can also click **"Book Tour"** on any property card to have an agent directly call you!`
    };
  }

  // Default Smart Fallback
  return {
    message: `I found several matching listings based on your request: "${rawQuery}". You can refine your search by asking for **budget** (e.g., *under $500,000*), **type** (*villa, apartment, plot*), or **rent vs buy**.`,
    properties: PROPERTIES.slice(0, 3)
  };
}

// Interactive Card Handlers
window.handleCardClick = function(propId) {
  const prop = PROPERTIES.find(p => p.id === propId);
  if (prop) {
    addUserMessage(`Tell me more about ${prop.title}`);
    sendBotMessage(`### 🏡 **${prop.title}**\n\n**Price**: ${prop.formattedPrice}\n**Location**: ${prop.location} (${prop.city})\n**Specs**: ${prop.beds ? `${prop.beds} Beds, ` : ''}${prop.baths ? `${prop.baths} Baths, ` : ''}${prop.sqft}\n\n**Description**: ${prop.description}\n\n**Key Highlights**:\n${prop.features.map(f => `- ${f}`).join('\n')}\n\nWould you like to schedule a private viewing tour?`, [prop]);
  }
};

window.sendPropertyInquiry = function(propId) {
  handleCardClick(propId);
};

// Booking Modal Logic
window.openBookingModal = function(propId) {
  const prop = PROPERTIES.find(p => p.id === propId);
  if (!prop) return;
  currentBookingProperty = prop;
  bookingPropertyTitle.textContent = `${prop.title} (${prop.formattedPrice})`;
  
  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById("book-date");
  if (dateInput) {
    dateInput.min = today;
    dateInput.value = today;
  }
  
  bookingModal.classList.remove("hidden");
};

btnCloseBooking.addEventListener("click", () => {
  bookingModal.classList.add("hidden");
});

bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("book-name").value.trim();
  const phone = document.getElementById("book-phone").value.trim();
  const date = document.getElementById("book-date").value;
  const notes = document.getElementById("book-notes").value.trim();

  bookingModal.classList.add("hidden");
  bookingForm.reset();

  // Confirmation in Chat
  setTimeout(() => {
    sendBotMessage(`🎉 **Viewing Tour Confirmed!**\n\nThank you **${name}**! Your property tour request for **${currentBookingProperty.title}** has been scheduled for **${date}**.\n\nOur verified real estate specialist will contact you on **${phone}** 2 hours prior to confirm arrangements. Notes saved: *"${notes || 'None'}"*`);
  }, 400);
});

// Clear Chat
btnClearChat.addEventListener("click", () => {
  if (confirm("Are you sure you want to reset the chat conversation?")) {
    chatMessages.innerHTML = "";
    state.chatHistory = [];
    sendBotMessage(`👋 Chat cleared! How can I assist with your real estate search now?`, PROPERTIES.slice(0, 2));
  }
});

// API Settings Modal Logic
btnApiModal.addEventListener("click", () => {
  apiModal.classList.remove("hidden");
  engineSelect.value = state.engine;
  customApiKeyInput.value = state.apiKey;
  toggleApiKeyField();
});

btnCloseModal.addEventListener("click", () => {
  apiModal.classList.add("hidden");
});

engineSelect.addEventListener("change", toggleApiKeyField);

function toggleApiKeyField() {
  if (engineSelect.value === "builtin") {
    apiKeyContainer.classList.add("hidden");
  } else {
    apiKeyContainer.classList.remove("hidden");
  }
}

btnSaveSettings.addEventListener("click", () => {
  state.engine = engineSelect.value;
  state.apiKey = customApiKeyInput.value.trim();
  localStorage.setItem("estatebot_engine", state.engine);
  localStorage.setItem("estatebot_apikey", state.apiKey);

  if (state.engine === "builtin") {
    aiEngineBadge.innerHTML = `<i class="fa-solid fa-microchip"></i><span>Smart Engine</span>`;
  } else {
    aiEngineBadge.innerHTML = `<i class="fa-solid fa-cloud"></i><span>${state.engine.toUpperCase()} Live</span>`;
  }

  apiModal.classList.add("hidden");
  sendBotMessage(`⚙️ AI Engine settings updated to **${state.engine.toUpperCase()}**.`);
});

function initSettings() {
  if (state.engine !== "builtin" && state.apiKey) {
    aiEngineBadge.innerHTML = `<i class="fa-solid fa-cloud"></i><span>${state.engine.toUpperCase()} Live</span>`;
  }
}

// External OpenAI LLM Call
async function callOpenAI(prompt) {
  const messages = [
    {
      role: "system",
      content: `You are EstateBot, an expert, enthusiastic, and polite real estate AI assistant. Answer questions about property buying, renting, pricing, mortgage calculations, location recommendations, and viewing appointments. Keep answers concise, nicely formatted with bullet points and bold highlights.`
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
          text: `You are EstateBot, a professional real estate assistant. User message: ${prompt}. Provide helpful advice with bullet points, pricing guidelines, or property suggestions.`
        }]
      }]
    })
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
