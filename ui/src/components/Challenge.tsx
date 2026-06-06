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

const DEFAULT_MINUTES = 30

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function Challenge() {
  const { id } = useParams<{ id: string }>()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [leftWidth, setLeftWidth] = useState(50)
  const [started, setStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_MINUTES * 60)
  const containerRef = useRef<HTMLDivElement>(null)

  const timeUp = started && timeLeft <= 0
  const panelsEnabled = started && !timeUp

  useEffect(() => {
    axios.get<Challenge>(`/api/challenges/${id}`).then(res => setChallenge(res.data))
  }, [id])

  useEffect(() => {
    if (!started || timeLeft <= 0) return
    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timerId)
  }, [started, timeLeft])

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
          <span className={`text-base font-bold tabular-nums tracking-wide min-w-[52px] text-right${timeUp ? ' text-[#c00]' : ''}`}>
            {formatTime(timeLeft)}
          </span>
          <button
            className={`font-[inherit] text-[0.9rem] font-semibold text-white border-none py-[7px] px-5 rounded cursor-pointer tracking-wide disabled:opacity-40 disabled:cursor-not-allowed ${panelsEnabled ? 'bg-[#c00] hover:bg-[#a00]' : 'bg-black enabled:hover:bg-[#222]'}`}
            onClick={() => {
              if (panelsEnabled) {
                setStarted(false)
                setTimeLeft(DEFAULT_MINUTES * 60)
              } else {
                setStarted(true)
              }
            }}
            disabled={timeUp}
          >
            {panelsEnabled ? 'Stop' : 'Start'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        <div
          className={`relative overflow-hidden flex items-center justify-center bg-white${!panelsEnabled ? ' after:content-[\'\'] after:absolute after:inset-0 after:bg-[rgba(210,210,210,0.5)] after:pointer-events-none after:z-10' : ''}`}
          style={{ width: `${leftWidth}%` }}
        >
          <ChatPanel />
        </div>

        <div
          className="w-[5px] bg-black flex-shrink-0 transition-colors duration-100 hover:bg-[#444]"
          onMouseDown={panelsEnabled ? onDividerMouseDown : undefined}
          style={{ cursor: panelsEnabled ? 'col-resize' : 'default' }}
        />

        <div
          className={`relative overflow-hidden flex items-center justify-center bg-white flex-1${!panelsEnabled ? ' after:content-[\'\'] after:absolute after:inset-0 after:bg-[rgba(210,210,210,0.5)] after:pointer-events-none after:z-10' : ''}`}
        >
          <DiagramPanel />
        </div>
      </div>
    </div>
  )
}
