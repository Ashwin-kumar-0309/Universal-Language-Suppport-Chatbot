import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Trash2,
  Mic,
  Upload,
  Send,
  PanelRightOpen,
  PanelRightClose,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Home,
  Globe,
  Volume2,
  VolumeX,
  MicOff,
  Languages,
  FileText,
  X
} from "lucide-react";
import axios from 'axios';

/**
 * Chat screen that matches your sketch design:
 * - Left sidebar with bot logo/name, New Chat button, and History list
 * - Right chat area with header, messages, and input bar
 * - Floating AI Status panel (draggable/minimizable)
 * - Selected chat highlighted and moved to top
 */

const seedChats = [
  { id: "c3", title: "Customer FAQ (French)", last: "Quels sont vos horaires?", ts: "Mon 09:10", language: "fr" },
  { id: "c2", title: "Translate Telugu email", last: "దయచేసి ఆర్డర్ వివరాలు పంపండి", ts: "Yesterday 18:22", language: "te" },
  { id: "c1", title: "Order status in Spanish", last: "¿Dónde está mi pedido?", ts: "Today 11:04", language: "es" },
];

export default function ChatScreen({ onNavigateHome, theme = 'light', onThemeToggle }) {
  const [botName] = useState("Universal Language Assistant");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState(seedChats);
  const [activeId, setActiveId] = useState("c3"); // Start with first chat selected
  const [messages, setMessages] = useState([{
    id: Date.now(),
    text: "Hello! I'm your Universal Language Support Assistant. How can I help you today?",
    sender: 'bot',
    timestamp: new Date(),
    language: 'en'
  }]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected', 'connecting', 'error'
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  // Language settings - moved to AI status window
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [detectedLanguage, setDetectedLanguage] = useState('None');
  
  // Floating AI status
  const [statusOpen, setStatusOpen] = useState(true);
  const [aiState, setAiState] = useState({
    detected: "auto",
    working: "en", 
    answer: "auto",
  });

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const languages = [
    { code: 'auto', name: 'Auto Detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'kn', name: 'Kannada' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'ta', name: 'Tamil' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'pa', name: 'Punjabi' },
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedLanguage === 'auto' ? 'en-US' : `${selectedLanguage}-${selectedLanguage.toUpperCase()}`;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [selectedLanguage]);

  const orderedChats = useMemo(() => {
    if (!activeId) return chats;
    const active = chats.find((c) => c.id === activeId);
    const rest = chats.filter((c) => c.id !== activeId);
    return active ? [active, ...rest] : chats;
  }, [chats, activeId]);

  const startNewChat = () => {
    const id = `c${Math.random().toString(36).slice(2, 7)}`;
    const newChat = { 
      id, 
      title: "New chat", 
      last: "", 
      ts: "Just now",
      language: selectedLanguage 
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveId(id);
    setMessages([{
      id: Date.now(),
      text: "Hello! I'm your Universal Language Support Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
      language: 'en'
    }]);
  };

  const openChat = (id) => {
    setActiveId(id);
    // Load messages for this chat (placeholder - you'd load from storage/API)
    setMessages([{
      id: Date.now(),
      text: "Hello! I'm your Universal Language Support Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
      language: 'en'
    }]);
  };

  const deleteChat = (id) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  // File upload handlers
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size too large. Please select a file smaller than 10MB.');
        return;
      }
      
      // Check file type
      const allowedTypes = ['.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml', '.csv'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('Unsupported file type. Please select a text-based file (.txt, .md, .py, .js, .html, .css, .json, .xml, .csv)');
        return;
      }
      
      setSelectedFile(file);
      setShowFileUpload(true);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    setIsFileUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('target_language', outputLanguage);
      formData.append('source_language', selectedLanguage);
      
      const response = await axios.post('http://localhost:5000/api/translate-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Add file upload message
        const fileUploadMessage = {
          id: Date.now(),
          text: `📁 Uploaded file: ${selectedFile.name} (${response.data.char_count} characters)`,
          sender: 'user',
          timestamp: new Date(),
          language: selectedLanguage,
          fileInfo: {
            filename: response.data.original_filename,
            size: response.data.file_size,
            type: response.data.file_type
          }
        };
        
        // Add translation result message
        const translationMessage = {
          id: Date.now() + 1,
          text: `🌍 File translated from ${response.data.detected_language} to ${response.data.target_language}:\n\n${response.data.translated_content}`,
          sender: 'bot',
          timestamp: new Date(),
          language: outputLanguage,
          isFileTranslation: true,
          originalContent: response.data.original_content,
          translatedContent: response.data.translated_content
        };
        
        setMessages(prev => [...prev, fileUploadMessage, translationMessage]);
        
        // Update chat title if this is a new conversation
        if (activeId) {
          setChats(prev => prev.map(chat => 
            chat.id === activeId 
              ? { ...chat, title: `File: ${selectedFile.name}`, last: "File translated" }
              : chat
          ));
        }
        
      } else {
        throw new Error(response.data.error || 'Translation failed');
      }
      
    } catch (error) {
      console.error('File upload error:', error);
      
      const errorMessage = {
        id: Date.now(),
        text: `❌ File translation failed: ${error.response?.data?.error || error.message}`,
        sender: 'bot',
        timestamp: new Date(),
        language: 'en'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsFileUploading(false);
      setSelectedFile(null);
      setShowFileUpload(false);
    }
  };

  const handleCancelFileUpload = () => {
    setSelectedFile(null);
    setShowFileUpload(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // If no active chat, create a new one automatically
    let currentActiveId = activeId;
    if (!currentActiveId) {
      const id = `c${Math.random().toString(36).slice(2, 7)}`;
      const newChat = { 
        id, 
        title: inputText.length > 30 ? inputText.slice(0, 30) + '...' : inputText, 
        last: inputText, 
        ts: "Just now",
        language: selectedLanguage 
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveId(id);
      currentActiveId = id;
    }

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText;
    setInputText('');
    setIsLoading(true);
    setConnectionStatus('connecting');

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: messageText,
        input_language: selectedLanguage,
        output_language: outputLanguage
      });

      setConnectionStatus('connected');

      if (response.data) {
        const botMessage = {
          id: Date.now() + 1,
          text: response.data.response || response.data.message,
          sender: 'bot',
          timestamp: new Date(),
          language: response.data.detected_language || outputLanguage,
          translation: response.data.translation
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Update AI state
        setAiState({
          detected: response.data.detected_language || 'auto',
          working: response.data.input_language || selectedLanguage,
          answer: response.data.output_language || outputLanguage
        });

        setDetectedLanguage(response.data.detected_language || 'None');

        // Update chat title if it's a new chat
        if (currentActiveId && chats.find(c => c.id === currentActiveId)?.title === "New chat") {
          const chatTitle = messageText.length > 30 ? messageText.slice(0, 30) + '...' : messageText;
          setChats(prev => prev.map(c => 
            c.id === currentActiveId ? { ...c, title: chatTitle, last: messageText } : c
          ));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionStatus('error');
      
      let errorText = "Sorry, I'm having trouble connecting to the server. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        if (error.response.data?.response) {
          errorText = error.response.data.response;
          setConnectionStatus('connected'); // Server is responding, just had an error
        } else if (error.response.data?.error) {
          errorText = `Error: ${error.response.data.error}`;
          setConnectionStatus('connected');
        }
      } else if (error.request) {
        // Request was made but no response received
        errorText = "Unable to connect to the server. Please check if the backend is running.";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        language: 'en'
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  const speakText = (text, language = 'en') => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-zinc-950 text-zinc-50' : 'bg-zinc-50 text-zinc-900'
    }`}>
      <div className="mx-auto flex h-screen max-w-7xl gap-0 px-2 sm:px-4">
        
        {/* Left Sidebar */}
        <motion.aside
          initial={{ width: 320 }}
          animate={{ width: sidebarOpen ? 320 : 80 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className={`relative flex flex-col border-r ${
            theme === 'dark' 
              ? 'border-zinc-800 bg-zinc-900/80' 
              : 'border-zinc-200 bg-white/80'
          } backdrop-blur-sm`}
        >
          
          {/* Header: Logo and Bot Name */}
          <div className="flex items-center gap-3 p-3 border-b border-zinc-200 dark:border-zinc-800">
            <motion.div
              layout
              className="flex h-10 w-10 items-center justify-center"
            >
              <img 
                src="/images/robot-logo.png" 
                alt="Universal Language Assistant Robot" 
                className="h-full w-full object-contain"
                onError={(e) => {
                  // Fallback to blue circle with chat icon
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 items-center justify-center shadow-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
            </motion.div>
            
            {sidebarOpen && (
              <h2 className={`text-sm font-bold ${
                theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'
              }`}>
                {botName}
              </h2>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="p-3 space-y-2">
            {sidebarOpen && (
              <button
                onClick={onNavigateHome}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <Home className="h-4 w-4" /> Home
              </button>
            )}
            
            <button
              onClick={startNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-sm font-medium text-white shadow hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              {sidebarOpen && "New Chat"}
            </button>

            {/* Translate Text and Voice Chat Options */}
            {sidebarOpen && (
              <>
                <button className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition ${
                  theme === 'dark'
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}>
                  <Globe className="h-4 w-4" />
                  Translate Text
                </button>
                <button className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition ${
                  theme === 'dark'
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}>
                  <Languages className="h-4 w-4" />
                  Voice Chat
                </button>
              </>
            )}
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {sidebarOpen && (
              <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                History
              </div>
            )}
            
            <ul className="space-y-1">
              {orderedChats.map((chat) => {
                const isActive = chat.id === activeId;
                return (
                  <li key={chat.id}>
                    <button
                      onClick={() => openChat(chat.id)}
                      className={`group flex w-full items-start justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? theme === 'dark'
                            ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                            : "border-blue-400 bg-blue-50 text-blue-900"
                          : theme === 'dark'
                            ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                            : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900"
                      }`}
                      title={sidebarOpen ? chat.title : chat.title}
                    >
                      <div className="min-w-0 flex-1">
                        {sidebarOpen ? (
                          <>
                            <div className={`truncate font-medium ${
                              isActive 
                                ? theme === 'dark' ? 'text-blue-200' : 'text-blue-900'
                                : theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'
                            }`}>
                              {chat.title}
                            </div>
                            <div className={`truncate text-xs ${
                              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                            }`}>
                              {chat.last || "(no messages yet)"}
                            </div>
                          </>
                        ) : (
                          <MessageSquare className="h-4 w-4 mx-auto" />
                        )}
                      </div>
                      
                      {sidebarOpen && !isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className={`rounded-lg p-1 transition ${
                            theme === 'dark' 
                              ? 'hover:bg-zinc-800 text-zinc-400' 
                              : 'hover:bg-zinc-100 text-zinc-400'
                          }`}
                          aria-label={`Delete ${chat.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.aside>

        {/* Right Chat Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          
          {/* Chat Header */}
          <div className={`flex items-center justify-between border-b px-4 py-3 ${
            theme === 'dark'
              ? 'border-zinc-800 bg-zinc-900/70'
              : 'border-zinc-200 bg-white/70'
          } backdrop-blur-sm`}>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-lg font-semibold ${
                theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'
              }`}>
                {activeId 
                  ? chats.find((c) => c.id === activeId)?.title || "New chat" 
                  : "Select or start a chat"
                }
              </div>
              <div className={`flex items-center gap-2 text-xs ${
                theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                <span>{botName}</span>
                <span className="text-zinc-400">•</span>
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-xs">
                    {connectionStatus === 'connected' ? 'Connected' :
                     connectionStatus === 'connecting' ? 'Connecting...' :
                     'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onThemeToggle}
                className={`rounded-lg border p-2 transition-colors ${
                  theme === 'dark'
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`rounded-lg border p-2 transition-colors ${
                  theme === 'dark'
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              {activeId ? (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 ${
                      message.sender === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {message.sender === 'bot' && (
                      <div className="w-8 h-8 rounded-full overflow-hidden shadow-lg flex-shrink-0 ring-2 ring-blue-500/20">
                        <img 
                          src="/images/robot-logo.png" 
                          alt="Assistant" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to gradient background with Bot icon
                            e.target.style.display = 'none';
                            e.target.parentElement.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'items-center', 'justify-center');
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <Bot className="w-4 h-4 text-white hidden" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
                        message.sender === 'bot'
                          ? theme === 'dark'
                            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                            : 'bg-white text-zinc-800 border border-zinc-200'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      }`}
                    >
                      {message.text}
                      {message.translation && (
                        <p className="text-xs mt-2 opacity-75 italic border-t border-current/20 pt-2">
                          Translation: {message.translation}
                        </p>
                      )}
                      
                      {message.sender === 'bot' && (
                        <button
                          onClick={() => speakText(message.text, message.language)}
                          className="mt-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
                          title="Read aloud"
                        >
                          {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {message.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center shadow-lg flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className={`text-center p-8 rounded-2xl border ${
                  theme === 'dark'
                    ? 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    : 'border-zinc-200 bg-white text-zinc-600'
                }`}>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full overflow-hidden">
                    <img 
                      src="/images/robot-logo.png" 
                      alt="Universal Language Assistant" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to MessageSquare icon
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <MessageSquare className="w-12 h-12 mx-auto text-zinc-400 hidden" />
                  </div>
                  <p className="text-lg font-medium mb-2">Welcome to Universal Language Assistant</p>
                  <p className="text-sm">Start a new chat or select from your history to begin.</p>
                </div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden animate-pulse ring-2 ring-blue-500/20">
                    <img 
                      src="/images/robot-logo.png" 
                      alt="Assistant" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient background with Bot icon
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'flex', 'items-center', 'justify-center');
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <Bot className="w-4 h-4 text-white hidden" />
                  </div>
                  <div className={`p-3 rounded-2xl ${
                    theme === 'dark' ? 'bg-zinc-800' : 'bg-white border border-zinc-200'
                  }`}>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Bar */}
          <div className={`border-t px-3 py-3 ${
            theme === 'dark'
              ? 'border-zinc-800 bg-zinc-900/80'
              : 'border-zinc-200 bg-white/80'
          } backdrop-blur-sm`}>
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message…"
                className={`flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'border-zinc-700 bg-zinc-800 text-white placeholder-zinc-400'
                    : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-500'
                }`}
              />
              
              <button
                onClick={isListening ? stopListening : startListening}
                className={`rounded-xl border p-3 transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white border-red-500'
                    : theme === 'dark'
                      ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              
              <input
                type="file"
                id="file-upload"
                accept=".txt,.md,.py,.js,.html,.css,.json,.xml,.csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => document.getElementById('file-upload').click()}
                className={`rounded-xl border p-3 transition-colors ${
                  theme === 'dark'
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
                title="Upload file for translation"
              >
                <Upload className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Status Panel - Bigger and positioned top-right */}
      <AnimatePresence>
        {statusOpen ? (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 w-96 rounded-2xl border p-4 shadow-xl backdrop-blur-sm ${
              theme === 'dark'
                ? 'border-zinc-800 bg-zinc-900/90'
                : 'border-zinc-200 bg-white/90'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <div className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'
                }`}>
                  AI Language Status
                </div>
              </div>
              <button
                onClick={() => setStatusOpen(false)}
                className={`rounded-lg p-1 transition-colors ${
                  theme === 'dark'
                    ? 'text-zinc-400 hover:bg-zinc-800'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
                aria-label="Minimize"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <StatusRow 
                label="Detected Language" 
                value={aiState.detected} 
                theme={theme}
              />
              <StatusRow 
                label="Working Language" 
                value={aiState.working} 
                theme={theme}
              />
              <StatusRow 
                label="Answer Language" 
                value={aiState.answer} 
                theme={theme}
              />
            </div>

            {/* Language Settings moved here */}
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className={`text-sm font-semibold mb-3 ${
                theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'
              }`}>
                Language Settings
              </h3>
              <div className="space-y-2">
                <div>
                  <label className={`text-xs ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Input Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className={`w-full mt-1 rounded-lg border px-3 py-2 text-sm ${
                      theme === 'dark'
                        ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
                        : 'border-zinc-300 bg-white text-zinc-900'
                    }`}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`text-xs ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Output Language
                  </label>
                  <select
                    value={outputLanguage}
                    onChange={(e) => setOutputLanguage(e.target.value)}
                    className={`w-full mt-1 rounded-lg border px-3 py-2 text-sm ${
                      theme === 'dark'
                        ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
                        : 'border-zinc-300 bg-white text-zinc-900'
                    }`}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={`mt-4 text-xs ${
              theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'
            }`}>
              🔄 Updates live from backend • Drag me anywhere
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => setStatusOpen(true)}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-6 py-4 text-lg font-medium shadow-lg ${
              theme === 'dark'
                ? 'border-zinc-800 bg-zinc-900 text-zinc-100'
                : 'border-zinc-200 bg-white text-zinc-700'
            }`}
          >
            <Globe className="h-6 w-6" />
            AI Status
          </motion.button>
        )}
      </AnimatePresence>

      {/* File Upload Modal */}
      <AnimatePresence>
        {showFileUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleCancelFileUpload}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-md rounded-2xl border p-6 shadow-xl ${
                theme === 'dark'
                  ? 'border-zinc-700 bg-zinc-800'
                  : 'border-zinc-300 bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'
                }`}>
                  Translate File
                </h3>
                <button
                  onClick={handleCancelFileUpload}
                  className={`rounded-lg p-1 transition-colors ${
                    theme === 'dark'
                      ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedFile && (
                <div className={`mb-4 rounded-lg border p-3 ${
                  theme === 'dark'
                    ? 'border-zinc-700 bg-zinc-900/50'
                    : 'border-zinc-200 bg-zinc-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1">
                      <p className={`font-medium ${
                        theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'
                      }`}>
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                  }`}>
                    From Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className={`w-full rounded-lg border p-2 text-sm ${
                      theme === 'dark'
                        ? 'border-zinc-700 bg-zinc-800 text-zinc-200'
                        : 'border-zinc-300 bg-white text-zinc-700'
                    }`}
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                  }`}>
                    To Language
                  </label>
                  <select
                    value={outputLanguage}
                    onChange={(e) => setOutputLanguage(e.target.value)}
                    className={`w-full rounded-lg border p-2 text-sm ${
                      theme === 'dark'
                        ? 'border-zinc-700 bg-zinc-800 text-zinc-200'
                        : 'border-zinc-300 bg-white text-zinc-700'
                    }`}
                  >
                    {languages.filter(lang => lang.code !== 'auto').map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCancelFileUpload}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      theme === 'dark'
                        ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                        : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={isFileUploading}
                    className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isFileUploading ? 'Translating...' : 'Translate'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusRow({ label, value, theme }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
      theme === 'dark'
        ? 'border-zinc-800 bg-zinc-900/60'
        : 'border-zinc-200 bg-zinc-50'
    }`}>
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`rounded-lg px-2 py-1 text-xs font-mono ${
        theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-white text-zinc-700'
      }`}>
        {value}
      </span>
    </div>
  );
}
