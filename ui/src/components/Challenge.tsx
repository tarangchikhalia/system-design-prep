import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import ChatPanel from './ChatPanel'
import DiagramPanel from './DiagramPanel'

type Challenge = {
  id: number
  challenge_name: string
  description: string
  difficulty: string
  topics: string[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function Challenge() {
  const { id } = useParams<{ id: string }>()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [leftWidth, setLeftWidth] = useState(50)
  const [elapsed, setElapsed] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const getDiagramJSONRef = useRef<(() => string) | null>(null)

  useEffect(() => {
    axios.get<Challenge>(`/api/challenges/${id}`).then(res => setChallenge(res.data))
  }, [id])

  useEffect(() => {
    if (!challenge) return
    axios.post<{ id: number }>('/api/sessions', { challengeId: challenge.id })
      .then(res => setSessionId(res.data.id))
    const timerId = setInterval(() => setElapsed(t => t + 1), 1000)
    return () => clearInterval(timerId)
  }, [challenge])

  async function handleFinish() {
    if (sessionId) await axios.patch(`/api/sessions/${sessionId}/end`)
    setShowEvaluation(true)
  }

  function onDividerMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const startX = e.clientX
    const startWidth = leftWidth

    function onMove(ev: MouseEvent) {
      const delta = ((ev.clientX - startX) / container!.offsetWidth) * 100
      setLeftWidth(Math.min(80, Math.max(20, startWidth + delta)))
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  if (!challenge) return null

  return (
    <div className="flex flex-col h-screen pt-[52px]">
      <header className="h-[52px] flex items-center px-6 gap-4 border-b border-black bg-white flex-shrink-0">
        <Link to="/" className="text-[0.9rem] text-black no-underline whitespace-nowrap flex-shrink-0 hover:underline">← Back</Link>
        <h1 className="flex-1 text-[1.05rem] font-bold m-0 overflow-hidden text-ellipsis whitespace-nowrap">{challenge.challenge_name}</h1>
        <div className="flex items-center gap-[14px] flex-shrink-0">
          <span className="text-base font-bold tabular-nums tracking-wide min-w-[52px] text-right">
            {formatTime(elapsed)}
          </span>
          <button
            className="font-[inherit] text-[0.9rem] font-semibold text-white bg-black border-none py-[7px] px-5 rounded cursor-pointer tracking-wide hover:bg-[#222]"
            onClick={handleFinish}
          >
            Finish
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        <div
          className="relative overflow-hidden flex items-center justify-center bg-white"
          style={{ width: `${leftWidth}%` }}
        >
          <ChatPanel
            getDiagramJSON={() => getDiagramJSONRef.current?.() ?? null}
            challengeDescription={challenge.description}
            sessionId={sessionId ?? undefined}
            challengeContext={{ description: challenge.description, difficulty: challenge.difficulty, topics: challenge.topics }}
          />
        </div>

        <div
          className="w-[5px] bg-black flex-shrink-0 transition-colors duration-100 hover:bg-[#444] cursor-col-resize"
          onMouseDown={onDividerMouseDown}
        />

        <div className="relative overflow-hidden flex items-center justify-center bg-white flex-1">
          <DiagramPanel onReady={(fn) => { getDiagramJSONRef.current = fn }} />
        </div>
      </div>

      {showEvaluation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded border border-black w-full max-w-lg mx-4 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black">
              <h2 className="text-[1rem] font-bold m-0">Session Complete</h2>
              <span className="text-[0.85rem] text-[#666] tabular-nums">Time: {formatTime(elapsed)}</span>
            </div>
            <div className="px-5 py-6 text-[0.88rem] text-[#444]">
              Evaluation coming soon…
            </div>
            <div className="px-5 py-4 border-t border-black flex justify-end">
              <button
                className="font-[inherit] text-[0.85rem] font-semibold bg-black text-white border-none py-2 px-5 rounded cursor-pointer hover:bg-[#222]"
                onClick={() => setShowEvaluation(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
