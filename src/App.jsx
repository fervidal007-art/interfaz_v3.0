import { StatusBar } from '@/components/StatusBar/StatusBar'
import { Gamepad } from '@/components/Gamepad/Gamepad'

function App() {
  return (
    <div className="h-full flex flex-col bg-background">
      <StatusBar />
      <Gamepad />
    </div>
  )
}

export default App
