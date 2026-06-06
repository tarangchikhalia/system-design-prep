import { useEffect, useState } from 'react'
import axios from 'axios'
import './Home.css'

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

export default function Home() {
  const [userContext, setUserContext] = useState<UserContext | null>(null)
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
    <main className="home">
      <h1 className="home-heading">Welcome, {userContext.name}</h1>
      <p className="home-subheading">Browse challenges below to start practising.</p>

      <div className="filter-bar">
        <select
          className="filter-select"
          value={filterDifficulty}
          onChange={e => handleDifficultyChange(e.target.value)}
        >
          {DIFFICULTY_OPTIONS.map(d => (
            <option key={d} value={d}>{d === '' ? 'All difficulties' : d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>

        <div className="filter-topic-group">
          <input
            className="filter-input"
            type="text"
            placeholder="Filter by topic…"
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTopicSearch()}
          />
          <button className="filter-btn" onClick={handleTopicSearch}>Search</button>
        </div>

        {(filterDifficulty || filterTopic) && (
          <button className="filter-clear-btn" onClick={handleClear}>Clear</button>
        )}

        <span className="filter-count">{total} challenge{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <p className="challenges-loading">Loading…</p>
      ) : challenges.length === 0 ? (
        <p className="challenges-empty">No challenges match your filters.</p>
      ) : (
        <ul className="challenge-list">
          {challenges.map(c => (
            <li key={c.id} className="challenge-card">
              <div className="challenge-card-header">
                <span className="challenge-card-title">{c.challenge_name}</span>
                <span className={`difficulty-badge difficulty-${c.difficulty}`}>{c.difficulty}</span>
              </div>
              <p className="challenge-card-desc">{c.description}</p>
              <div className="topic-tags">
                {c.topics.map(t => (
                  <span key={t} className="topic-tag">{t}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage(p => p - 1)}
            disabled={page <= 1}
          >
            ← Prev
          </button>
          <span className="pagination-label">Page {page} of {totalPages}</span>
          <button
            className="pagination-btn"
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
