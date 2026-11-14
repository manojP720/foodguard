
import { useRef, useState } from "react";
import { Camera, Upload, X, ScanLine } from "lucide-react";

export default function SmartAIScanner({ onClose, onScan }) {
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleContinue = () => {
    if (!file) return;
    onScan?.(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Smart AI Scanner
            </h2>
            <p className="text-sm text-gray-500">
              Scan your food package
            </p>
          </div>

          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X size={22} />
          </button>
        </div>

        <div className="flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-4">
          {preview ? (
            <img
              src={preview}
              alt="Selected food package"
              className="max-h-64 rounded-lg object-contain"
            />
          ) : (
            <>
              <ScanLine size={52} className="mb-3 text-green-600" />
              <p className="font-semibold text-gray-800">
                Capture or upload a package image
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Make sure the product name and expiry label are visible.
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
            className="flex items-center justify-center gap-2 rounded-xl border border-green-600 px-4 py-3 font-semibold text-green-700 hover:bg-green-50"
          >
            <Camera size={19} />
            Camera
          </button>

          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
          >
            <Upload size={19} />
            Upload
          </button>
        </div>

        {preview && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                URL.revokeObjectURL(preview);
                setPreview("");
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="flex-1 rounded-xl border px-4 py-3 font-medium"
            >
              Retake
            </button>

            <button
              onClick={handleContinue}
              className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

