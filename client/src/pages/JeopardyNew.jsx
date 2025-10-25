import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import levenshtein from "fast-levenshtein";
import buzzSound from "../assets/sounds/BuzzIn.wav";
import correctSound from "../assets/sounds/correct.mp3";
import incorrectSound from "../assets/sounds/incorrect.wav";
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

export default function JeopardyNew() {
    const location = useLocation();
    const gameData = location.state;
    const hasPlayed = useRef(false);

    const [board, setBoard] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    const [playerScore, setPlayerScore] = useState(0);
    const [opponent1Score, setOpponent1Score] = useState(0);
    const [opponent2Score, setOpponent2Score] = useState(0);

    const [answer, setAnswer] = useState("");
    const [wrongAnswer, setWrongAnswer] = useState();
    const [round, setRound] = useState(1);

    const [buzzedIn, setBuzzedIn] = useState(false);
    const [opponent1BuzzedIn, setOpponent1BuzzedIn] = useState(false);
    const [opponent2BuzzedIn, setOpponent2BuzzedIn] = useState(false);

    const [answerTimeRemaining, setAnswerTimeRemaining] = useState(8);
    const [questionTimeRemaining, setQuestionTimeRemaining] = useState(5);
    const [questionRead, setQuestionRead] = useState(false);
    const [playerWrong, setPlayerWrong] = useState(false);
    const [answerShown, setAnswerShown] = useState(false);
    const [answerCorrect, setAnswerCorrect] = useState(false);

    const [controllingPlayer, setControllingPlayer] = useState(gameData.opponent1.name);

    const values = round === 1 ? [200, 400, 600, 800, 1000] : [400, 800, 1200, 1600, 2000];

    useEffect(() => {
        async function fetchBoard() {
            try {
                console.log("Fetching board...");
                const res = await fetch("http://localhost:3001/api/board");
                const data = await res.json();
                Object.keys(data).forEach(category => {
                    data[category] = data[category].map(q => ({
                        ...q,
                        wasAsked: false,
                        category
                    }));
                });
                setBoard(data);
                setLoading(false);
                console.log("Board loaded:", data);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        }
        if (hasPlayed.current) return;
        hasPlayed.current = true;

        fetchBoard();

        const greeting =
            round === 1
                ? `Welcome to the game everyone! Today's contestants are ${gameData.opponent2.name}, ${gameData.playerName}, and our returning champion ${gameData.opponent1.name}!`
                : "The first round is over, introducing players to the second round.";

        if (round === 1) sayTts(greeting);
        else makeComment(greeting);
    }, [round]);

    useEffect(() => {
        setBuzzedIn(false);
        setQuestionRead(false);
        setPlayerWrong(false);
    }, [selectedQuestion]);

    /*
    useEffect(() => {
        if (!buzzedIn) return;
        console.log("Player buzzed in");
        const intervalId = setInterval(() => {
            setAnswerTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    setPlayerWrong(true);
                    console.log("Answer time expired");
                    return 0;
                }
                console.log("Answer time remaining:", prev - 1);
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intervalId);
    }, [buzzedIn]);


    */
    const opponentTimerRef = useRef(null);

    const opponentHasBuzzedRef = useRef(false);

    useEffect(() => {
        if (!selectedQuestion || !questionRead) return;

        // Reset buzz state tracking
        opponentHasBuzzedRef.current = false;
        setQuestionTimeRemaining(5);

        const intervalId = setInterval(() => {
            setQuestionTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    incorrect.play();
                    setAnswerShown(true);
                    setTimeout(() => setAnswerShown(false), 2500);
                    console.log("Question time expired, showing answer");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        //schedule opponent buzz once per question
        const opponentBuzzInInfo = getOppAnswerInfo();
        if (opponentBuzzInInfo) {
            opponentTimerRef.current = setTimeout(() => {
                if (
                    !buzzedIn &&
                    !opponent1BuzzedIn &&
                    !opponent2BuzzedIn &&
                    !opponentHasBuzzedRef.current
                ) {
                    opponentHasBuzzedRef.current = true;
                    if (opponentBuzzInInfo.opponent === gameData.opponent1.name) {
                        setOpponent1BuzzedIn(true);
                        console.log("Opponent 1 buzzed in:", gameData.opponent1.name);
                    } else {
                        setOpponent2BuzzedIn(true);
                        console.log("Opponent 2 buzzed in:", gameData.opponent2.name);
                    }
                    clearInterval(intervalId); //stop timerj
                }
            }, opponentBuzzInInfo.reactionTime);
        }

        return () => {
            clearInterval(intervalId);
            clearTimeout(opponentTimerRef.current);
        };
    }, [selectedQuestion, questionRead]);


    /*
    useEffect(() => {
        if (!(opponent1BuzzedIn || opponent2BuzzedIn)) {
            return;
        }

    }, [opponent1BuzzedIn, opponent2BuzzedIn]);


    useEffect(() => {
        if (!selectedQuestion) return;

        const handleOpponentBuzz = async (opponent) => {
            setQuestionTimeRemaining(5);

            if (opponent === "opponent1") {
                const correct = Math.random() < 0.8;
                setAnswerCorrect(correct);

                if (correct) {
                    setAnswerShown(true);
                    const timeoutId = setTimeout(() => {
                        setAnswerShown(false);
                        setOpponent1BuzzedIn(false);
                        clearTimeout(timeoutId);
                    }, 4000);

                    setOpponent1Score(prev => prev + selectedQuestion.value);
                } else {
                    try {
                        const res = await fetch("http://localhost:3001/api/wrong", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                question: selectedQuestion.question,
                                answer: selectedQuestion.answer
                            })
                        });
                        const data = await res.json();
                        console.log("Opponent 1 wrong answer comment:", data.comment);

                        setAnswerShown(true);
                        const timeoutId = setTimeout(() => {
                            setAnswerShown(false);
                            setOpponent1BuzzedIn(false);
                            clearTimeout(timeoutId);
                        }, 4000);

                        setOpponent1Score(prev => prev - selectedQuestion.value);
                    } catch (err) {
                        console.error("Failed to get wrong answer comment:", err);
                    }
                }
            }

            if (opponent === "opponent2") {
                setAnswerShown(true);
                const timeoutId = setTimeout(() => {
                    setAnswerShown(false);
                    setOpponent2BuzzedIn(false);
                    clearTimeout(timeoutId);
                }, 4000);

                setOpponent2Score(prev => prev + selectedQuestion.value);
            }
        };

        if (opponent1BuzzedIn) handleOpponentBuzz("opponent1");
        if (opponent2BuzzedIn) handleOpponentBuzz("opponent2");

    }, [opponent1BuzzedIn, opponent2BuzzedIn, selectedQuestion]);

    */


    const categories = Object.keys(board);

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
            return audio;
        } catch (err) {
            console.error("TTS error:", err);
            return null;
        }
    }

    async function askQuestion(questionText) {
        const audio = await sayTts(questionText);
        if (!audio) return;

        audio.addEventListener("ended", () => {
            setQuestionRead(true);
            console.log("Question read completed, setQuestionRead(true)");
        });
    }


    async function makeComment(contextDescription) {
        try {
            console.log("Making comment:", contextDescription);
            const response = await fetch("http://localhost:3001/api/comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contextDescription })
            });
            if (!response.ok) throw new Error("TTS request failed");
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.playbackRate = 1.25;
            audio.onended = () => URL.revokeObjectURL(audioUrl);
            await audio.play();
        } catch (err) {
            console.error("TTS error:", err);
        }
    }

    async function handleQuestionSelect(category, question) {
        console.log("Selected question:", question.question);
        setBoard(prevBoard => {
            const newBoard = { ...prevBoard };
            newBoard[category] = newBoard[category].map(q =>
                q.question === question.question ? { ...q, wasAsked: true } : q
            );
            return newBoard;
        });
        setSelectedQuestion(question);
        setAnswerTimeRemaining(8);
        setBuzzedIn(false);
        askQuestion(question.question);
    }

    async function handleBuzzIn() {
        setBuzzedIn(true);
        console.log("Player buzzed in!");
        buzzIn.play();
    }

    function areSimilar(str1, str2, threshold = 0.9) {
        const distance = levenshtein.get(str1.toLowerCase(), str2.toLowerCase());
        const maxLen = Math.max(str1.length, str2.length);
        const similarity = 1 - distance / maxLen;
        return similarity >= threshold;
    }

    function getOppAnswerInfo() {
        const opps = [
            {
                name: gameData.opponent1.name,
                knows: (gameData.opponent1.difficulty * 5 + 45) / 100 > Math.random()
            },
            {
                name: gameData.opponent2.name,
                knows: (gameData.opponent2.difficulty * 5 + 45) / 100 > Math.random()
            }
        ];

        const getBuzzTime = () => {
            const r = Math.random();
            if (r < 0.5) return 150 + Math.random() * (500 - 150);
            else if (r < 0.75) return 500 + Math.random() * (1000 - 500);
            else if (r < 0.95) return 1000 + Math.random() * (2000 - 1000);
            else return 2000 + Math.random() * (4000 - 2000);
        };

        opps.forEach(opp => {
            opp.buzzTime = opp.knows ? getBuzzTime() : Infinity;
        });

        const firstToBuzz = opps.reduce((fastest, opp) =>
            opp.buzzTime < fastest.buzzTime ? opp : fastest
        );

        if (firstToBuzz.buzzTime === Infinity) return null;

        console.log("Opponent buzz info:", firstToBuzz);
        return {
            opponent: firstToBuzz.name,
            reactionTime: firstToBuzz.buzzTime
        };
    }

    return (
        <div className="bg-[#060CE9] min-h-screen flex flex-col items-center justify-center p-4">
            {loading ? (
                <p className="text-white text-2xl font-bold">Loading board...</p>
            ) : selectedQuestion && !playerWrong && !opponent1BuzzedIn && !opponent2BuzzedIn && questionTimeRemaining ? (
                <div className="flex flex-col items-center justify-center gap-4 min-h-screen bg-[#060CE9] p-4">
                    <div
                        className="text-white text-center px-6 py-8 rounded-lg"
                        style={{ fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif" }}
                    >
                        <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide text-shadow-lg">
                            {selectedQuestion.question}
                        </p>
                    </div>

                    {questionRead && !buzzedIn && (
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
                                        className={`${question?.wasAsked ? "invisible" : "visible"} bg-[#060CE9] text-yellow-300 text-center text-3xl font-extrabold border border-yellow-400 flex items-center justify-center h-24 cursor-pointer hover:bg-[#0a14e0] transition-all duration-300`}
                                        style={{
                                            fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                            textShadow: "2px 2px 3px black"
                                        }}
                                        onClick={() => handleQuestionSelect(cat, { ...question, value: values[rowIndex] })}
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
