import { useState, useCallback } from 'react'
import { StatusBar } from '@/components/StatusBar/StatusBar'
import { Gamepad } from '@/components/Gamepad/Gamepad'
import { useWebSocket } from '@/hooks/useWebSocket'

function App() {
  const [batteryVoltage, setBatteryVoltage] = useState(null)

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'battery') setBatteryVoltage(msg.voltage)
  }, [])

  const { connected, send } = useWebSocket(handleMessage)

  return (
    <div className="h-full flex flex-col bg-background">
      <StatusBar connected={connected} batteryVoltage={batteryVoltage} />
      <Gamepad send={send} />
    </div>
  )
}

export default App
