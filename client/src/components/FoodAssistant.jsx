import { useState } from "react";
import { Bot, LoaderCircle, Send, Sparkles, X } from "lucide-react";

const MODEL = "llama3.2:3b";

function inventorySummary(foods) {
  if (!foods.length) return "The active inventory is currently empty.";
  return foods.map((food) => ({
    name: food.name,
    brand: food.brand || "",
    quantity: food.quantity,
    unit: food.unit,
    category: food.category,
    expiryDate: food.expiryDate,
    storageLocation: food.storageLocation,
  }));
}

export default function FoodAssistant({ foods = [], onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your FoodGuard assistant. I can help you prioritize food that expires soon, plan what to use, and reduce waste. Ask me anything about your current inventory." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  async function sendMessage(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    const nextMessages = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setConnectionError("");
    try {
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          stream: false,
          messages: [
            {
              role: "system",
              content: "You are FoodGuard's practical food inventory assistant. Use only the supplied inventory for claims about the user's food. Prioritize items with the nearest expiry date. Give safe, concise storage and food-waste advice. Never claim food is safe to eat based only on an expiry date; advise checking smell, appearance, storage history and package instructions. Never invent inventory items or expiry dates. If the inventory does not contain an answer, say so. Inventory JSON: " + JSON.stringify(inventorySummary(foods)),
            },
            ...nextMessages.slice(-8).map(({ role, content }) => ({ role, content })),
          ],
        }),
      });
      if (!response.ok) throw new Error(`Local AI returned HTTP ${response.status}.`);
      const data = await response.json();
      const answer = data?.message?.content?.trim();
      if (!answer) throw new Error("The local AI returned an empty response.");
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch (err) {
      setConnectionError("Could not reach Ollama at http://localhost:11434. Start Ollama and allow your Vite origin (http://localhost:5173) in OLLAMA_ORIGINS, then try again.");
      setMessages((current) => [...current, { role: "assistant", content: "I couldn't connect to the local AI model, so I haven't generated an answer. Please start Ollama and retry." }]);
      console.error("Food Assistant connection error:", err);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = ["Which food should I use first?", "What is expiring in the next 7 days?", "Suggest a plan to reduce food waste."];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-violet-400/20 bg-[#0B211B] shadow-2xl sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-emerald-900/50 px-5 py-4">
          <div className="flex items-center gap-3"><div className="rounded-xl border border-violet-400/25 bg-violet-400/10 p-2.5 text-violet-200"><Bot size={22}/></div><div><h2 className="font-bold text-slate-100">AI Food Assistant</h2><p className="text-xs text-slate-400">Local Ollama · {MODEL} · Inventory-aware</p></div></div>
          <button type="button" onClick={onClose} className="rounded-xl border border-emerald-900/60 p-2 text-slate-300 hover:bg-emerald-950/50" aria-label="Close assistant"><X size={19}/></button>
        </header>
        <div className="flex items-center gap-2 border-b border-emerald-900/40 bg-violet-400/5 px-5 py-3 text-xs text-violet-100"><Sparkles size={14}/> Answers use your active FoodGuard inventory and a local AI model.</div>
        <div className="min-h-64 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          <div className="mb-2 rounded-xl border border-emerald-900/50 bg-[#081C16] p-3 text-xs text-slate-400">Active inventory: <strong className="text-slate-200">{foods.length} items</strong></div>
          {messages.map((message, index) => (
            <div key={index} className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-emerald-600 text-white" : "mr-auto border border-violet-400/15 bg-violet-400/10 text-slate-200"}`}>{message.content}</div>
          ))}
          {loading && <div className="flex items-center gap-2 text-xs text-slate-400"><LoaderCircle size={15} className="animate-spin"/> Thinking with your inventory...</div>}
          {connectionError && <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">{connectionError}</p>}
          {messages.length === 1 && <div className="flex flex-wrap gap-2">{suggestions.map((suggestion)=><button key={suggestion} type="button" onClick={()=>setInput(suggestion)} className="rounded-full border border-violet-400/20 px-3 py-2 text-xs text-violet-200 hover:bg-violet-400/10">{suggestion}</button>)}</div>}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2 border-t border-emerald-900/50 bg-[#091E18] p-4"><input value={input} onChange={(event)=>setInput(event.target.value)} disabled={loading} placeholder="Ask about your food inventory..." className="min-w-0 flex-1 rounded-xl border border-emerald-900/70 bg-[#061712] px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-400"/><button type="submit" disabled={loading || !input.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"><Send size={16}/><span className="hidden sm:inline">Send</span></button></form>
      </section>
    </div>
  );
}
