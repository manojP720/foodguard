
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const onDetectedRef = useRef(onDetected);

  const [status, setStatus] = useState("Starting camera...");
  const [manualBarcode, setManualBarcode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let mounted = true;
    let hasScanned = false;

    const reader = new BrowserMultiFormatReader();

    async function startScanner() {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, scanError) => {
            if (!mounted || hasScanned) return;

            if (result) {
              hasScanned = true;

              const barcode = result.getText();

              controlsRef.current?.stop();
              setStatus("Barcode detected!");

              onDetectedRef.current?.(barcode);
              return;
            }

            if (scanError && scanError.name !== "NotFoundException") {
              console.warn("Barcode scan:", scanError.message);
            }
          }
        );

        if (!mounted) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setStatus("Point your camera at a barcode");
      } catch (err) {
        if (mounted) {
          setError(
            "Unable to access camera. Please allow camera permission or enter the barcode manually."
          );
          setStatus("Camera unavailable");
          console.error("Camera error:", err);
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  function handleManualSubmit(event) {
    event.preventDefault();

    const barcode = manualBarcode.trim();

    if (!barcode) {
      setError("Please enter a barcode.");
      return;
    }

    onDetectedRef.current?.(barcode);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Scan Product Barcode
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            className="h-64 w-full object-cover"
            autoPlay
            muted
            playsInline
          />
        </div>

        <p className="mt-3 text-center text-sm text-gray-600">
          {status}
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-sm text-gray-500">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleManualSubmit}>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Enter barcode manually
          </label>

          <input
            type="text"
            value={manualBarcode}
            onChange={(event) => setManualBarcode(event.target.value)}
            placeholder="Enter barcode number"
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="mt-3 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
          >
            Find Product
          </button>
        </form>

      </div>
    </div>
  );
}

export default BarcodeScanner;
