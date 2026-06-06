import { useEffect, useState } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Onboarding from './components/Onboarding'
import NavigationBar from './components/NavigationBar'
import Home from './components/Home'
import Challenge from './components/Challenge'

type UserContext = {
  name: string
  current_role: string
  desired_role: string
  purpose: string
}

type AppState = 'loading' | 'onboarding' | 'ready'

function App() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [userContext, setUserContext] = useState<UserContext | null>(null)

  useEffect(() => {
    axios.get('/api/user-context')
      .then(res => {
        setUserContext(res.data)
        setAppState('ready')
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setAppState('onboarding')
        } else {
          setAppState('ready')
        }
      })
  }, [])

  if (appState === 'loading') return null

  if (appState === 'onboarding') {
    return <Onboarding onComplete={() => {
      axios.get('/api/user-context').then(res => {
        setUserContext(res.data)
        setAppState('ready')
      })
    }} />
  }

  return (
    <BrowserRouter>
      <NavigationBar userContext={userContext!} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/challenge/:id" element={<Challenge />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
