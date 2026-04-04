import { useState } from "react";
import { askAI } from "../lib/ai";

export default function Chatbox() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const handleSend = async () => {
        if (!input) return;

        const userMsg = { role: "user", text: input };
        setMessages((prev) => [...prev, userMsg]);

        setInput("");

        const reply = await askAI(input);

        const aiMsg = { role: "ai", text: reply };
        setMessages((prev) => [...prev, aiMsg]);
    };

    return (
        <div style={{ padding: "20px", color: "white" }}>
            <h2>StockWise AI Chat</h2>

            <div>
                {messages.map((m, i) => (
                    <p key={i}>
                        <b>{m.role}:</b> {m.text}
                    </p>
                ))}
            </div>

            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                style={{ padding: "8px", marginRight: "10px" }}
            />

            <button onClick={handleSend}>Send</button>
        </div>
    );
}