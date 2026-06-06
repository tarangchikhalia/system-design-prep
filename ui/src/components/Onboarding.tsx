import { useState } from 'react'
import _Editor from 'react-simple-code-editor'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Editor = (_Editor as any).default ?? _Editor
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism.css'
import axios from 'axios'

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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-3/5 flex flex-col items-center gap-6">
        <h1 className="text-[2rem] font-bold text-black m-0">Welcome</h1>
        <p className="text-base text-[#333] m-0">
          Tell us a bit about yourself to get started.
        </p>

        <div className="editor-wrapper w-full border-2 border-black rounded bg-white min-h-[220px]">
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={(val: string) => highlight(val, languages.json, 'json')}
            padding={20}
            className="!text-[1.1rem] !text-black !bg-white min-h-[220px]"
            textareaClassName="outline-none !text-[1.1rem]"
          />
        </div>

        {error && <p className="text-[0.9rem] text-[#c00] m-0">{error}</p>}

        <button
          className="text-base font-semibold bg-black text-white border-none py-3 px-10 rounded cursor-pointer tracking-widest disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-[#222]"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </div>
  )
}
