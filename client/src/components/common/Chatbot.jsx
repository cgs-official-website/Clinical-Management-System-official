import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw, AlertCircle, Minimize2 } from 'lucide-react'
import api from '../../lib/api'

const sanitizeUrl = (url) => {
  if (!url) return '#'
  const trimmed = url.trim()
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return trimmed
  }
  return '#'
}

const parseInlineMarkdown = (text, isUser, keyPrefix = 'inline') => {
  if (!text) return null

  // Remove escape slashes before markdown symbols: e.g. \*\* -> **
  const cleanText = text.replace(/\\([*_`~#+\-.!\\[\]()])/g, '$1')

  const tokenRegex =
    /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[\s\S]+?\*\*|__[\s\S]+?__|(?<!\w)\*[^*]+\*(?!\w)|(?<!\w)_[^_]+_(?!\w)|\[[^\]]+\]\([^)]+\))/g

  const parts = []
  let lastIndex = 0
  let match
  let tokenIdx = 0

  while ((match = tokenRegex.exec(cleanText)) !== null) {
    const matchIndex = match.index
    if (matchIndex > lastIndex) {
      parts.push(cleanText.substring(lastIndex, matchIndex))
    }

    const token = match[0]
    const key = `${keyPrefix}-${tokenIdx++}`

    if (token.startsWith('`') && token.endsWith('`')) {
      const codeText = token.slice(1, -1)
      parts.push(
        <code
          key={key}
          className={`px-1.5 py-0.5 rounded font-mono text-[0.85em] ${
            isUser
              ? 'bg-teal-700/60 text-teal-100 border border-teal-500/40'
              : 'bg-slate-100 dark:bg-slate-700/80 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-600/50'
          }`}
        >
          {codeText}
        </code>
      )
    } else if (token.startsWith('***') && token.endsWith('***')) {
      const inner = token.slice(3, -3)
      parts.push(
        <strong key={key} className={`font-semibold ${isUser ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
          <em>{parseInlineMarkdown(inner, isUser, `${key}-bi`)}</em>
        </strong>
      )
    } else if (
      (token.startsWith('**') && token.endsWith('**')) ||
      (token.startsWith('__') && token.endsWith('__'))
    ) {
      const inner = token.slice(2, -2)
      parts.push(
        <strong key={key} className={`font-semibold ${isUser ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
          {parseInlineMarkdown(inner, isUser, `${key}-b`)}
        </strong>
      )
    } else if (
      (token.startsWith('*') && token.endsWith('*')) ||
      (token.startsWith('_') && token.endsWith('_'))
    ) {
      const inner = token.slice(1, -1)
      parts.push(
        <em key={key} className="italic">
          {parseInlineMarkdown(inner, isUser, `${key}-i`)}
        </em>
      )
    } else if (token.startsWith('[') && token.includes('](')) {
      const closeBracket = token.indexOf('](')
      const linkText = token.slice(1, closeBracket)
      const linkUrl = token.slice(closeBracket + 2, -1)
      parts.push(
        <a
          key={key}
          href={sanitizeUrl(linkUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className={`hover:underline font-medium ${isUser ? 'text-white underline' : 'text-teal-600 dark:text-teal-400'}`}
        >
          {parseInlineMarkdown(linkText, isUser, `${key}-link`)}
        </a>
      )
    } else {
      parts.push(token)
    }

    lastIndex = matchIndex + token.length
  }

  if (lastIndex < cleanText.length) {
    parts.push(cleanText.substring(lastIndex))
  }

  return parts
}

const renderLineWithBreaks = (text, isUser, keyPrefix) => {
  if (typeof text !== 'string') return text
  const lines = text.split('\n')
  return lines.map((line, idx) => (
    <React.Fragment key={`${keyPrefix}-br-${idx}`}>
      {idx > 0 && <br />}
      {parseInlineMarkdown(line, isUser, `${keyPrefix}-line-${idx}`)}
    </React.Fragment>
  ))
}

export const FormattedChatMessage = ({ content, isUser = false }) => {
  if (!content) return null

  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g
  const chunks = []
  let lastIndex = 0
  let codeMatch

  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    if (codeMatch.index > lastIndex) {
      chunks.push({ type: 'text', text: content.substring(lastIndex, codeMatch.index) })
    }
    chunks.push({
      type: 'code',
      language: codeMatch[1] || '',
      code: codeMatch[2].trim(),
    })
    lastIndex = codeMatch.index + codeMatch[0].length
  }
  if (lastIndex < content.length) {
    chunks.push({ type: 'text', text: content.substring(lastIndex) })
  }

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {chunks.map((chunk, chunkIdx) => {
        if (chunk.type === 'code') {
          return (
            <div
              key={`code-block-${chunkIdx}`}
              className="my-2 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 text-xs font-mono"
            >
              {chunk.language && (
                <div className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-700">
                  {chunk.language}
                </div>
              )}
              <pre className="p-3 overflow-x-auto whitespace-pre">
                <code>{chunk.code}</code>
              </pre>
            </div>
          )
        }

        const rawLines = chunk.text.split(/\r?\n/)
        const blocks = []
        let currentList = null
        let currentParagraphLines = []

        const flushParagraph = () => {
          if (currentParagraphLines.length > 0) {
            blocks.push({
              type: 'paragraph',
              text: currentParagraphLines.join('\n'),
            })
            currentParagraphLines = []
          }
        }

        const flushList = () => {
          if (currentList) {
            blocks.push(currentList)
            currentList = null
          }
        }

        for (let i = 0; i < rawLines.length; i++) {
          const line = rawLines[i]
          const trimmed = line.trim()

          if (!trimmed) {
            flushParagraph()
            flushList()
            continue
          }

          const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
          if (headerMatch) {
            flushParagraph()
            flushList()
            blocks.push({
              type: 'header',
              level: headerMatch[1].length,
              text: headerMatch[2],
            })
            continue
          }

          const bulletMatch = line.match(/^\s*([-*+])\s+(.*)$/)
          if (bulletMatch) {
            flushParagraph()
            if (!currentList || currentList.type !== 'ul') {
              flushList()
              currentList = { type: 'ul', items: [] }
            }
            currentList.items.push(bulletMatch[2])
            continue
          }

          const numberMatch = line.match(/^\s*(\d+)\.\s+(.*)$/)
          if (numberMatch) {
            flushParagraph()
            if (!currentList || currentList.type !== 'ol') {
              flushList()
              currentList = { type: 'ol', items: [] }
            }
            currentList.items.push(numberMatch[2])
            continue
          }

          const quoteMatch = trimmed.match(/^>\s*(.*)$/)
          if (quoteMatch) {
            flushParagraph()
            flushList()
            blocks.push({ type: 'quote', text: quoteMatch[1] })
            continue
          }

          const isDisclaimer =
            trimmed.toLowerCase().startsWith('disclaimer:') ||
            trimmed.toLowerCase().startsWith('*disclaimer:') ||
            trimmed.toLowerCase().startsWith('**disclaimer:')

          if (isDisclaimer) {
            flushParagraph()
            flushList()
            blocks.push({ type: 'disclaimer', text: trimmed })
            continue
          }

          flushList()
          currentParagraphLines.push(line)
        }

        flushParagraph()
        flushList()

        return (
          <React.Fragment key={`chunk-${chunkIdx}`}>
            {blocks.map((block, blockIdx) => {
              const blockKey = `b-${chunkIdx}-${blockIdx}`

              if (block.type === 'header') {
                const Tag = block.level <= 2 ? 'h3' : 'h4'
                return (
                  <Tag
                    key={blockKey}
                    className={`font-bold my-1.5 ${
                      isUser ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {parseInlineMarkdown(block.text, isUser, blockKey)}
                  </Tag>
                )
              }

              if (block.type === 'ul') {
                return (
                  <ul key={blockKey} className="list-disc list-outside ml-4 my-1.5 space-y-1">
                    {block.items.map((item, itemIdx) => (
                      <li key={`${blockKey}-item-${itemIdx}`} className="pl-0.5 leading-relaxed">
                        {renderLineWithBreaks(item, isUser, `${blockKey}-item-${itemIdx}`)}
                      </li>
                    ))}
                  </ul>
                )
              }

              if (block.type === 'ol') {
                return (
                  <ol key={blockKey} className="list-decimal list-outside ml-4 my-1.5 space-y-1">
                    {block.items.map((item, itemIdx) => (
                      <li key={`${blockKey}-item-${itemIdx}`} className="pl-0.5 leading-relaxed">
                        {renderLineWithBreaks(item, isUser, `${blockKey}-item-${itemIdx}`)}
                      </li>
                    ))}
                  </ol>
                )
              }

              if (block.type === 'quote') {
                return (
                  <blockquote
                    key={blockKey}
                    className={`border-l-2 pl-3 my-2 py-0.5 italic ${
                      isUser
                        ? 'border-teal-300 text-teal-100'
                        : 'border-teal-500 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {renderLineWithBreaks(block.text, isUser, blockKey)}
                  </blockquote>
                )
              }

              if (block.type === 'disclaimer') {
                return (
                  <div
                    key={blockKey}
                    className={`mt-2.5 pt-2 border-t text-[11px] italic leading-snug ${
                      isUser
                        ? 'border-teal-500/40 text-teal-100/90'
                        : 'border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {renderLineWithBreaks(block.text, isUser, blockKey)}
                  </div>
                )
              }

              return (
                <p key={blockKey} className="my-1.5 first:mt-0 last:mb-0 leading-relaxed">
                  {renderLineWithBreaks(block.text, isUser, blockKey)}
                </p>
              )
            })}
          </React.Fragment>
        )
      })}
    </div>
  )
}

