import { StatusBar } from '@/components/StatusBar/StatusBar'
import { Gamepad } from '@/components/Gamepad/Gamepad'
import { useWebSocket } from '@/hooks/useWebSocket'

function App() {
  const { connected, send } = useWebSocket()

  return (
    <div className="h-full flex flex-col bg-background">
      <StatusBar connected={connected} />
      <Gamepad send={send} />
    </div>
  )
}

export default App
