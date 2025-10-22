import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GameSetup() {
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState("");
  const [opponent1Name, setOpponent1Name] = useState("");
  const [opponent1Difficulty, setOpponent1Difficulty] = useState(5);
  const [opponent2Name, setOpponent2Name] = useState("");
  const [opponent2Difficulty, setOpponent2Difficulty] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();

    const gameData = {
      playerName,
      opponent1: {
        name: opponent1Name,
        difficulty: opponent1Difficulty,
      },
      opponent2: {
        name: opponent2Name,
        difficulty: opponent2Difficulty,
      },
    };

    navigate("/game", { state: gameData });
  };

  return (
    <div className="border bg-[#060CE9] min-h-screen flex flex-col items-center justify-center">
      <div className="bg-[#060CE9] border-4 border-yellow-400 rounded-2xl shadow-xl p-8 w-full max-w-md text-yellow-300">
        <h2
          className="text-3xl font-extrabold text-center mb-6 uppercase"
          style={{
            fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
            textShadow: "2px 2px 4px black",
          }}
        >
          Game Setup
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
          <div>
            <label className="block text-lg mb-1 font-bold">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#0a14e0] text-yellow-300 border border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-lg mb-1 font-bold">Opponent 1 Name</label>
            <input
              type="text"
              value={opponent1Name}
              onChange={(e) => setOpponent1Name(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#0a14e0] text-yellow-300 border border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter opponent name"
            />
          </div>
          <div>
            <label className="block text-lg mb-1 font-bold">
              Opponent 1 Difficulty ({opponent1Difficulty})
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={opponent1Difficulty}
              onChange={(e) => setOpponent1Difficulty(e.target.value)}
              className="w-full accent-yellow-400"
            />
          </div>

          <div>
            <label className="block text-lg mb-1 font-bold">Opponent 2 Name</label>
            <input
              type="text"
              value={opponent2Name}
              onChange={(e) => setOpponent2Name(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#0a14e0] text-yellow-300 border border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter opponent name"
            />
          </div>
          <div>
            <label className="block text-lg mb-1 font-bold">
              Opponent 2 Difficulty ({opponent2Difficulty})
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={opponent2Difficulty}
              onChange={(e) => setOpponent2Difficulty(e.target.value)}
              className="w-full accent-yellow-400"
            />
          </div>
          <button
            type="submit"
            className="mt-4 w-full py-3 bg-yellow-400 text-[#060CE9] font-extrabold uppercase rounded-lg text-lg tracking-wider shadow-lg hover:bg-yellow-300 transition"
            style={{
              fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
            }}
          >
            Start Game
          </button>
        </form>
      </div>
    </div>
  );
}