const INITIAL_MESSAGE = {
  id: 'welcome-1',
  role: 'assistant',
  content: `Hello! 👋 I am your Clinical Management System AI assistant.

I can help answer questions about:
- **System Features**: Dynamic RBAC, EHR charts, timeline scheduling, pharmacy inventory, and billing.
- **Health & Wellness**: General health education, disease prevention, and healthy lifestyle guidance.

*How can I assist you today?*`,
}

const QUICK_SUGGESTIONS = [
  'What features does this CMS have?',
  'How does the RBAC permission system work?',
  'Tips for good cardiovascular health?',
]

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, isLoading])

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim()
    if (!query || isLoading) return

    setError(null)
    setInput('')

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setIsLoading(true)

    // Build context history (exclude initial welcome if unnecessary or format cleanly)
    const history = updatedMessages
      .filter((m) => m.id !== 'welcome-1')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))

    try {
      const res = await api.post('/api/chat', {
        message: query,
        history,
      })

      if (res.data?.success && res.data?.reply) {
        const botMsg = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: res.data.reply,
        }
        setMessages((prev) => [...prev, botMsg])
      } else {
        throw new Error(res.data?.error?.message || 'Failed to receive response from AI.')
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Unable to connect to AI assistant. Please try again.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
      if (lastUserMsg) {
        handleSend(lastUserMsg.content)
      }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-4 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md h-[530px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-2.5">
                <div className="relative p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Bot className="w-5 h-5 text-teal-100" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-teal-700 rounded-full" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                    Clinical Assistant AI
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </h3>
                  <p className="text-[11px] text-teal-100/80">Online • Answers CMS & Health Questions</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950/40">
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                        isUser
                          ? 'bg-teal-600 text-white'
                          : 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[82%] p-3 rounded-2xl leading-relaxed ${
                        isUser
                          ? 'bg-teal-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <FormattedChatMessage content={msg.content} isUser={isUser} />
                    </div>
                  </div>
                )
              })}

              {/* Typing / Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center justify-center">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl rounded-tl-none text-slate-400 flex items-center space-x-1.5">
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="px-2 py-1 bg-red-100 dark:bg-red-900/60 hover:bg-red-200 rounded text-[11px] font-medium flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips (only if 1 message exists) */}
            {messages.length === 1 && !isLoading && (
              <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(sug)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-slate-600 dark:text-slate-300"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 disabled:opacity-60 text-slate-800 dark:text-slate-100"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl disabled:opacity-50 transition-all shadow-sm focus:outline-none"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group p-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-full shadow-xl focus:outline-none flex items-center justify-center transition-all duration-300 border-2 border-white/20"
        aria-label="Toggle Chatbot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6 fill-white/10" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-teal-700 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}

export default Chatbot
