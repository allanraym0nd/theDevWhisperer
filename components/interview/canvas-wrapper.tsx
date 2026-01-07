'use client'

import { useState,useEffect } from "react"
import dynamic from "next/dynamic"

const Excalidraw = dynamic(
    async () => (await import('@excalidraw/excalidraw')).Excalidraw,
    {ssr: false}
)

interface CanvasWrapperProps {
    interviewId: string
    onSave?: (elements: any) => void

}

export default function CanvasWrapper({interviewId, onSave}: CanvasWrapperProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
    const [isClient,setIsClient] = useState(false)

useEffect(() => { 
        setIsClient(true)
        
const interval = setInterval(() => {
    if(excalidrawAPI) {
        const elements = excalidrawAPI.getSceneElements()
        const appState = excalidrawAPI.getAppState()

            if(elements.length > 0 && onSave) {
            onSave({
                elements,
                appState: {
                    viewBackgroundColor:appState.viewBackgroundColor,
                    // currentItemFontFamily:appState.currentItemFontFamily
                }
            })

        }

        }
        },30000)
        return () => clearInterval(interval)
 }, [excalidrawAPI, onSave])

 //load saved canvas data

 useEffect(() => {
    async function loadCanvas() {
        try {
            const response = await fetch(`/api/canvas/${interviewId}`)
            if(response.ok) {
                const data = await response.json()
                if(data.snapshot_data && excalidrawAPI) {
                    excalidrawAPI.updateScene(data.snapshot_data)
                }
            }
            
        } catch(error) { 
             console.log('No saved canvas found')
        }
        
    }

    if(excalidrawAPI){
        loadCanvas()
    }

 }, [excalidrawAPI, interviewId])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card border border-border rounded-lg">
        <p className="text-muted-foreground">Loading canvas...</p>
      </div>
    )
  }

return (
  <div style={{ width: '100%', height: '400px', position: 'relative' }}>
    <Excalidraw
      excalidrawAPI={(api) => setExcalidrawAPI(api)}
      theme="light"
      initialData={{
        elements: [],
        appState: {
          viewBackgroundColor: "#ffffff",
          currentItemStrokeColor: "#000000",
          currentItemBackgroundColor: "transparent",
          currentItemFillStyle: "solid",
          currentItemStrokeWidth: 2,
          currentItemRoughness: 0,
          currentItemOpacity: 100,
          zenModeEnabled: false,
        }
      }}
      UIOptions={{
        canvasActions: {
          loadScene: false,
          export: false,
          saveAsImage: true,
        },
        tools: {
          image: false
        }
      }}
    />
  </div>
)
 
    

}