import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import levenshtein from "fast-levenshtein";

export default function Jeoparody() {
    // get game start data
    const location = useLocation();
    const gameData = location.state;

    const [board, setBoard] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    const [playerScore, setPlayerScore] = useState(0);
    const [opponent1Score, setOpponent1Score] = useState(0);
    const [opponent2Score, setOpponent2Score] = useState(0);

    const [answer, setAnswer] = useState("");

    const [round, setRound] = useState(1);

    const [buzzedIn, setBuzzedIn] = useState(false);
    const [answerTimeRemaining, setAnswerTimeRemaining] = useState(8);
    const [questionTimeRemaining, setQuestionTimeRemaining] = useState(5);
    const [questionRead, setQuestionRead] = useState(false);
    const [playerWrong, setPlayerWrong] = useState(false);

    // dollar values for each row, single round
    const values = [200, 400, 600, 800, 1000];

    // load board
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

    const categories = Object.keys(board);


    async function sayTts(text) {
        try {
            const response = await fetch("http://localhost:3001/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text }),
            });

            if (!response.ok) throw new Error("TTS request failed");

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            const audio = new Audio(audioUrl);

            audio.addEventListener("ended", () => {
                setQuestionRead(true);
            });

            audio.playbackRate = 1.25;

            await audio.play();
        } catch (err) {
            console.error("TTS error:", err);
        }
    }

    // handle selecting a question
    async function handleQuestionSelect(question) {
        setSelectedQuestion(question);
        setAnswerTimeRemaining(8);
        setBuzzedIn(false);
        sayTts(question.question);        
    }

    function handleBuzzIn() {
        setBuzzedIn(true);
    }

    useEffect(() => {
        if (!buzzedIn) return;

        const intervalId = setInterval(() => {
            setAnswerTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [buzzedIn]);


    // reset timers and buzzer each time a new question is selected
    useEffect(() => {
        setAnswerTimeRemaining(8);
        setQuestionTimeRemaining(5);
        setBuzzedIn(false);
        setQuestionRead(false);
        setPlayerWrong(false);
    }, [selectedQuestion]);


    useEffect(() => {
        if (!questionRead) return;

        const intervalId = setInterval(() => {
            setQuestionTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [questionRead]);

    function areSimilar(str1, str2, threshold = 0.85) {
        const distance = levenshtein.get(str1.toLowerCase(), str2.toLowerCase());
        const maxLen = Math.max(str1.length, str2.length);
        const similarity = 1 - distance / maxLen;
        return similarity >= threshold;
    }

    return (
        <div className="bg-[#060CE9] min-h-screen flex flex-col items-center justify-center p-4">
            {loading ? (
                <p className="text-white text-2xl font-bold">Loading board...</p>
            ) : (selectedQuestion && !playerWrong) ? (
                <div className="flex flex-col items-center justify-center gap-4 min-h-screen bg-[#060CE9] p-4">
                    <div
                        className="text-white text-center px-6 py-8 rounded-lg"
                        style={{ fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif" }}
                    >
                        <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide text-shadow-lg">
                            {selectedQuestion.question}
                        </p>
                    </div>

                    {(questionRead && !buzzedIn) && (
                        <div className="flex flex-col items-center">
                            <button
                                className="border border-2 border-yellow-400 text-xl font-semibold text-yellow-500 rounded-lg p-2 cursor-pointer hover:bg-yellow-500 hover:text-white"
                                onClick={handleBuzzIn}
                            >
                                Buzzer
                            </button>

                            <p className="mt-2 text-4xl font-semibold text-yellow-500">
                                {questionTimeRemaining}
                            </p>
                        </div>



                    )}

                    {buzzedIn && (
                        <div className="flex flex-col items-center mt-4 w-full max-w-md">
                            <input
                                type="text"
                                value={answer}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setAnswer(val);
                                }}
                                className="w-full p-4 rounded-lg bg-[#0a14e0] text-yellow-300 border border-yellow-400 text-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                placeholder="Enter your answer"
                            />
                            <p className="mt-2 text-4xl font-semibold text-yellow-500">
                                {answerTimeRemaining}
                            </p>
                            <button 
                                className="mt-2 border border-2 border-yellow-400 text-xl font-semibold text-yellow-500 rounded-lg p-2 cursor-pointer hover:bg-yellow-500 hover:text-white"
                                onClick={() => {
                                    areSimilar(selectedQuestion.answer, answer) ? console.log("Correct") : console.log("Wrong");
                                }}
                            >
                                Submit
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-6xl">
                    
                    <div className="flex flex-col items-center mb-4">
                        <h1
                            className="text-yellow-400 uppercase text-center p-1 text-8xl"
                            style={{ fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif", textShadow: "3px 3px 5px black" }}
                        >
                            Jeoparody!
                        </h1>
                        <h2
                            className="text-yellow-400 uppercase text-center p-1 text-2xl"
                            style={{ fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif", textShadow: "3px 3px 5px black" }}
                        >
                            Round {round}
                        </h2>
                    </div>

                    <div className="flex justify-between mb-4">
                        <div className="flex flex-col items-center flex-1 p-1">
                            <div className="flex items-center justify-center w-full h-20 bg-[#060CE9] border-4 border-yellow-400 rounded-t-xl text-white text-2xl font-bold shadow-lg">
                                {opponent1Score}
                            </div>
                            <div className="mt-2 bg-yellow-400 p-2 rounded-b-xl w-full text-center text-[#060CE9] font-semibold uppercase shadow-md">
                                {gameData.opponent1.name}
                            </div>
                        </div>

                        <div className="flex flex-col items-center flex-1 p-1">
                            <div className="flex items-center justify-center w-full h-20 bg-[#060CE9] border-4 border-yellow-400 rounded-t-xl text-white text-2xl font-bold shadow-lg">
                                {opponent2Score}
                            </div>
                            <div className="mt-2 bg-yellow-400 p-2 rounded-b-xl w-full text-center text-[#060CE9] font-semibold uppercase shadow-md">
                                {gameData.opponent2.name}
                            </div>
                        </div>

                        <div className="flex flex-col items-center flex-1 p-1 border border-2 border-white rounded-md">
                            <div className="flex items-center justify-center w-full h-20 bg-[#060CE9] border-4 border-yellow-400 rounded-t-xl text-white text-2xl font-extrabold shadow-lg">
                                {playerScore}
                            </div>
                            <div className="mt-2 bg-yellow-400 p-2 rounded-b-xl w-full text-center text-[#060CE9] font-bold uppercase shadow-md">
                                {gameData.playerName}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-6 gap-1 border-[3px] border-yellow-400">
                        {categories.map((cat, i) => (
                            <div
                                key={`cat-${i}`}
                                className="bg-[#060CE9] text-yellow-300 text-center text-xl font-bold border border-yellow-400 uppercase flex items-center justify-center h-20 tracking-wide"
                                style={{ fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif" }}
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
                                        style={{ fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif", textShadow: "2px 2px 3px black" }}
                                        onClick={() => handleQuestionSelect(question)}
                                    >
                                        ${val}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
