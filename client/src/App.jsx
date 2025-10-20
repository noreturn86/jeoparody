import Jeoparody from './pages/Jeoparody'
import StartScreen from './pages/StartScreen'
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/game" element={<Jeoparody />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
