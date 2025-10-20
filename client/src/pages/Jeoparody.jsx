import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import levenshtein from 'fast-levenshtein';

export default function Jeoparody() {
    //get game start data
    const location = useLocation();
    const gameData = location.state;

    const [board, setBoard] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    const [playerScore, setPlayerScore] = useState(0);
    const [opponent1Score, setOpponent1Score] = useState(0);
    const [opponent2Score, setOpponent2Score] = useState(0);

    const [answer, setAnswer] = useState('');

    const [round, setRound] = useState(1);
    const [buzzedIn, setBuzzedIn] = useState(false);

    const [answerTimeRemaining, setAnswerTimeRemaining] = useState(8);

    //dollar values for each row, single round
    const values = [200, 400, 600, 800, 1000];

    useEffect(() => {
        async function fetchBoard() {
            try {
                const res = await fetch("http://localhost:3001/api/board");
                const data = await res.json();
                setBoard(data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        }

        fetchBoard();
    }, []);

    if (loading) return <p className="text-white">Loading board...</p>;

    const categories = Object.keys(board);

    async function handleQuestionSelect(question) {
        setSelectedQuestion(question);

        try {
            const response = await fetch("http://localhost:3001/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: question.question })
            });

            if (!response.ok) throw new Error("TTS request failed");

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            const audio = new Audio(audioUrl);
            await audio.play();
        } catch (err) {
            console.error("TTS error:", err);
        }
    }

    function handleBuzzIn() {
        setBuzzedIn(true);
    }


    function areSimilar(str1, str2, threshold = 0.85) {
        const distance = levenshtein.get(str1.toLowerCase(), str2.toLowerCase());
        const maxLen = Math.max(str1.length, str2.length);
        const similarity = 1 - distance / maxLen;
        return similarity >= threshold;
    }


    return (
        <div className="bg-[#060CE9] min-h-screen flex flex-col items-center justify-center p-4">

            {selectedQuestion ?

                <div className="flex flex-col items-center justify-center gap-4 min-h-screen bg-[#060CE9] p-4">
                    <div
                        className="text-white text-center px-6 py-8 rounded-lg"
                        style={{
                            fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                        }}
                    >
                        <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide text-shadow-lg">
                            {selectedQuestion.question}
                        </p>
                    </div>
                    <button
                        className="border border-2 border-yellow-400 text-xl font-semibold text-yellow-500 rounded-lg p-2 cursor-pointer hover:bg-yellow-500 hover:text-white"
                        onClick={() => handleBuzzIn()}
                    >
                        Buzzer
                    </button>

                    {buzzedIn &&
                        <div className="flex flex-col items-center">
                            <input
                                type="text"
                                value={answer}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setAnswer(val);

                                    if (areSimilar(selectedQuestion.answer, val)) {
                                        console.log("Correct!");
                                    }
                                }}
                                className="w-full p-4 rounded-lg bg-[#0a14e0] text-yellow-300 border border-yellow-400 text-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                placeholder="Enter your answer"
                            />
                            <p className="mt-2 text-4xl font-semibold text-yellow-500">{answerTimeRemaining}</p>
                        </div>
                    }

                </div>

                :

                <div>
                    <div className="flex justify-between">
                        <div
                            className="flex flex-4 justify-between text-2xl p-2"
                            style={{
                                fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                textShadow: "3px 3px 5px black",
                            }}
                        >
                            <div className="flex flex-col flex-1 items-center p-1">
                                <div className="flex items-center justify-center w-full h-2/3 bg-[#060CE9] border-4 border-yellow-400 rounded-t-xl text-white text-2xl font-bold shadow-lg">
                                    {opponent1Score}
                                </div>
                                <div className="mt-2 bg-yellow-400 p-2 rounded-b-xl flex items-center justify-center w-full h-1/3 text-[#060CE9] font-semibold uppercase shadow-md">
                                    {gameData.opponent1.name}
                                </div>
                            </div>

                            <div className="flex flex-col flex-1 items-center p-1">
                                <div className="flex items-center justify-center w-full h-2/3 bg-[#060CE9] border-4 border-yellow-400 rounded-t-xl text-white text-2xl font-bold shadow-lg">
                                    {opponent2Score}
                                </div>
                                <div className="mt-2 bg-yellow-400 p-2 rounded-b-xl flex items-center justify-center w-full h-1/3 text-[#060CE9] font-semibold uppercase shadow-md">
                                    {gameData.opponent2.name}
                                </div>
                            </div>

                            <div className="flex flex-col flex-1 items-center p-1 border border-2 border-white rounded-md">
                                <div className="flex items-center justify-center w-full h-2/3 bg-[#060CE9] border-4 border-yellow-400 rounded-t-xl text-white text-2xl font-extrabold shadow-lg">
                                    {playerScore}
                                </div>
                                <div className="mt-2 bg-yellow-400 p-2 rounded-b-xl flex items-center justify-center w-full h-1/3 text-[#060CE9] font-bold uppercase shadow-md">
                                    {gameData.playerName}
                                </div>
                            </div>

                        </div>

                        <div className="flex flex-col items-center flex-1">
                            <h1
                                className="text-yellow-400 uppercase text-center p-2"
                                style={{
                                    fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                    fontSize: "4rem",
                                    textShadow: "3px 3px 5px black",
                                }}
                            >
                                Jeoparody!
                            </h1>

                            <h1
                                className="text-yellow-400 uppercase text-centermb-2 p-2"
                                style={{
                                    fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                    fontSize: "2rem",
                                    textShadow: "3px 3px 5px black",
                                }}
                            >
                                Round {round}
                            </h1>
                        </div>

                    </div>

                    <div className="grid grid-cols-6 gap-1 w-full max-w-6xl border-[3px] border-yellow-400">
                        {categories.map((cat, i) => (
                            <div
                                key={`cat-${i}`}
                                className="bg-[#060CE9] text-yellow-300 text-center text-xl font-bold border border-yellow-400 uppercase flex items-center justify-center h-20 tracking-wide"
                                style={{
                                    fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                }}
                            >
                                {cat || "CATEGORY"}
                            </div>
                        ))}

                        {values.map((val, rowIndex) =>
                            categories.map((cat, colIndex) => {
                                const question = board[cat][rowIndex];
                                return (
                                    <div
                                        key={`cell-${colIndex}-${rowIndex}`}
                                        className="bg-[#060CE9] text-yellow-300 text-center text-3xl font-extrabold border border-yellow-400 flex items-center justify-center h-24 cursor-pointer hover:bg-[#0a14e0]"
                                        style={{
                                            fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                            textShadow: "2px 2px 3px black",
                                        }}
                                        onClick={() => handleQuestionSelect(question)}
                                    >
                                        ${val}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            }
        </div>
    );
}
