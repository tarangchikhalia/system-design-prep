import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import ChatPanel from './ChatPanel'
import DiagramPanel from './DiagramPanel'
import './Challenge.css'

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
      const delta = ((ev.clientX - startX) / container.offsetWidth) * 100
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
    <div className="challenge-page">
      <header className="challenge-header">
        <Link to="/" className="challenge-back">← Back</Link>
        <h1 className="challenge-title">{challenge.challenge_name}</h1>
        <div className="challenge-controls">
          <span className={`challenge-timer${timeUp ? ' challenge-timer--up' : ''}`}>
            {formatTime(timeLeft)}
          </span>
          <button
            className={`challenge-start-btn${panelsEnabled ? ' challenge-stop-btn' : ''}`}
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

      <div className="challenge-body" ref={containerRef}>
        <div
          className={`challenge-panel${!panelsEnabled ? ' panel--disabled' : ''}`}
          style={{ width: `${leftWidth}%` }}
        >
          <ChatPanel />
        </div>

        <div
          className="panel-divider"
          onMouseDown={panelsEnabled ? onDividerMouseDown : undefined}
          style={{ cursor: panelsEnabled ? 'col-resize' : 'default' }}
        />

        <div
          className={`challenge-panel${!panelsEnabled ? ' panel--disabled' : ''}`}
          style={{ flex: 1 }}
        >
          <DiagramPanel />
        </div>
      </div>
    </div>
  )
}
