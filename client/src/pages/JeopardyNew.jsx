import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import levenshtein from "fast-levenshtein";
import buzzSound from "../assets/sounds/BuzzIn.wav";
import correctSound from "../assets/sounds/correct.mp3";
import incorrectSound from "../assets/sounds/incorrect.wav";
import menuMoveSound from "../assets/sounds/menuMove.mp3";
import questionSelectSound from "../assets/sounds/selectQuestion.wav";
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import avatar5 from "../assets/avatars/avatar5.png";
import avatar6 from "../assets/avatars/avatar6.png";
import avatar7 from "../assets/avatars/avatar7.png";
import avatar8 from "../assets/avatars/avatar8.png";
import avatar9 from "../assets/avatars/avatar9.png";
import avatar10 from "../assets/avatars/avatar10.png";

const incorrect = new Audio(incorrectSound);
const correct = new Audio(correctSound);
const buzzIn = new Audio(buzzSound);
const menuMove = new Audio(menuMoveSound);
const questionSelect = new Audio(questionSelectSound);



export default function JeopardyNew() {
    const opponentSelectTimeoutRef = useRef(null);

    const [boardLoading, setBoardLoading] = useState(false);
    const [boardLoaded, setBoardLoaded] = useState(false);
    const [board, setBoard] = useState({});
    const [boardClickable, setBoardClickable] = useState(false);

    const [round, setRound] = useState(1);

    const location = useLocation();
    const gameData = location.state;

    const [player, setPlayer] = useState({
        name: gameData.playerName,
        isBot: false,
        score: 0,
    });

    const [opponent1, setOpponent1] = useState({
        name: gameData.opponent1.name,
        isBot: true,
        difficulty: gameData.opponent1.difficulty,
        score: 0,
    });

    const [opponent2, setOpponent2] = useState({
        name: gameData.opponent2.name,
        isBot: true,
        difficulty: gameData.opponent2.difficulty,
        score: 0,
    });

    const [controllingPlayer, setControllingPlayer] = useState(opponent1);

    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [answerShown, setAnswerShown] = useState(false);
    const [questionReady, setQuestionReady] = useState(false);

    const [buzzedIn, setBuzzedIn] = useState(false);
    const [opponent1BuzzedIn, setOpponent1BuzzedIn] = useState(false);
    const [opponent2BuzzedIn, setOpponent2BuzzedIn] = useState(false);

    const [playerWrong, setPlayerWrong] = useState(false);
    const [opponent1Wrong, setOpponent1Wrong] = useState(false);
    const [opponent2Wrong, setOpponent2Wrong] = useState(false);

    const [questionTimeRemaining, setQuestionTimeRemaining] = useState(5);
    const [answerTimeRemaining, setAnswerTimeRemaining] = useState(10);

    const [playerScore, setPlayerScore] = useState(0);
    const [opponent1Score, setOpponent1Score] = useState(0);
    const [opponent2Score, setOpponent2Score] = useState(0);
    const values = round === 1 ? [200, 400, 600, 800, 1000] : round === 2 ? [400, 800, 1200, 1600, 2000] : [];

    const boardLoadedRef = useRef(false);

    useEffect(() => {
        if (boardLoadedRef.current) return; //prevent double load in dev
        boardLoadedRef.current = true;

        async function loadBoard() {
            setBoardLoading(true);
            try {
                const res = await fetch("http://localhost:3001/api/board");
                if (!res.ok) throw new Error(`Server error: ${res.status}`);
                const data = await res.json();

                const initialized = {};
                Object.keys(data).forEach(cat => {
                    initialized[cat] = data[cat].map(q => ({
                        ...q,
                        wasAsked: false,
                        selected: false,
                    }));
                });
                setBoard(initialized);
            } catch (err) {
                console.error("Failed to load board:", err);
            } finally {
                setBoardLoading(false);
                setBoardLoaded(true);
            }
        }

        loadBoard();
    }, []);





    useEffect(() => {
        if (!selectedQuestion && boardLoaded) {
            if (controllingPlayer.isBot) {
                setBoardClickable(false);
                const timeoutId = setTimeout(() => {
                    opponentQuestionSelect();
                    clearTimeout(timeoutId);
                }, 2000);
            } else {
                setBoardClickable(true);
            }
        }
    }, [selectedQuestion, boardLoaded]);


    useEffect(() => {

    }, [boardLoaded]);



    useEffect(() => {
        if (!questionReady) return;

        if (!playerWrong || !opponent1Wrong || !opponent2Wrong) {
            if (!playerWrong) {
                //activate buzzer
                //if player buzzes in (setQuestionReady = false), start answer timer
                //if correct, setSelectedQuestion to null, controllingPlayer = player
                //else if incorrect or out of time
                //reset question timer and answer time
                //opportunity for !wrong players to buzz in (setQuestionReady = true)
            }

            if (!opponent1Wrong || !opponent2Wrong) {
                //start opponent repsonse method
                //if opponent buzzes in (setQuestionReady = false) and correct, setSelectedQuestion = null, controlling player = opponent => opponent setSelectedQuestion
                //if opponent buzzes in (setQuestionReady = false) and incorrect, setOpponentWrong
                //reset question timer
                //opportunity for others to answer, if !wrong (setQuestion ready = true)
            }
        } else {
            //everybody has tried and guessed wrong
            //controlling player unchanged => setSelectedQuestion
        }
    }, [questionReady]);



    function opponentQuestionSelect() {
        // build flat list of { category, index, question } for every unasked question
        const available = [];
        const cats = Object.keys(board);

        console.log("board: ", board);
        console.log("cats: ", cats);

        cats.forEach((cat) => {
            const list = board[cat] || [];
            list.forEach((q, idx) => {
                if (!q.wasAsked) {
                    available.push({ category: cat, index: idx, question: q });
                }
            });
        });

        if (available.length === 0) {
            console.warn("Opponent selection failed — no available questions.");
            return;
        }

        // pick random slot
        const pick = available[Math.floor(Math.random() * available.length)];
        const { category, index } = pick;

        // mark selected true in state immutably
        setBoard(prev => {
            const next = { ...prev };
            next[category] = next[category].map((q, i) => i === index ? { ...q, selected: true } : q);
            return next;
        });

        // schedule the actual selection after 2.5s
        if (opponentSelectTimeoutRef.current) clearTimeout(opponentSelectTimeoutRef.current);
        opponentSelectTimeoutRef.current = setTimeout(() => {
            // mark wasAsked true and selected false (or keep selected false if you prefer)
            setBoard(prev => {
                const next = { ...prev };
                next[category] = next[category].map((q, i) => {
                    if (i === index) return { ...q, wasAsked: true, selected: false };
                    return q;
                });
                return next;
            });

            // setSelectedQuestion with a clone so downstream effects see a new object
            const selected = { ...board[category][index], category, value: values[index] };
            setSelectedQuestion(selected);

            opponentSelectTimeoutRef.current = null;
        }, 2500);
    }


    function handlePlayerQuestionSelect(category, rowIndex) {
        // mark selected in state (highlight immediately)
        setBoard(prev => {
            const next = { ...prev };
            next[category] = next[category].map((q, i) => i === rowIndex ? { ...q, selected: true } : q);
            return next;
        });

        // schedule selection after 2s (clear previous timeout if any)
        if (opponentSelectTimeoutRef.current) {
            clearTimeout(opponentSelectTimeoutRef.current);
            opponentSelectTimeoutRef.current = null;
        }
        opponentSelectTimeoutRef.current = setTimeout(() => {
            setBoard(prev => {
                const next = { ...prev };
                next[category] = next[category].map((q, i) => i === rowIndex ? { ...q, wasAsked: true, selected: false } : q);
                return next;
            });

            // create selectedQuestion object (include category and value)
            const selected = { ...board[category][rowIndex], category, value: values[rowIndex] };
            setSelectedQuestion(selected);

            opponentSelectTimeoutRef.current = null;
        }, 2000);
    }


    async function readQuestion(question) {
        await sayTts(question.question);
        setQuestionReady(true);
    }

    async function sayTts(text) {
        try {
            console.log("Saying TTS:", text);
            const response = await fetch("http://localhost:3001/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) throw new Error("TTS request failed");

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.playbackRate = 1.25;

            await audio.play();

            // Wait until playback finishes
            await new Promise(resolve => {
                audio.addEventListener("ended", resolve, { once: true });
            });

            return audio;
        } catch (err) {
            console.error("TTS error:", err);
            return null;
        }
    }


    return (
        <div className="bg-[#060CE9] min-h-screen flex flex-col items-center justify-center p-4">
            {(boardLoading || !Object.keys(board).length) ? (
                <p className="text-white text-2xl font-bold">Loading board...</p>
            ) : selectedQuestion ? (
                <div className="flex flex-col items-center justify-center gap-4 min-h-screen bg-[#060CE9] p-4">
                    <div
                        className="text-white text-center px-6 py-8 rounded-lg"
                        style={{ fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif" }}
                    >
                        <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide text-shadow-lg">
                            {selectedQuestion.question}
                        </p>
                    </div>

                    {questionReady && (
                        <div className="flex flex-col items-center">
                            <button
                                className="border border-2 border-yellow-400 text-xl font-semibold text-yellow-500 rounded-lg p-2 cursor-pointer hover:bg-yellow-500 hover:text-white"
                                onClick={handleBuzzIn}
                            >
                                Buzzer
                            </button>
                            <p className="mt-2 text-4xl font-semibold text-yellow-500">{questionTimeRemaining}</p>
                        </div>
                    )}

                    {buzzedIn && (
                        <div className="flex flex-col items-center mt-4 w-full max-w-md">
                            <input
                                type="text"
                                value={answer}
                                onChange={e => setAnswer(e.target.value)}
                                className="w-full p-4 rounded-lg bg-[#0a14e0] text-yellow-300 border border-yellow-400 text-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                placeholder="Enter your answer"
                            />
                            <p className="mt-2 text-4xl font-semibold text-yellow-500">{answerTimeRemaining}</p>
                            <button
                                className="mt-2 border border-2 border-yellow-400 text-xl font-semibold text-yellow-500 rounded-lg p-2 cursor-pointer hover:bg-yellow-500 hover:text-white"
                                onClick={() => {
                                    setSelectedQuestion(null);
                                    if (areSimilar(selectedQuestion.answer, answer)) {
                                        const audio = new Audio(correctSound);
                                        audio.play();
                                        setPlayerScore(prev => {
                                            console.log("Player correct! Score before:", prev, "after:", prev + selectedQuestion.value);
                                            return prev + selectedQuestion.value;
                                        });
                                    } else {
                                        incorrect.play();
                                        setPlayerWrong(true);
                                        setPlayerScore(prev => {
                                            console.log("Player wrong! Score before:", prev, "after:", prev - selectedQuestion.value);
                                            return prev - selectedQuestion.value;
                                        });
                                    }
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
                        {answerShown ? (
                            <h1
                                className={`text-blue-700 uppercase text-center p-3 text-6xl bg-white rounded-xl shadow-lg border-4 w-1/2 ${answerCorrect ? 'border-green-500' : 'border-red-500'}`}
                                style={{
                                    fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                    textShadow: "2px 2px 6px rgba(0,0,128,0.4)"
                                }}
                            >
                                {answerCorrect ? selectedQuestion?.answer : wrongAnswer}
                            </h1>
                        ) : (
                            <h1
                                className="text-yellow-400 uppercase text-center p-1 text-6xl"
                                style={{
                                    fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                    textShadow: "3px 3px 5px black"
                                }}
                            >
                                Jeoparody!
                            </h1>
                        )}
                        <h2
                            className="text-yellow-400 uppercase text-center p-1 text-2xl"
                            style={{
                                fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                textShadow: "3px 3px 5px black"
                            }}
                        >
                            Round {round}
                        </h2>
                    </div>

                    <div className="flex justify-between mb-4">
                        <div className="flex flex-col items-center flex-1 p-1">
                            <div className={`flex items-center justify-center w-full h-30 bg-[#060CE9] border-4 ${opponent1BuzzedIn ? 'border-green-500' : 'border-yellow-400'} rounded-t-xl text-white text-2xl font-bold shadow-lg`}>
                                <img src={avatar1} alt="Avatar 1" className={`h-40 rounded-full border-4 ${opponent1BuzzedIn ? 'border-green-500' : ''}`} />
                                <div className="flex-2 text-center">{opponent1Score}</div>
                            </div>
                            <div className={`mt-2 ${opponent1BuzzedIn ? 'bg-green-500' : 'bg-yellow-400'} p-2 rounded-b-xl w-full text-center text-[#060CE9] font-semibold uppercase shadow-md`}>
                                {gameData.opponent1.name}
                            </div>
                        </div>

                        <div className="flex flex-col items-center flex-1 p-1">
                            <div className={`flex items-center justify-center w-full h-30 bg-[#060CE9] border-4 ${opponent2BuzzedIn ? 'border-green-500' : 'border-yellow-400'} rounded-t-xl text-white text-2xl font-bold shadow-lg`}>
                                <img src={avatar2} alt="Avatar 2" className={`h-40 rounded-full border-4 ${opponent2BuzzedIn ? 'border-green-500' : ''}`} />
                                <div className="flex-2 text-center">{opponent2Score}</div>
                            </div>
                            <div className={`mt-2 ${opponent2BuzzedIn ? 'bg-green-500' : 'bg-yellow-400'} p-2 rounded-b-xl w-full text-center text-[#060CE9] font-semibold uppercase shadow-md`}>
                                {gameData.opponent2.name}
                            </div>
                        </div>

                        <div className="flex flex-col items-center flex-1 p-1">
                            <div className="flex items-center justify-center w-full h-30 bg-[#060CE9] border-4 border-yellow-400 rounded-t-xl text-white text-2xl font-bold shadow-lg">
                                <img src={avatar3} alt="Avatar 3" className="h-40 rounded-full" />
                                <div className="flex-2 text-center">{playerScore}</div>
                            </div>
                            <div className="mt-2 bg-yellow-400 p-2 rounded-b-xl w-full text-center text-[#060CE9] font-semibold uppercase shadow-md">
                                {gameData.playerName}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-6 gap-1 border-[3px] border-yellow-400">
                        {Object.keys(board).map((cat, i) => (
                            <div
                                key={`cat-${i}`}
                                className="bg-[#060CE9] text-yellow-300 text-center text-xl font-bold border border-yellow-400 uppercase flex items-center justify-center h-20 tracking-wide"
                                style={{ fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif" }}
                            >
                                {cat || "CATEGORY"}
                            </div>
                        ))}

                        {values.map((val, rowIndex) =>
                            Object.keys(board).map((cat, colIndex) => {
                                const question = board[cat]?.[rowIndex];
                                if (!question) return <div key={`empty-${colIndex}-${rowIndex}`} className="bg-[#060CE9] border border-yellow-400 h-24" />;
                                return (
                                    <div
                                        key={`cell-${colIndex}-${rowIndex}`}
                                        className={`${question?.wasAsked ? "invisible" : "visible"} ${question.selected ? 'border-4 border-green-500 bg-yellow-400' : 'border-2 border-yellow-400 bg-[#060CE9]'} 
                                            text-yellow-300 text-center text-3xl font-extrabold flex items-center justify-center h-24 cursor-pointer hover:bg-[#0a14e0] transition-all duration-300`}
                                        style={{
                                            fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                            textShadow: "2px 2px 3px black"
                                        }}
                                        onClick={() => handlePlayerQuestionSelect(cat, rowIndex)}
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