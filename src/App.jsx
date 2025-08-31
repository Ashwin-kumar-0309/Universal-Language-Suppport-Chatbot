import React, { useState } from 'react'
import ChatbotHome from './ChatbotHome'
import ChatScreen from './ChatScreen'

function App() {
  const [currentView, setCurrentView] = useState('home') // 'home' or 'chat'
  const [theme, setTheme] = useState('light')

  // Navigation functions
  const handleNavigateToChat = (chatId = null) => {
    setCurrentView('chat')
  }

  const handleNavigateToHome = () => {
    setCurrentView('home')
  }

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  // If we're on the home page, render the ChatbotHome component
  if (currentView === 'home') {
    return (
      <ChatbotHome 
        onStartNewChat={handleNavigateToChat}
        onOpenChat={handleNavigateToChat}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />
    )
  }

  // If we're in the chat view, render the ChatScreen component
  return (
    <ChatScreen
      onNavigateHome={handleNavigateToHome}
      theme={theme}
      onThemeToggle={handleThemeToggle}
    />
  )
}

export default App
