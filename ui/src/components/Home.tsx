import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import GenerateChallengeDialog from './GenerateChallengeDialog'

type UserContext = {
  name: string
  current_role: string
  desired_role: string
  purpose: string
}

type Challenge = {
  id: number
  challenge_name: string
  description: string
  difficulty: string
  topics: string[]
}

type ChallengesResponse = {
  data: Challenge[]
  total: number
  page: number
  totalPages: number
}

const DIFFICULTY_OPTIONS = ['', 'easy', 'medium', 'hard'] as const

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: 'bg-black text-white',
  medium: 'bg-[#444] text-white',
  hard: 'bg-[#c00] text-white',
}

export default function Home() {
  const navigate = useNavigate()
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    axios.get('/api/user-context').then(res => setUserContext(res.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page, limit: 10 }
    if (filterDifficulty) params.difficulty = filterDifficulty
    if (filterTopic) params.topic = filterTopic

    axios
      .get<ChallengesResponse>('/api/challenges', { params })
      .then(res => {
        setChallenges(res.data.data)
        setTotal(res.data.total)
        setTotalPages(res.data.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page, filterDifficulty, filterTopic])

  function handleDifficultyChange(value: string) {
    setFilterDifficulty(value)
    setPage(1)
  }

  function handleTopicSearch() {
    setFilterTopic(topicInput.trim())
    setPage(1)
  }

  function handleClear() {
    setFilterDifficulty('')
    setFilterTopic('')
    setTopicInput('')
    setPage(1)
  }

  if (!userContext) return null

  return (
    <main className="mt-[52px] mx-auto px-6 py-12 max-w-[860px]">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-[2rem] font-bold text-black m-0">Welcome, {userContext.name}</h1>
        <button
          onClick={() => setShowGenerate(true)}
          className="font-[inherit] text-[0.9rem] font-semibold bg-black text-white border-none py-[7px] px-4 rounded cursor-pointer hover:bg-[#222] flex-shrink-0 mt-1"
        >
          + Generate Challenge
        </button>
      </div>
      <p className="text-base text-[#333] mb-8 m-0">Browse challenges below to start practising.</p>

      {showGenerate && (
        <GenerateChallengeDialog
          onClose={() => setShowGenerate(false)}
          onCreated={(id) => navigate(`/challenge/${id}`)}
        />
      )}

      <div className="flex items-center flex-wrap gap-2.5 pb-5 mb-6 border-b border-black">
        <select
          className="font-[inherit] text-[0.9rem] py-[7px] px-[10px] border border-black rounded bg-white text-black outline-none focus:border-2"
          value={filterDifficulty}
          onChange={e => handleDifficultyChange(e.target.value)}
        >
          {DIFFICULTY_OPTIONS.map(d => (
            <option key={d} value={d}>{d === '' ? 'All difficulties' : d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>

        <div className="flex">
          <input
            className="font-[inherit] text-[0.9rem] py-[7px] px-[10px] border border-black rounded-l bg-white text-black outline-none focus:border-2 border-r-0"
            type="text"
            placeholder="Filter by topic…"
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTopicSearch()}
          />
          <button
            className="font-[inherit] text-[0.9rem] font-semibold bg-black text-white border border-black py-[7px] px-[14px] rounded-r cursor-pointer hover:bg-[#222]"
            onClick={handleTopicSearch}
          >
            Search
          </button>
        </div>

        {(filterDifficulty || filterTopic) && (
          <button
            className="font-[inherit] text-[0.85rem] bg-white text-black border border-black py-[7px] px-3 rounded cursor-pointer hover:bg-[#f5f5f5]"
            onClick={handleClear}
          >
            Clear
          </button>
        )}

        <span className="text-[0.85rem] text-[#666] ml-auto">{total} challenge{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <p className="text-[#666] text-[0.95rem] m-0">Loading…</p>
      ) : challenges.length === 0 ? (
        <p className="text-[#666] text-[0.95rem] m-0">No challenges match your filters.</p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-3">
          {challenges.map(c => (
            <li key={c.id} className="border border-black rounded p-4 px-5 cursor-default transition-colors duration-100 hover:bg-[#f9f9f9]">
              <div className="flex items-center gap-2.5 mb-2">
                <Link className="text-[1.05rem] font-bold text-black no-underline hover:underline" to={`/challenge/${c.id}`}>{c.challenge_name}</Link>
                <span className={`text-[0.72rem] font-bold uppercase tracking-widest py-0.5 px-2 rounded ${DIFFICULTY_BADGE[c.difficulty] ?? 'bg-black text-white'}`}>
                  {c.difficulty}
                </span>
              </div>
              <p className="text-[0.9rem] text-[#333] m-0 mb-3 line-clamp-2">{c.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {c.topics.map(t => (
                  <span key={t} className="text-[0.78rem] border border-black rounded px-2 py-0.5 text-black">{t}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-[14px] mt-7">
          <button
            className="font-[inherit] text-[0.9rem] font-semibold bg-black text-white border-none py-2 px-5 rounded cursor-pointer tracking-wide disabled:opacity-35 disabled:cursor-not-allowed enabled:hover:bg-[#222]"
            onClick={() => setPage(p => p - 1)}
            disabled={page <= 1}
          >
            ← Prev
          </button>
          <span className="text-[0.9rem] text-[#333]">Page {page} of {totalPages}</span>
          <button
            className="font-[inherit] text-[0.9rem] font-semibold bg-black text-white border-none py-2 px-5 rounded cursor-pointer tracking-wide disabled:opacity-35 disabled:cursor-not-allowed enabled:hover:bg-[#222]"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </main>
  )
}
