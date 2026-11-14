
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  X,
  ScanLine,
  RefreshCw,
  CameraOff,
} from "lucide-react";
import { createWorker } from "tesseract.js";

export default function SmartAIScanner({ onClose, onScan }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);
  const previewRef = useRef("");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [error, setError] = useState("");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  async function startCamera() {
    try {
      setError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera API unavailable. Use localhost or HTTPS and a supported browser."
        );
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch (err) {
      console.error("Camera error:", err);

      setError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access in Chrome site settings."
          : err.name === "NotFoundError"
          ? "No camera was found on this device."
          : err.message || "Unable to open camera."
      );
    }
  }

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.error("Camera preview error:", err);
        setError("Could not start camera preview.");
      });
    }
  }, [cameraOpen]);

  function handleFile(selectedFile) {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    stopCamera();

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }

    const url = URL.createObjectURL(selectedFile);
    previewRef.current = url;

    setFile(selectedFile);
    setPreview(url);
    setExtractedText("");
    setProgress(0);
    setError("");
  }

  function capturePhoto() {
    const video = videoRef.current;

    if (!video || !video.videoWidth) {
      setError("Camera is not ready. Please wait a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture photo. Please try again.");
          return;
        }

        const imageFile = new File(
          [blob],
          "food-package.jpg",
          { type: "image/jpeg" }
        );

        handleFile(imageFile);
      },
      "image/jpeg",
      0.92
    );
  }

  async function handleContinue() {
    if (!file || loading) return;

    let worker;

    try {
      setLoading(true);
      setError("");
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
        setError("No text detected. Try a clearer image.");
        return;
      }

      setExtractedText(text);
      onScan?.(file, text);
    } catch (err) {
      console.error("OCR error:", err);
      setError("Unable to read this image. Please try again.");
    } finally {
      if (worker) await worker.terminate();
      setLoading(false);
    }
  }

  function resetScanner() {
    stopCamera();

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
    }

    setFile(null);
    setPreview("");
    setExtractedText("");
    setProgress(0);
    setError("");

    if (inputRef.current) inputRef.current.value = "";
  }

  function closeScanner() {
    stopCamera();
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Smart AI Scanner
            </h2>
            <p className="text-sm text-gray-500">
              Capture or upload your food package
            </p>
          </div>

          <button
            onClick={closeScanner}
            disabled={loading}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-3">

          {cameraOpen ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-h-72 w-full rounded-lg object-contain"
            />
          ) : preview ? (
            <img
              src={preview}
              alt="Food package"
              className="max-h-72 rounded-lg object-contain"
            />
          ) : (
            <>
              <ScanLine size={52} className="mb-3 text-green-600" />
              <p className="font-semibold text-gray-800">
                Ready to scan your food
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
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div className="mt-5 grid grid-cols-2 gap-3">

          <button
            onClick={startCamera}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-green-600 px-4 py-3 font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            <Camera size={19} />
            Open Camera
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

        {cameraOpen && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={capturePhoto}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 font-semibold text-white"
            >
              <Camera size={18} />
              Capture Photo
            </button>

            <button
              onClick={stopCamera}
              className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold text-gray-700"
            >
              <CameraOff size={18} />
              Stop Camera
            </button>
          </div>
        )}

        {file && !loading && (
          <button
            onClick={resetScanner}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={17} />
            Choose Another Image
          </button>
        )}

        {file && !extractedText && (
          <button
            onClick={handleContinue}
            disabled={loading}
            className="mt-3 w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Reading Package..." : "Scan with AI"}
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
              Verify all extracted information before saving.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
