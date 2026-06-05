import { useEffect, useState } from 'react'
import axios from 'axios'
import Onboarding from './components/Onboarding'
import './App.css'

const api = axios.create({ baseURL: '' })

type AppState = 'loading' | 'onboarding' | 'ready'

function App() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    api.get('/api/user-context')
      .then(() => setAppState('ready'))
      .catch(err => {
        if (err.response?.status === 404) {
          setAppState('onboarding')
        } else {
          setAppState('ready')
        }
      })
  }, [])

  useEffect(() => {
    if (appState !== 'ready') return
    api.get('/api')
      .then(res => setMessage(res.data))
      .catch(() => setMessage('Could not connect to server'))
  }, [appState])

  if (appState === 'loading') return null

  if (appState === 'onboarding') {
    return <Onboarding onComplete={() => setAppState('ready')} />
  }

  return (
    <>
      <section id="center">
        <div>
          <h1>System Design Prep</h1>
          {message && <p>{message}</p>}
        </div>
      </section>
    </>
  )
}

export default App
