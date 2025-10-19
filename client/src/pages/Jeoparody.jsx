import { useState, useEffect } from "react";

export default function Jeopardy() {
    const [board, setBoard] = useState({});
    const [loading, setLoading] = useState(true);

    // Dollar values for each row
    const values = [200, 400, 600, 800, 1000]; // You can adjust based on your data

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

    return (
        <div className="bg-[#060CE9] min-h-screen flex flex-col items-center justify-center p-4">


            <h1
                className="text-yellow-400 uppercase text-center mb-6"
                style={{
                    fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                    fontSize: "4rem",
                    textShadow: "3px 3px 5px black",
                }}
            >
                Jeoparody!
            </h1>

            <div className="grid grid-cols-6 gap-1 w-full max-w-6xl border-[3px] border-yellow-400">
                {/* Category Headers */}
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

                {/* Dollar Value Cells */}
                {values.map((val, rowIndex) =>
                    categories.map((cat, colIndex) => {
                        const question = board[cat][rowIndex]; // get corresponding question
                        return (
                            <div
                                key={`cell-${colIndex}-${rowIndex}`}
                                className="bg-[#060CE9] text-yellow-300 text-center text-3xl font-extrabold border border-yellow-400 flex items-center justify-center h-24 cursor-pointer hover:bg-[#0a14e0]"
                                style={{
                                    fontFamily: "Impact, 'Anton', 'Arial Black', sans-serif",
                                    textShadow: "2px 2px 3px black",
                                }}
                                onClick={() => alert(`Question: ${question.question}\nAnswer: ${question.answer}`)}
                            >
                                ${val}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
