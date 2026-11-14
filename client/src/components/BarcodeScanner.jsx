
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const onDetectedRef = useRef(onDetected);
  const scannedRef = useRef(false);

  const [status, setStatus] = useState("Starting camera...");
  const [error, setError] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let mounted = true;
    const reader = new BrowserMultiFormatReader();
    const video = videoRef.current;
    let readyTimeout;

    async function startScanner() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access is not supported.");
        }

        // Listen for the first actual video frame BEFORE starting ZXing.
        const videoReady = new Promise((resolve, reject) => {
          const handleReady = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              cleanup();
              resolve();
            }
          };

          const cleanup = () => {
            video.removeEventListener("loadeddata", handleReady);
            video.removeEventListener("playing", handleReady);
            clearTimeout(readyTimeout);
          };

          video.addEventListener("loadeddata", handleReady);
          video.addEventListener("playing", handleReady);

          readyTimeout = setTimeout(() => {
            cleanup();
            reject(new Error("Camera did not produce a video frame."));
          }, 15000);

          handleReady();
        });

        setStatus("Connecting to camera...");

        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          video,
          (result, scanError) => {
            if (!mounted || scannedRef.current) return;

            if (result) {
              scannedRef.current = true;
              const barcode = result.getText();

              controlsRef.current?.stop();
              setStatus("Barcode detected!");
              onDetectedRef.current?.(barcode);
            } else if (
              scanError &&
              scanError.name !== "NotFoundException"
            ) {
              console.warn("Barcode scanner:", scanError.message);
            }
          }
        );

        if (!mounted) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;

        // ZXing handles video playback. Do NOT call video.play() here.
        await videoReady;

        if (!mounted) return;

        setError("");
        setStatus("Point your camera at a barcode");
      } catch (err) {
        console.error("Camera initialization failed:", err);

        controlsRef.current?.stop();
        controlsRef.current = null;

        if (mounted) {
          setStatus("Camera unavailable");
          setError(err.message || "Could not start camera.");
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      clearTimeout(readyTimeout);

      controlsRef.current?.stop();
      controlsRef.current = null;

      const stream = video?.srcObject;

      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (video) {
        video.srcObject = null;
      }
    };
  }, []);

  function handleManualSubmit(event) {
    event.preventDefault();

    const barcode = manualBarcode.trim();

    if (!barcode) {
      setError("Please enter a barcode.");
      return;
    }

    scannedRef.current = true;
    controlsRef.current?.stop();
    onDetectedRef.current?.(barcode);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 text-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Scan Product Barcode
          </h2>

          <button type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-64 w-full rounded-xl bg-black object-cover"
        />

        <p className="mt-3 text-center text-sm">{status}</p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleManualSubmit} className="mt-5 space-y-3">
          <input
            type="text"
            value={manualBarcode}
            onChange={(event) => setManualBarcode(event.target.value)}
            placeholder="Enter barcode manually"
            className="w-full rounded-lg border p-3"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 p-3 font-semibold text-white"
          >
            Find Product
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-lg border p-3"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
