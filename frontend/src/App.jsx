import { useState } from 'react'
import { StatusBar } from '@/components/StatusBar/StatusBar'
import { Gamepad } from '@/components/Gamepad/Gamepad'
import { useWebSocket } from '@/hooks/useWebSocket'

const SPEED_LEVELS = [20, 35, 50]
const SPEED_LABELS = ['Lento', 'Normal', 'Rápido']

function App() {
  const { connected, send } = useWebSocket()
  const [speedIndex, setSpeedIndex] = useState(1)

  const handleSpeedToggle = () => {
    const next = (speedIndex + 1) % SPEED_LEVELS.length
    setSpeedIndex(next)
    send({ type: 'speed', value: SPEED_LEVELS[next] })
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <StatusBar connected={connected} speedLabel={SPEED_LABELS[speedIndex]} onSpeedToggle={handleSpeedToggle} />
      <Gamepad send={send} />
    </div>
  )
}

export default App
