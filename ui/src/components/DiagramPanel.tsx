import { useState } from 'react'
import { Excalidraw, serializeAsJSON } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

type Props = {
  onReady: (getJSON: () => string) => void
}

export default function DiagramPanel({ onReady }: Props) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null)

  function handleGenerate() {
    if (!excalidrawAPI) return
    const elements = excalidrawAPI.getSceneElements()
    const appState = excalidrawAPI.getAppState()
    const files = excalidrawAPI.getFiles()
    console.log(serializeAsJSON(elements, appState, files, 'local'))
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end px-3 py-2 border-b border-black flex-shrink-0">
        <button
          onClick={handleGenerate}
          className="font-[inherit] text-[0.85rem] font-semibold bg-black text-white border-none py-1.5 px-4 rounded cursor-pointer hover:bg-[#222]"
        >
          Generate
        </button>
      </div>
      <div className="flex-1 relative min-h-0">
        <Excalidraw
          excalidrawAPI={(api) => {
            setExcalidrawAPI(api)
            onReady(() => serializeAsJSON(
              api.getSceneElements(),
              api.getAppState(),
              api.getFiles(),
              'local'
            ))
          }}
        />
      </div>
    </div>
  )
}
