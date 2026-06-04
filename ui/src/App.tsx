import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const api = axios.create({ baseURL: '' })

function App() {
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    api.get('/api')
      .then(res => setMessage(res.data))
      .catch(() => setMessage('Could not connect to server'))
  }, [])

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
