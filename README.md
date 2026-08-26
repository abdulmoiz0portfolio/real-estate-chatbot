# EstateBot AI - Real Estate AI Assistant & Property Finder 🏢🏡

An intelligent, responsive, and sleek Real Estate Chatbot website designed to assist clients with property discovery (Houses, Villas, Apartments, Commercial Plots), schedule on-site viewings, answer mortgage questions, calculate down payments, and explore investment ROI.

---

## ✨ Features

- 💬 **Interactive Real Estate Chatbot**: Responds with rich property cards, prices, specs, and details.
- 🌐 **Multi-language / Roman Urdu & English Support**: Understands queries in English as well as Roman Urdu (`ghar chahiye`, `rent ka flat`, `plot rate`, etc.).
- 📅 **Site Visit & Tour Booking System**: Direct booking modal that saves tour appointments with instant chat confirmation.
- 🧮 **Mortgage & Financing Guidance**: Answers EMI, down payment calculations, and ROI queries.
- 🎨 **Modern Dark Glassmorphism UI**: Built with Tailwind CSS, Lucide/FontAwesome icons, and smooth animations.
- ⚡ **Zero-Config Built-in AI Engine**: Works immediately in any browser without requiring backend servers or API keys.
- 🔌 **Optional Live LLM Support**: Supports plugging in OpenAI (GPT-4o) or Google Gemini API keys directly via browser settings modal.
- 🚀 **GitHub Pages Ready**: Zero build step required; deploy directly to GitHub Pages with 1 click.

---

## 📁 Project Structure

```
├── index.html       # Main HTML structure with chat UI & modals
├── style.css        # Glassmorphism, animations & scrollbar styles
├── app.js           # Real estate database, chatbot logic, and event handlers
├── .gitignore       # Git ignore configuration
└── README.md        # Documentation and GitHub push instructions
```

---

## 🚀 How to Run Locally

You can open `index.html` directly in your browser or run a simple local HTTP server:

### Option 1: Direct File Opening
Double-click `index.html` in your file explorer to open it in Chrome, Edge, Firefox, or Safari.

### Option 2: Using Python Live Server
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

---

## 📤 How to Push to GitHub

Follow these simple steps in your terminal / PowerShell:

```bash
# 1. Initialize git (if not already initialized) and stage files
git add .

# 2. Commit your changes
git commit -m "feat: initial commit for EstateBot AI Real Estate Chatbot"

# 3. Create a new repository on GitHub (e.g. named real-estate-chatbot)

# 4. Link your remote repository (replace with your repo URL)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# 5. Push code to GitHub
git push -u origin main
```

### 🌐 Free Hosting on GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** > **Pages**.
3. Under **Branch**, select `main` and root `/` folder, then click **Save**.
4. Your website will be live in 1-2 minutes!
