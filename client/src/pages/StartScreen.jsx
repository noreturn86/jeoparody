const API_URL = import.meta.env.VITE_API_URL;

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import avatar1 from "../../public/avatars/avatar1.png";
import avatar2 from "../../public/avatars/avatar2.png";
import avatar3 from "../../public/avatars/avatar3.png";
import avatar4 from "../../public/avatars/avatar4.png";
import avatar5 from "../../public/avatars/avatar5.png";
import avatar6 from "../../public/avatars/avatar6.png";
import avatar7 from "../../public/avatars/avatar7.png";
import avatar8 from "../../public/avatars/avatar8.png";
import avatar9 from "../../public/avatars/avatar9.png";
import avatar10 from "../../public/avatars/avatar10.png";

import thinkingTheme from "../../public/sounds/thinking.mp3";
import menuMoveSound from "../../public/sounds/menuMove.mp3";
import crowdCheering from "../../public/sounds/cheering.wav";

const thinking = new Audio(thinkingTheme);
thinking.volume = 0.4;
const menuMove = new Audio(menuMoveSound);
const cheering = new Audio(crowdCheering);


const avatars = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
  avatar9,
  avatar10,
];

export default function GameSetup() {
  const [codeEntered, setCodeEntered] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const code = '12345';
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState("");
  const [opponent1Name, setOpponent1Name] = useState("");
  const [opponent1Difficulty, setOpponent1Difficulty] = useState(5);
  const [opponent2Name, setOpponent2Name] = useState("");
  const [opponent2Difficulty, setOpponent2Difficulty] = useState(5);

  const [playerAvatar, setPlayerAvatar] = useState(avatars[0]);
  const [opponent1Avatar, setOpponent1Avatar] = useState(avatars[1]);
  const [opponent2Avatar, setOpponent2Avatar] = useState(avatars[2]);

  const colors = [
    ["#FF4500", "#000080", "#FFD700"],
    ["#00BFFF", "#FF69B4", "#FFFFFF"],
    ["#32CD32", "#008000", "#FFFF00"],
    ["#800080", "#FF1493", "#00FFFF"],
    ["#FF6347", "#1E90FF", "#32CD32"],
    ["#8A2BE2", "#FF8C00", "#FFFFE0"],
  ];

  const [colorScheme, setColorScheme] = useState(colors[0]);

  const voices = [
    { name: "alloy", label: "Alloy" },
    { name: "verse", label: "Verse" },
    { name: "echo", label: "Echo" },
    { name: "nova", label: "Nova" },
    { name: "ash", label: "Ash" },
  ];

  const [selectedVoice, setSelectedVoice] = useState(voices[0].name);

  const getTextColor = (bgColor) => {
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150 ? "#000000" : "#FFFFFF";
  };

  const textColor = getTextColor(colorScheme[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const gameData = {
      player: { name: playerName, avatar: playerAvatar },
      opponent1: {
        name: opponent1Name,
        difficulty: opponent1Difficulty,
        avatar: opponent1Avatar,
      },
      opponent2: {
        name: opponent2Name,
        difficulty: opponent2Difficulty,
        avatar: opponent2Avatar,
      },
      colorScheme,
      selectedVoice,
    };
    thinking.pause();
    cheering.volume = 0.25;
    cheering.play();
    setTimeout(() => {
      navigate("/game", { state: gameData });
    }, 2000);
  };

  const AvatarRow = ({ selectedAvatar, setAvatar }) => (
    <div className="flex flex-nowrap justify-start gap-3 mb-4 overflow-x-auto py-1">
      {avatars.map((avatar, index) => (
        <img
          key={index}
          src={avatar}
          alt={`Avatar ${index + 1}`}
          onClick={() => {
            setAvatar(avatar);
            menuMove.play();
          }}
          className={`w-14 h-14 rounded-full cursor-pointer border-4 transition-transform hover:scale-110 ${selectedAvatar === avatar
            ? "border-yellow-400 scale-110"
            : "border-transparent"
            }`}
          style={{
            flexShrink: 0,
            boxShadow:
              selectedAvatar === avatar
                ? "0 0 10px rgba(255,255,0,0.6)"
                : "0 0 4px rgba(0,0,0,0.3)",
          }}
        />
      ))}
    </div>
  );

  function checkCode() {
    if (enteredCode === code) {
      thinking.loop = true;
      thinking.play();
      setTimeout(() => { setCodeEntered(true) }, 2000);
    }
  }

  async function playVoiceSample(voiceName) {
    try {
      const contextDescription = 
      "You are giving a short sample of your voice for consideration as host of a trivia game show. Give a short remark asking if your voice will work or possibily encouraging them to select your voice";

      const response = await fetch(`${API_URL}/api/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contextDescription, voice: voiceName })
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      // Get the AI-generated comment text
      const commentText = decodeURIComponent(response.headers.get("X-Comment-Text") || "");

      // Convert audio data to blob and play
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      audio.play();

      console.log(`Voice: ${voiceName}`);
      console.log(`Line: ${commentText}`);

      // Clean up after playback
      audio.onended = () => URL.revokeObjectURL(audioUrl);

    } catch (err) {
      console.error("Error playing voice sample:", err);
    }
  }





  return (

    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: colorScheme[0],
        color: textColor,
      }}
    >
      {codeEntered ? (
        <div
          className="flex flex-col border-4 rounded-2xl shadow-xl p-10 w-full max-w-3xl"
          style={{
            borderColor: colorScheme[1],
            backgroundColor:
              getTextColor(colorScheme[0]) === "#FFFFFF"
                ? "#00000020"
                : "#FFFFFF20",
          }}
        >
          <h2
            className="text-4xl font-extrabold text-center mb-6 uppercase"
            style={{
              fontFamily:
                "'Architects Daughter', 'Anton', 'Arial Black', sans-serif",
              textShadow: "2px 2px 4px rgba(0,0,0,0.6)",
            }}
          >
            Game Setup
          </h2>

          {/* Palette Buttons */}
          <div className="w-full flex items-center justify-evenly mb-4 flex-wrap">
            {colors.map((scheme, index) => (
              <button
                key={index}
                onClick={() => setColorScheme(scheme)}
                className={`w-10 h-10 rounded-full border-2 cursor-pointer hover:scale-110 ${colorScheme === scheme
                  ? "border-white scale-110"
                  : "border-gray-400"
                  } transition-transform shadow-md`}
                style={{
                  background: `linear-gradient(to bottom, ${scheme[0]} 50%, ${scheme[1]} 85%, ${scheme[2]} 100%)`,
                }}
              ></button>
            ))}
          </div>

          {/* TTS Voice Buttons */}
          <div className="w-full flex items-center justify-evenly mb-6 flex-wrap gap-2">
            {voices.map((voice) => (
              <button
                key={voice.name}
                onClick={() => {
                  setSelectedVoice(voice.name);
                  playVoiceSample(voice.name);
                }}
                className={`px-3 py-2 rounded-lg font-bold text-sm uppercase border-2 shadow-md transition-transform cursor-pointer hover:scale-110 ${selectedVoice === voice.name
                  ? "scale-110 border-white"
                  : "border-gray-400"
                  }`}
                style={{
                  backgroundColor:
                    voice.name === "openai" ? "#FF4500" : colorScheme[1],
                  color:
                    voice.name === "openai"
                      ? "#FFFFFF"
                      : getTextColor(colorScheme[1]),
                }}
              >
                {voice.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
            {/* Player */}
            <div>
              <label className="block text-xl mb-1 font-bold">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#000000",
                  borderColor: colorScheme[1],
                }}
                placeholder="Enter your name"
              />
              <AvatarRow
                selectedAvatar={playerAvatar}
                setAvatar={setPlayerAvatar}
              />
            </div>

            <hr
              className="my-4 border-t-2 opacity-60"
              style={{ borderColor: colorScheme[1] }}
            />

            {/* Opponent 1 */}
            <div>
              <label className="block text-xl mb-1 font-bold">
                Opponent 1 Name
              </label>
              <input
                type="text"
                value={opponent1Name}
                onChange={(e) => setOpponent1Name(e.target.value)}
                className="w-full p-2 rounded-lg border"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#000000",
                  borderColor: colorScheme[1],
                }}
                placeholder="Enter opponent name"
              />
              <AvatarRow
                selectedAvatar={opponent1Avatar}
                setAvatar={setOpponent1Avatar}
              />
            </div>
            <div>
              <label className="block text-xl mb-1 font-bold">
                Opponent 1 Difficulty ({opponent1Difficulty})
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={opponent1Difficulty}
                onChange={(e) => setOpponent1Difficulty(e.target.value)}
                className="w-full accent-current"
                style={{ color: colorScheme[1] }}
              />
            </div>

            <hr
              className="my-4 border-t-2 opacity-60"
              style={{ borderColor: colorScheme[1] }}
            />

            {/* Opponent 2 */}
            <div>
              <label className="block text-xl mb-1 font-bold">
                Opponent 2 Name
              </label>
              <input
                type="text"
                value={opponent2Name}
                onChange={(e) => setOpponent2Name(e.target.value)}
                className="w-full p-2 rounded-lg border"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#000000",
                  borderColor: colorScheme[1],
                }}
                placeholder="Enter opponent name"
              />
              <AvatarRow
                selectedAvatar={opponent2Avatar}
                setAvatar={setOpponent2Avatar}
              />
            </div>
            <div>
              <label className="block text-xl mb-1 font-bold">
                Opponent 2 Difficulty ({opponent2Difficulty})
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={opponent2Difficulty}
                onChange={(e) => setOpponent2Difficulty(e.target.value)}
                className="w-full accent-current"
                style={{ color: colorScheme[1] }}
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full py-3 font-extrabold uppercase rounded-lg text-2xl tracking-wider shadow-lg hover:brightness-110 transition"
              style={{
                backgroundColor: colorScheme[1],
                color: getTextColor(colorScheme[1]),
                fontFamily:
                  "'Architects Daughter', 'Anton', 'Arial Black', sans-serif",
              }}
            >
              Start
            </button>
          </form>
        </div>
      ) : (

        <div
          className="flex flex-col border-4 rounded-2xl shadow-xl p-10 w-full max-w-3xl gap-2"
          style={{
            borderColor: colorScheme[1],
            backgroundColor:
              getTextColor(colorScheme[0]) === "#FFFFFF"
                ? "#00000020"
                : "#FFFFFF20",
          }}
        >
          <h1
            className="uppercase text-center p-1 text-6xl"
            style={{
              fontFamily: "'Architects Daughter', 'Anton', 'Arial Black', sans-serif",
              textShadow: "3px 3px 5px black",
              color: colors[1]
            }}
          >
            Jeoparody!
          </h1>

          <input
            type="text"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value)}
            className="w-full p-2 rounded-lg border"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#000000",
              borderColor: colorScheme[1],
            }}
            placeholder="Enter code"
          />
          <button
            type="submit"
            className="mt-4 w-full py-3 font-extrabold uppercase rounded-lg text-2xl tracking-wider shadow-lg hover:brightness-110 transition"
            style={{
              backgroundColor: colorScheme[1],
              color: getTextColor(colorScheme[1]),
              fontFamily:
                "'Architects Daughter', 'Anton', 'Arial Black', sans-serif",
            }}
            onClick={checkCode}
          >
            Start
          </button>
          <h1
            className="uppercase text-center p-2 text-2xl"
            style={{
              fontFamily: "'Architects Daughter', 'Anton', 'Arial Black', sans-serif",
              textShadow: "3px 3px 5px black",
              color: colors[1]
            }}
          >
            Turn on sound
          </h1>
        </div>
      )}
    </div>
  );
}
