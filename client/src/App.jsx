import JeopardyNew from './pages/JeopardyNew';
import StartScreen from './pages/StartScreen';
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/game" element={<JeopardyNew />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
