import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  hasDiagram?: boolean
}

function uid() {
  return Math.random().toString(36).slice(2)
}

type Props = {
  getDiagramJSON: () => string | null
  challengeDescription?: string
  sessionId?: number
  challengeContext?: { description: string; difficulty: string; topics: string[] }
}

export default function ChatPanel({ getDiagramJSON, challengeDescription, sessionId, challengeContext }: Props) {
  const [messages, setMessages] = useState<Message[]>(() =>
    challengeDescription
      ? [{ id: uid(), role: 'assistant', content: challengeDescription }]
      : []
  )
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming) return

    const hasDiagram = text.includes('@diagram')
    const diagramJSON = hasDiagram ? getDiagramJSON() : null

    const userMsg: Message = { id: uid(), role: 'user', content: text, hasDiagram: hasDiagram && diagramJSON !== null }
    const assistantId = uid()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setStreaming(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          ...(diagramJSON ? { diagram: diagramJSON } : {}),
          ...(sessionId != null ? { sessionId } : {}),
          ...(challengeContext ? { challengeContext } : {}),
        }),
      })

      if (!res.ok || !res.body) throw new Error('no stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw = decoder.decode(value, { stream: true })
        for (const line of raw.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const token = trimmed.slice(6) // skip 'data: ' (6 chars) to preserve leading spaces in tokens
          if (token === '[DONE]') break
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: m.content + token } : m)
          )
        }
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, content: 'AI not connected yet.' } : m)
      )
    } finally {
      setStreaming(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const lastId = messages.at(-1)?.id

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 flex flex-col gap-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded px-3 py-2 text-[0.88rem] leading-relaxed break-words ${
                msg.role === 'user'
                  ? 'bg-black text-white whitespace-pre-wrap'
                  : 'border border-black bg-white text-black'
              }`}
            >
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-[0.95rem] font-bold mt-3 mb-1">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-[0.88rem] font-bold mt-2 mb-1">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
                      inline
                        ? <code className="bg-gray-100 rounded px-1 py-0.5 text-[0.82rem] font-mono">{children}</code>
                        : <pre className="bg-gray-100 rounded p-2 my-2 overflow-x-auto text-[0.82rem] font-mono whitespace-pre">{children}</pre>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    hr: () => <hr className="border-gray-300 my-2" />,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
              {streaming && msg.id === lastId && msg.role === 'assistant' && (
                <span className="inline-block w-[2px] h-[1em] bg-black align-middle ml-0.5 animate-pulse" />
              )}
              {msg.hasDiagram && (
                <div className="text-[0.72rem] mt-1 opacity-60">↳ diagram attached</div>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-black p-3 flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none border border-black rounded px-3 py-2 text-[0.88rem] leading-relaxed outline-none focus:border-2 min-h-[40px] max-h-[120px] font-[inherit]"
          rows={1}
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
        />
        <button
          onClick={sendMessage}
          disabled={streaming || !input.trim()}
          className="font-[inherit] text-[0.85rem] font-semibold bg-black text-white border-none py-2 px-4 rounded cursor-pointer enabled:hover:bg-[#222] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  )
}
