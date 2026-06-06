import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

type Props = {
  onClose: () => void
  onCreated: (id: number) => void
}

export default function GenerateChallengeDialog({ onClose, onCreated }: Props) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleGenerate() {
    const text = prompt.trim()
    if (!text || loading) return
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('/api/generate-challenge', { prompt: text })
      onCreated(res.data.id)
    } catch {
      setError('Challenge generation is not available yet.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onMouseDown={onClose}
    >
      <div
        className="bg-white border border-black rounded p-8 w-[480px] max-w-[90vw] flex flex-col gap-5"
        onMouseDown={e => e.stopPropagation()}
      >
        <div>
          <h2 className="text-[1.4rem] font-bold text-black m-0 mb-1">Generate Challenge</h2>
          <p className="text-[0.9rem] text-[#333] m-0">Describe the challenge you want to practise.</p>
        </div>

        <textarea
          ref={textareaRef}
          className="w-full resize-none border border-black rounded px-3 py-2 text-[0.9rem] leading-relaxed outline-none focus:border-2 font-[inherit]"
          rows={4}
          placeholder="e.g. Design a ride sharing app"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        {error && <p className="text-[0.9rem] text-[#c00] m-0">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="font-[inherit] text-[0.9rem] font-semibold bg-white text-black border border-black py-[7px] px-5 rounded cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="font-[inherit] text-[0.9rem] font-semibold bg-black text-white border-none py-[7px] px-5 rounded cursor-pointer enabled:hover:bg-[#222] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}
