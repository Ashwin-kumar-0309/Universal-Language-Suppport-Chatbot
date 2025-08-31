# 🌍 Universal Language Support Chatbot  

A **comprehensive multilingual chatbot** designed to break down language barriers and promote inclusivity.  
This project directly supports **United Nations Sustainable Development Goal 10 (Reduced Inequalities)** by enabling real-time multilingual communication, file translation, and accessible AI-powered assistance.  

---

## ✨ Features  

### 🧩 Core Capabilities  
- **🌐 Multi-language Support** → Chat in **19+ languages** (English, Spanish, Hindi, Chinese, Arabic, French, Japanese, Korean, and more).  
- **⚡ Real-time Translation** → Instant translations with automatic language detection (Google Translate API).  
- **📂 File Translation** → Upload and translate `.txt, .md, .py, .js, .html, .css, .json, .xml, .csv` files.  
- **🎙️ Voice Input/Output** → Speech-to-text and text-to-speech for hands-free communication.  
- **🤖 AI-Powered Responses** → Intelligent, context-aware replies powered by **Ollama** with models like `llama3.1`, `mistral`, and `phi`.  

### 🔍 Advanced Linguistic Features  
- Handles **idioms & cultural expressions** correctly.  
- Adapts to **cultural nuances and formality levels**.  
- Resolves **ambiguity in meaning** with contextual understanding.  
- Preserves **sentiment and tone** across translations.  
- Adapts **grammar structure** across different language families.  
- Recognizes **names, places, and entities** across languages.  

### 💻 User Experience  
- Clean, modern interface built with **React + Tailwind CSS**.  
- **Drag-and-drop file uploads** with progress indicators.  
- **Voice commands** with microphone integration.  
- Persistent **chat history** with language detection.  
- Fully **mobile-responsive** design.  

---

## 🚀 Quick Start  

### ✅ Prerequisites  
- **Node.js** (v16+)  
- **Python** (v3.8+)  
- **Ollama** (for local AI-powered responses)  

### ⚙️ Installation  

1. **Install Ollama**  
   ```powershell
   winget install Ollama.Ollama
   # or download from https://ollama.ai
   ```  

2. **Download models**  
   ```powershell
   ollama pull llama3.1:8b
   ollama pull mistral:7b
   ollama pull phi
   ```  

3. **Install Python dependencies**  
   ```powershell
   pip install -r requirements.txt
   ```  

4. **Install Node.js dependencies**  
   ```powershell
   npm install
   ```  

### ▶️ Running the Application  

1. Start **Ollama service**  
   ```powershell
   ollama serve
   ```  

2. Start **backend (Flask)**  
   ```powershell
   python backend/app.py
   ```  

3. Start **frontend (Vite)**  
   ```powershell
   npm run dev
   ```  

4. Open your browser → [http://localhost:3001](http://localhost:3001)  

---

## 🎯 Usage  

1. Select your preferred language from the dropdown.  
2. Type or speak your message (microphone supported).  
3. Receive real-time translated responses.  
4. Optionally listen to replies with **voice output**.  

---

## 🌐 Supported Languages  

- 🇺🇸 English  
- 🇪🇸 Español (Spanish)  
- 🇫🇷 Français (French)  
- 🇩🇪 Deutsch (German)  
- 🇮🇳 हिन्दी (Hindi)  
- 🇸🇦 العربية (Arabic)  
- 🇨🇳 中文 (Chinese)  
- 🇯🇵 日本語 (Japanese)  
- 🇰🇷 한국어 (Korean)  
- 🇵🇹 Português (Portuguese)  
- 🇷🇺 Русский (Russian)  
- 🇮🇹 Italiano (Italian)  
*(and more coming soon)*  

---

## 🌍 SDG 10 Impact  

This chatbot supports **SDG 10: Reduced Inequalities** by:  
- Breaking language barriers to communication.  
- Promoting inclusive dialogue across cultures.  
- Providing equal access to information.  
- Empowering marginalized communities.  
- Facilitating cross-cultural understanding.  

---

## 🛠️ Technology Stack  

**Frontend**  
- React 18 (hooks + functional components)  
- Tailwind CSS (modern styling)  
- Vite (lightning-fast build tool)  
- Lucide React (icons)  

**Backend**  
- Flask (RESTful APIs)  
- Ollama (local AI inference)  
- Google Translate API (translations)  
- Flask-CORS (cross-origin requests)  

**AI & NLP**  
- Ollama (LLaMA, Mistral, Phi models)  
- Google Translate  
- LangDetect (language detection)  
- Web Speech API (speech recognition/synthesis)  

---

## 📡 API Endpoints  

**Chat**  
```http
POST /api/chat
Content-Type: application/json
{
  "message": "Hello, how can I promote equality?",
  "language": "en",
  "history": []
}
```  

**Translate**  
```http
POST /api/translate
Content-Type: application/json
{
  "text": "Hello world",
  "target_language": "es",
  "source_language": "en"
}
```  

**Health Check**  
```http
GET /api/health
```  

---

## ⚙️ Configuration  

Create a `.env` file in project root:  
```env
OLLAMA_URL=http://localhost:11434/api/generate
MODEL_NAME=llama2
FLASK_ENV=development
```  

### Available Models  
- **llama2** (7B, recommended)  
- **mistral** (7B, high performance)  
- **phi** (3B, lightweight)  

---

## 🚀 Deployment  

**Development**  
```powershell
# Terminal 1
ollama serve
# Terminal 2
python backend/app.py
# Terminal 3
npm run dev
```  

**Production**  
```powershell
npm run build
# serve with your preferred web server
```  

---

## 🤝 Contributing  

We’d love your help! 💙  
1. Fork the repo  
2. Create a feature branch  
3. Add your improvements (with accessibility in mind)  
4. Test across languages  
5. Submit a pull request  

---

## 📜 License  
MIT License – see [LICENSE](./LICENSE) for details.  

---

## 🙏 Acknowledgments  

- **United Nations SDG 10** → Inspiration  
- **Ollama Team** → Local AI inference  
- **Google Translate** → Real-time translations  
- **Open Source Community** → Making inclusive tech possible  

---

## 🆘 Troubleshooting  

**Ollama Not Connected**  
- Run `ollama serve`  
- Check installed models: `ollama list`  
- Verify at: [http://localhost:11434](http://localhost:11434)  

**Translation Issues**  
- Check your internet connection  
- Verify language codes  
- Clear browser cache  

**Voice Features Not Working**  
- Allow microphone permissions  
- Use HTTPS or localhost  
- Try Chrome/Edge  

---

## 📞 Support  

- Open an issue on GitHub  
- Contact the dev team  
- Check the FAQ  

---

✨ **Together, we can reduce inequalities and build a more inclusive world through technology.** 🌍  
