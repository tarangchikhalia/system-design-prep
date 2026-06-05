import { useState } from 'react'
import _Editor from 'react-simple-code-editor'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Editor = (_Editor as any).default ?? _Editor
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism.css'
import axios from 'axios'
import './Onboarding.css'

const TEMPLATE = JSON.stringify(
  { name: '', current_role: '', desired_role: '', purpose: '' },
  null,
  4
)

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [code, setCode] = useState(TEMPLATE)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    let parsed: unknown
    try {
      parsed = JSON.parse(code)
    } catch {
      setError('Invalid JSON — please check the syntax and try again.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await axios.post('/api/user-context', parsed)
      onComplete()
    } catch {
      setError('Failed to save — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <h1 className="onboarding-title">Welcome</h1>
        <p className="onboarding-subtitle">
          Tell us a bit about yourself to get started.
        </p>

        <div className="editor-wrapper">
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={val => highlight(val, languages.json, 'json')}
            padding={20}
            className="code-editor"
            textareaClassName="code-textarea"
          />
        </div>

        {error && <p className="onboarding-error">{error}</p>}

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </div>
  )
}
