import { useState, useCallback } from 'react'
import { StatusBar } from '@/components/StatusBar/StatusBar'
import { Gamepad } from '@/components/Gamepad/Gamepad'
import { SplashScreen } from '@/components/SplashScreen/SplashScreen'
import { useWebSocket } from '@/hooks/useWebSocket'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [batteryVoltage, setBatteryVoltage] = useState(null)

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'battery') setBatteryVoltage(msg.voltage)
  }, [])

  const { connected, send } = useWebSocket(handleMessage)

  return (
    <div className="h-full flex flex-col bg-background">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <StatusBar connected={connected} batteryVoltage={batteryVoltage} />
      <Gamepad send={send} />
    </div>
  )
}

export default App
