import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import levenshtein from "fast-levenshtein";
import { CheckCircle, XCircle } from "lucide-react";
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

export default function Jeoparody() {
    // get game start data
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

    const [round, setRound] = useState(1);

    const [buzzedIn, setBuzzedIn] = useState(false);
    const [opponent1BuzzedIn, setOpponent1BuzzedIn] = useState(false);
    const [opponent2BuzzedIn, setOpponent2BuzzedIn] = useState(false);

    const [answerTimeRemaining, setAnswerTimeRemaining] = useState(8);
    const [questionTimeRemaining, setQuestionTimeRemaining] = useState(5);
    const [questionRead, setQuestionRead] = useState(false);
    const [playerWrong, setPlayerWrong] = useState(false);

    const [answerShown, setAnswerShown] = useState(false);

    //dollar values for each clue
    const values = round === 1 ? [200, 400, 600, 800, 1000] : [400, 800, 1200, 1600, 2000];

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

        //prevent duplicate runs due to strict mode
        if (hasPlayed.current) return;
        hasPlayed.current = true;

        fetchBoard();
        const greeting = round === 1 ?
            `Welcome to the game everyone! Today's contestants are ${gameData.opponent2.name}, ${gameData.playerName}, and, 
            of course, our returning champion ${gameData.opponent1.name}! Let's get started with our first clue! ${gameData.opponent1.name}?`
            :
            "The first round is over and you are introducing the players to the second round, where more money is at stake";
        
        if (round === 1) {
            sayTts(greeting);
        } else {
            makeComment(greeting);
        }
    }, [round]);

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

    async function makeComment(contextDescription) {
        try {
            const response = await fetch("http://localhost:3001/api/comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contextDescription }),
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

    // handle selecting a question
    async function handleQuestionSelect(question) {
        setSelectedQuestion(question);
        setAnswerTimeRemaining(8);
        setBuzzedIn(false);
        sayTts(question.question);
    }

    async function handleBuzzIn() {
        setBuzzedIn(true);
        buzzIn.play();
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
        if (!questionRead || buzzedIn || opponent1BuzzedIn || opponent2BuzzedIn) {
            setQuestionTimeRemaining(5);
            return;
        };

        const intervalId = setInterval(() => {
            setQuestionTimeRemaining((prev) => {
                if (prev <= 1) {
                    incorrect.play();
                    setAnswerShown(true);
                    setTimeout(() => {
                        setAnswerShown(false);
                    }, 2500);
                    clearInterval(intervalId);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const opponentBuzzInInfo = getOppAnswerInfo()

        setInterval(() => {
            if (opponentBuzzInInfo.opponent && opponentBuzzInInfo.opponent === gameData.opponent1.name){
                setOpponent1BuzzedIn(true);
            }
        }, opponentBuzzInInfo.reactionTime);

        return () => clearInterval(intervalId);
    }, [questionRead, buzzedIn, opponent1BuzzedIn, opponent2BuzzedIn]);

    function areSimilar(str1, str2, threshold = 0.9) {
        const distance = levenshtein.get(str1.toLowerCase(), str2.toLowerCase());
        const maxLen = Math.max(str1.length, str2.length);
        const similarity = 1 - distance / maxLen;
        return similarity >= threshold;
    }

    function getOppAnswerInfo() {
        //determine if each opponent knows the answer
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

        //generate the buzz time for those who know
        const getBuzzTime = () => {
            const r = Math.random();
            if (r < 0.5) return 150 + Math.random() * (500 - 150);
            else if (r < 0.75) return 500 + Math.random() * (1000 - 500);
            else if (r < 0.95) return 1000 + Math.random() * (2000 - 1000);
            else return 2000 + Math.random() * (4000 - 2000);
        };

        opps.forEach(opp => {
            if (opp.knows) {
                opp.buzzTime = getBuzzTime();
            } else {
                opp.buzzTime = Infinity;
            }
        });

        //find the opponent with the shortest reaction time
        const firstToBuzz = opps.reduce((fastest, opp) => {
            return opp.buzzTime < fastest.buzzTime ? opp : fastest;
        });

        //no one knows
        if (firstToBuzz.buzzTime === Infinity) return null;

        return {
            opponent: firstToBuzz.name,
            reactionTime: firstToBuzz.buzzTime //in ms
        };
    }

    function handleOpponentRingIn() {

    }


    return (
        <div className="bg-[#060CE9] min-h-screen flex flex-col items-center justify-center p-4">
            {loading ? (
                <p className="text-white text-2xl font-bold">Loading board...</p>
            ) : (selectedQuestion && !playerWrong && !opponent1BuzzedIn && !opponent2BuzzedIn && questionTimeRemaining) ? (
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
                                    setSelectedQuestion(null);
                                    if (areSimilar(selectedQuestion.answer, answer)) {
                                        const audio = new Audio(correctSound);
                                        audio.play();
                                        setPlayerScore((prev) => prev + selectedQuestion.value);
                                    } else {
                                        incorrect.play();
                                        setPlayerWrong(true);
                                        setPlayerScore((prev) => prev - selectedQuestion.value);
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
                                className="text-blue-700 uppercase text-center p-3 text-6xl bg-white rounded-xl shadow-lg border-4 border-blue-500 w-1/2"
                                style={{
                                    fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                    textShadow: "2px 2px 6px rgba(0,0,128,0.4)",
                                }}
                            >
                                {selectedQuestion.answer || ''}
                            </h1>
                        ) : (
                            <h1
                                className="text-yellow-400 uppercase text-center p-1 text-6xl"
                                style={{
                                    fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                    textShadow: "3px 3px 5px black",
                                }}
                            >
                                Jeoparody!
                            </h1>
                        )}

                        <h2
                            className="text-yellow-400 uppercase text-center p-1 text-2xl"
                            style={{ fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif", textShadow: "3px 3px 5px black" }}
                        >
                            Round {round}
                        </h2>
                    </div>

                    <div className="flex justify-between mb-4">
                        <div className="flex flex-col items-center flex-1 p-1">
                            <div className="flex items-center justify-center w-full h-30 bg-[#060CE9] border-4 border-yellow-400 rounded-t-xl text-white text-2xl font-bold shadow-lg">
                                <img src={avatar1} alt="Avatar 1" className="h-40 rounded-full" />
                                <div className="flex-2 text-center">{opponent1Score}</div>
                            </div>
                            <div className="mt-2 bg-yellow-400 p-2 rounded-b-xl w-full text-center text-[#060CE9] font-semibold uppercase shadow-md">
                                {gameData.opponent1.name}
                            </div>
                        </div>

                        <div className="flex flex-col items-center flex-1 p-1">
                            <div className="flex items-center justify-center w-full h-30 bg-[#060CE9] border-4 border-yellow-400 rounded-t-xl text-white text-2xl font-bold shadow-lg">
                                <img src={avatar2} alt="Avatar 1" className="h-40 rounded-full" />
                                <div className="flex-2 text-center">{opponent2Score}</div>
                            </div>
                            <div className="mt-2 bg-yellow-400 p-2 rounded-b-xl w-full text-center text-[#060CE9] font-semibold uppercase shadow-md">
                                {gameData.opponent2.name}
                            </div>
                        </div>

                        <div className="flex flex-col items-center flex-1 p-1">
                            <div className="flex items-center justify-center w-full h-30 bg-[#060CE9] border-4 border-yellow-400 rounded-t-xl text-white text-2xl font-bold shadow-lg">
                                <img src={avatar3} alt="Avatar 1" className="h-40 rounded-full" />
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
                                        className="bg-[#060CE9] text-yellow-300 text-center text-3xl font-extrabold border border-yellow-400 flex items-center justify-center h-24 cursor-pointer hover:bg-[#0a14e0]"
                                        style={{ fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif", textShadow: "2px 2px 3px black" }}
                                        onClick={() => handleQuestionSelect({ ...question, value: values[rowIndex] })}
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
