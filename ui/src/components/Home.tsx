import { useEffect, useState } from 'react'
import axios from 'axios'
import './Home.css'

type UserContext = {
  name: string
  current_role: string
  desired_role: string
  purpose: string
}

export default function Home() {
  const [userContext, setUserContext] = useState<UserContext | null>(null)

  useEffect(() => {
    axios.get('/api/user-context').then(res => setUserContext(res.data))
  }, [])

  if (!userContext) return null

  return (
    <main className="home">
      <h1 className="home-heading">Welcome, {userContext.name}</h1>
      <p className="home-subheading">{userContext.purpose}</p>
    </main>
  )
}
