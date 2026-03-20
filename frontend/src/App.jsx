import { useState, useCallback } from 'react'
import { StatusBar } from '@/components/StatusBar/StatusBar'
import { Gamepad } from '@/components/Gamepad/Gamepad'
import { useWebSocket } from '@/hooks/useWebSocket'

function App() {
  const [batteryVoltage, setBatteryVoltage] = useState(null)
  const [encoderSpeeds, setEncoderSpeeds] = useState(null)
  const [commandSpeed, setCommandSpeed] = useState(35)

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'battery') {
      setBatteryVoltage(msg.voltage)
      return
    }

    if (msg.type === 'telemetry') {
      setBatteryVoltage(msg.batteryVoltage ?? null)
      setEncoderSpeeds(Array.isArray(msg.encoderSpeeds) ? msg.encoderSpeeds : null)
      setCommandSpeed(typeof msg.commandSpeed === 'number' ? msg.commandSpeed : 35)
    }
  }, [])

  const { connected, send } = useWebSocket(handleMessage)

  return (
    <div className="h-full flex flex-col bg-background">
      <StatusBar connected={connected} batteryVoltage={batteryVoltage} encoderSpeeds={encoderSpeeds} />
      <Gamepad send={send} commandSpeed={commandSpeed} />
    </div>
  )
}

export default App
