
import { useRef, useState, useEffect } from "react";
import { Camera, Upload, X, ScanLine, RefreshCw } from "lucide-react";
import { createWorker } from "tesseract.js";

export default function SmartAIScanner({ onClose, onScan }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image size must be below 10 MB.");
      return;
    }

    setPreview(URL.createObjectURL(selectedFile));
    setFile(selectedFile);
    setExtractedText("");
    setError("");
    setProgress(0);
  };

  const handleContinue = async () => {
    if (!file || loading) return;

    let worker;

    try {
      setLoading(true);
      setError("");
      setExtractedText("");
      setProgress(0);

      worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(Math.round(message.progress * 100));
          }
        },
      });

      const result = await worker.recognize(file);
      const text = result.data.text.trim();

      if (!text) {
        setError("No text detected. Try a clearer, well-lit image.");
        return;
      }

      setExtractedText(text);

      if (onScan) {
        onScan(file, text);
      }
    } catch (err) {
      console.error("OCR error:", err);
      setError("Unable to read this image. Please try again.");
    } finally {
      if (worker) await worker.terminate();
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setFile(null);
    setPreview("");
    setExtractedText("");
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Smart AI Scanner
            </h2>
            <p className="text-sm text-gray-500">
              Scan your food package and extract details
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-40"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-4">

          {preview ? (
            <img
              src={preview}
              alt="Food package preview"
              className="max-h-64 rounded-lg object-contain"
            />
          ) : (
            <>
              <ScanLine size={52} className="mb-3 text-green-600" />
              <p className="font-semibold text-gray-800">
                Capture or upload a package image
              </p>
              <p className="mt-2 text-center text-sm text-gray-500">
                Keep the product name and expiry label visible.
              </p>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-green-600 px-4 py-3 font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            <Camera size={19} />
            Camera
          </button>

          <button
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Upload size={19} />
            Upload
          </button>
        </div>

        {file && !loading && (
          <div className="mt-4">
            <button
              onClick={resetScanner}
              className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={17} />
              Choose another image
            </button>
          </div>
        )}

        {file && !extractedText && (
          <button
            onClick={handleContinue}
            disabled={loading}
            className="mt-3 w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Reading package..." : "Scan with AI"}
          </button>
        )}

        {loading && (
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-sm text-gray-600">
              <span>Extracting text...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {extractedText && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">
              Extracted Package Text
            </h3>
            <pre className="whitespace-pre-wrap break-words text-sm text-gray-700">
              {extractedText}
            </pre>
            <p className="mt-3 text-xs text-gray-500">
              Please verify extracted information before adding it to inventory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
