
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  LoaderCircle,
  Send,
  Sparkles,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const MODEL = "llama3.2:3b";

export default function FoodAssistant({ foods = [], onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your FoodGuard assistant. Ask me about your inventory, expiry dates, recipes and food waste.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("en-IN");
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const recognitionRef = useRef(null);

  // Stop microphone and speech when the component closes
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Start voice input
  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setConnectionError(
        "Voice recognition is not supported in this browser. Please use Chrome or type your message."
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    if (loading) return;

    window.speechSynthesis?.cancel();
    setSpeakingIndex(null);
    setConnectionError("");

    const recognition = new SpeechRecognition();

    recognition.lang = voiceLanguage;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript += event.results[i][0].transcript;
      }

      setInput(transcript);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setConnectionError(
          event.error === "not-allowed"
            ? "Microphone permission denied. Allow microphone access in Chrome."
            : `Voice recognition error: ${event.error}`
        );
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      setConnectionError("Could not start microphone. Please try again.");
      recognitionRef.current = null;
      setListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  // Read an AI response aloud
  function speakMessage(content, index) {
    if (!("speechSynthesis" in window)) {
      setConnectionError(
        "Speech output is not supported in this browser."
      );
      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(content);

    utterance.lang = voiceLanguage;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setSpeakingIndex(index);
    };

    utterance.onend = () => {
      setSpeakingIndex(null);
    };

    utterance.onerror = () => {
      setSpeakingIndex(null);
      setConnectionError("Could not play the AI voice. Try again.");
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeakingIndex(null);
  }

  // Send message to FoodGuard backend
  async function sendMessage(event) {
    event.preventDefault();

    const question = input.trim();

    if (!question || loading) return;

    const token = sessionStorage.getItem("foodguard_token");

    if (!token) {
      setConnectionError(
        "Login session not found. Please log in again."
      );
      return;
    }

    stopListening();
    stopSpeaking();

    setMessages((current) => [
      ...current,
      { role: "user", content: question },
    ]);

    setInput("");
    setLoading(true);
    setConnectionError("");

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: question,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not get an AI response."
        );
      }

      const answer = data.reply?.trim();

      if (!answer) {
        throw new Error("AI returned an empty response.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: answer },
      ]);

    } catch (error) {
      console.error("FoodGuard AI error:", error);
      setConnectionError(error.message);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process your request. Please check the connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "Which food should I use first?",
    "What is expiring in the next 7 days?",
    "Suggest two recipes using my inventory.",
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">

      <section className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-violet-400/20 bg-[#0B211B] shadow-2xl sm:rounded-3xl">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-emerald-900/50 px-5 py-4">

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-violet-400/25 bg-violet-400/10 p-2.5 text-violet-200">
              <Bot size={22} />
            </div>

            <div>
              <h2 className="font-bold text-slate-100">
                AI Food Assistant
              </h2>

              <p className="text-xs text-slate-400">
                Local Ollama · {MODEL} · Voice Enabled
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-emerald-900/60 p-2 text-slate-300 hover:bg-emerald-950/50"
            aria-label="Close assistant"
          >
            <X size={19} />
          </button>
        </header>

        {/* Voice settings */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/40 bg-violet-400/5 px-5 py-3">

          <div className="flex items-center gap-2 text-xs text-violet-100">
            <Sparkles size={14} />
            Speak or type your question
          </div>

          <select
            value={voiceLanguage}
            onChange={(event) => setVoiceLanguage(event.target.value)}
            disabled={listening || loading}
            className="rounded-lg border border-violet-400/20 bg-[#0B211B] px-2 py-1.5 text-xs text-slate-200"
            aria-label="Voice language"
          >
            <option value="en-IN">English (India)</option>
            <option value="kn-IN">Kannada</option>
            <option value="hi-IN">Hindi</option>
          </select>

        </div>

        {/* Chat messages */}
        <div className="min-h-64 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">

          <div className="rounded-xl border border-emerald-900/50 bg-[#081C16] p-3 text-xs text-slate-400">
            Active inventory:{" "}
            <strong className="text-slate-200">
              {foods.length} items
            </strong>
          </div>

          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-auto bg-emerald-600 text-white"
                  : "mr-auto border border-violet-400/15 bg-violet-400/10 text-slate-200"
              }`}
            >
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>

              {message.role === "assistant" && (
                <button
                  type="button"
                  onClick={() => speakMessage(message.content, index)}
                  className="mt-2 flex items-center gap-2 rounded-lg border border-violet-400/20 px-2 py-1.5 text-xs text-violet-200 hover:bg-violet-400/10"
                >
                  {speakingIndex === index ? (
                    <>
                      <VolumeX size={14} />
                      Stop voice
                    </>
                  ) : (
                    <>
                      <Volume2 size={14} />
                      Read aloud
                    </>
                  )}
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <LoaderCircle size={15} className="animate-spin" />
              FoodGuard AI is thinking...
            </div>
          )}

          {connectionError && (
            <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
              {connectionError}
            </p>
          )}

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="rounded-full border border-violet-400/20 px-3 py-2 text-xs text-violet-200 hover:bg-violet-400/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message input and microphone */}
        <form
          onSubmit={sendMessage}
          className="flex gap-2 border-t border-emerald-900/50 bg-[#091E18] p-4"
        >

          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
            placeholder="Ask about your food inventory..."
            className="min-w-0 flex-1 rounded-xl border border-emerald-900/70 bg-[#061712] px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-400"
          />

          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            disabled={loading}
            className={`rounded-xl px-3 py-3 text-white ${
              listening
                ? "bg-red-600 hover:bg-red-500"
                : "bg-emerald-700 hover:bg-emerald-600"
            } disabled:opacity-50`}
            title={listening ? "Stop recording" : "Start voice input"}
            aria-label={listening ? "Stop recording" : "Start voice input"}
          >
            {listening ? (
              <MicOff size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Send</span>
          </button>

        </form>
        {listening && (
          <div className="bg-emerald-950/70 px-4 py-2 text-center text-xs text-emerald-300">
            <span className="animate-pulse">●</span>
            Listening... Speak now.
          </div>
        )}

      </section>
    </div>
  );
}
