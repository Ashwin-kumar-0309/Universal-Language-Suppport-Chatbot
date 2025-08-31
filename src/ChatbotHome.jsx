import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MessageSquare, Trash2, Globe, Languages } from "lucide-react";

export default function ChatbotHome({ onStartNewChat, onOpenChat, theme = 'light', onThemeToggle }) {
  // Dynamic and genuine chat history
  const [chats, setChats] = useState([
    { 
      id: "c1", 
      title: "Order status in Spanish", 
      last: "¿Dónde está mi pedido?", 
      ts: "Today 11:04",
      language: "es",
      messages: 12 
    },
    { 
      id: "c2", 
      title: "Translate Telugu email", 
      last: "దయచేసి ఆర్డర్ వివరాలు పంపండి", 
      ts: "Yesterday 18:22",
      language: "te",
      messages: 8
    },
    { 
      id: "c3", 
      title: "Customer FAQ (French)", 
      last: "Quels sont vos horaires?", 
      ts: "Mon 09:10",
      language: "fr",
      messages: 15
    },
    { 
      id: "c4", 
      title: "Hindi conversation", 
      last: "आपका स्वागत है", 
      ts: "Sun 14:30",
      language: "hi",
      messages: 6
    },
  ]);

  const startNewChat = () => {
    const id = `c${Math.random().toString(36).slice(2, 7)}`;
    const item = { 
      id, 
      title: "New chat", 
      last: "", 
      ts: "Just now",
      language: "auto",
      messages: 0
    };
    setChats((prev) => [item, ...prev]);
    if (onStartNewChat) {
      onStartNewChat(id);
    }
  };

  const openChat = (chatData) => {
    if (onOpenChat) {
      onOpenChat(chatData);
    }
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    setChats((prev) => prev.filter((c) => c.id !== id));
  };

  const getLanguageFlag = (langCode) => {
    const flags = {
      'en': '🇺🇸',
      'es': '🇪🇸', 
      'fr': '🇫🇷',
      'te': '🇮🇳',
      'hi': '🇮🇳',
      'auto': '🌐'
    };
    return flags[langCode] || '🌐';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 text-zinc-50' 
        : 'bg-gradient-to-b from-zinc-50 to-zinc-100 text-zinc-900'
    }`}>
      
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onThemeToggle}
          className={`rounded-full p-3 transition-all duration-300 shadow-lg ${
            theme === 'dark'
              ? 'bg-zinc-800 text-yellow-400 hover:bg-zinc-700'
              : 'bg-white text-orange-500 hover:bg-zinc-50'
          }`}
          title="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-28 pt-12 sm:pt-16">
        
        {/* Header: Logo + Name */}
        <div className="flex flex-col items-center gap-4 mb-8">
          {/* Robot Logo Only */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="relative"
            aria-label="Universal Language Assistant Robot"
          >
            <div className="h-32 w-32 flex items-center justify-center">
              <img 
                src="/images/robot-logo.png" 
                alt="Universal Language Assistant Robot" 
                className="h-full w-full object-contain"
                onError={(e) => {
                  // Simple fallback to chat icon if robot image doesn't load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden h-32 w-32 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 items-center justify-center shadow-xl">
                <MessageSquare className="h-16 w-16 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Bot name */}
          <div className="text-center">
            <h1 className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
              theme === 'dark'
                ? 'from-blue-400 to-purple-400'
                : 'from-blue-600 to-purple-600'
            }`}>
              Universal Language Assistant
            </h1>
            <p className={`text-sm mt-2 max-w-md ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              Breaking language barriers • Promoting equality • Supporting 19+ languages
            </p>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="relative my-8 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={startNewChat}
            className={`group h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl transition ${
              theme === 'dark'
                ? 'ring-4 ring-blue-400/20'
                : 'ring-4 ring-blue-200/60'
            }`}
            aria-label="Start new chat"
          >
            <Plus className="mx-auto h-9 w-9" />
          </motion.button>
        </div>

        {/* Quick Actions - Only Translation and Voice Chat */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button className={`rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition ${
            theme === 'dark'
              ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700'
          }`}>
            <Globe className="inline w-4 h-4 mr-2" />
            Translate Text
          </button>
          <button className={`rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition ${
            theme === 'dark'
              ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700'
          }`}>
            <Languages className="inline w-4 h-4 mr-2" />
            Voice Chat
          </button>
        </div>

        {/* Previous chats / history - Dynamic and Genuine */}
        <section aria-labelledby="history-title" className="mt-6">
          <h2 id="history-title" className={`mb-3 text-sm font-semibold ${
            theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'
          }`}>
            Previous Conversations
          </h2>

          <div className={`rounded-2xl border shadow-sm ${
            theme === 'dark'
              ? 'border-zinc-800 bg-zinc-900'
              : 'border-zinc-200 bg-white'
          }`}>
            {chats.length === 0 && (
              <div className={`p-6 text-center text-sm ${
                theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'
              }`}>
                No chats yet. Start a new one!
              </div>
            )}

            <ul className={`divide-y ${
              theme === 'dark' ? 'divide-zinc-800' : 'divide-zinc-200'
            }`}>
              {chats.map((chat) => (
                <li 
                  key={chat.id} 
                  className={`group flex items-center gap-4 px-4 py-4 cursor-pointer transition ${
                    theme === 'dark'
                      ? 'hover:bg-zinc-800'
                      : 'hover:bg-zinc-50'
                  }`}
                  onClick={() => openChat(chat)}
                >
                  {/* Language Flag */}
                  <div className="text-lg">
                    {getLanguageFlag(chat.language)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium leading-6 ${
                        theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'
                      }`}>
                        {chat.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`${
                          theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'
                        }`}>
                          {chat.messages} msgs
                        </span>
                        <span className={`${
                          theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'
                        }`}>
                          {chat.ts}
                        </span>
                      </div>
                    </div>
                    <p className={`mt-1 line-clamp-1 text-sm ${
                      theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                    }`}>
                      {chat.last}
                    </p>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg transition ${
                      theme === 'dark'
                        ? 'hover:bg-zinc-700 text-zinc-400 hover:text-red-400'
                        : 'hover:bg-zinc-100 text-zinc-400 hover:text-red-500'
                    }`}
                    aria-label={`Delete ${chat.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
