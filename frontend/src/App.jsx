import { useState, useCallback } from 'react'
import { StatusBar } from '@/components/StatusBar/StatusBar'
import { Gamepad } from '@/components/Gamepad/Gamepad'
import { useWebSocket } from '@/hooks/useWebSocket'

function normalizeBatteryVoltage(voltage) {
  if (typeof voltage !== 'number' || Number.isNaN(voltage)) return null
  return Math.round(voltage * 10) / 10
}

function App() {
  const [batteryVoltage, setBatteryVoltage] = useState(null)
  const [commandSpeed, setCommandSpeed] = useState(35)

  const updateBatteryVoltage = useCallback((nextVoltage) => {
    const normalized = normalizeBatteryVoltage(nextVoltage)
    setBatteryVoltage((current) => {
      if (normalized == null) return null
      if (current == null) return normalized
      return Math.abs(normalized - current) >= 0.1 ? normalized : current
    })
  }, [])

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'battery') {
      updateBatteryVoltage(msg.voltage)
      return
    }

    if (msg.type === 'telemetry') {
      updateBatteryVoltage(msg.batteryVoltage ?? null)
      setCommandSpeed(typeof msg.commandSpeed === 'number' ? msg.commandSpeed : 35)
    }
  }, [updateBatteryVoltage])

  const { connected, send } = useWebSocket(handleMessage)

  return (
    <div className="h-full flex flex-col bg-background">
      <StatusBar connected={connected} batteryVoltage={batteryVoltage} />
      <Gamepad send={send} commandSpeed={commandSpeed} />
    </div>
  )
}

export default App
