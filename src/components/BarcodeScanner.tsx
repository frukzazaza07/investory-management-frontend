import { useState, useRef, useEffect, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, CameraOff } from 'lucide-react'

type Props = {
  onScan: (barcode: string) => void
}

export function BarcodeScanner({ onScan }: Props) {
  const [manual, setManual] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
  }, [])

  useEffect(() => {
    if (!cameraActive || !videoRef.current) return
    const reader = new BrowserMultiFormatReader()
    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) {
          onScan(result.getText())
          setCameraActive(false)
        }
      })
      .then((controls) => {
        controlsRef.current = controls
      })
      .catch(() => setCameraActive(false))
    return () => stopCamera()
  }, [cameraActive, onScan, stopCamera])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = manual.trim()
    if (value) {
      onScan(value)
      setManual('')
    }
  }

  const toggleCamera = () => {
    if (cameraActive) stopCamera()
    setCameraActive((v) => !v)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          autoFocus
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Scan or type barcode…"
        />
        <Button type="submit" size="sm">
          Look up
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={toggleCamera}>
          {cameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        </Button>
      </form>
      {cameraActive && (
        <video
          ref={videoRef}
          className="w-full max-w-sm rounded-lg border border-gray-300"
        />
      )}
    </div>
  )
}
