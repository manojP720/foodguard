import { useEffect, useMemo, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import {
  Camera,
  CheckCircle2,
  LoaderCircle,
  ScanLine,
  Upload,
  X,
} from "lucide-react";

const today = () => {
  const value = new Date();
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 10);
};

function twoDigitYear(value) {
  const year = Number(value);
  if (!Number.isFinite(year)) return null;
  if (String(value).length === 4) return year;
  return year >= 70 ? 1900 + year : 2000 + year;
}

function monthYearToISO(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
    return "";
  }
  // The existing inventory API requires YYYY-MM-DD. For a printed MM/YY,
  // store the last day of that month and clearly show month-level precision.
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function addMonthsToMonthYear(month, year, durationMonths) {
  const total = Number(year) * 12 + (Number(month) - 1) + Number(durationMonths);
  const targetYear = Math.floor(total / 12);
  const targetMonth = (total % 12) + 1;
  return monthYearToISO(targetMonth, targetYear);
}

function parseMonthYear(value) {
  const match = value.match(/(?:^|[^\d])([01]?\d)\s*[\/. -]\s*(\d{2}|20\d{2})(?!\d)/);
  if (!match) return null;

  const month = Number(match[1]);
  const year = twoDigitYear(match[2]);

  if (month < 1 || month > 12 || !year || year < 2000 || year > 2100) return null;
  return { month, year };
}

function parseFullDate(value) {
  // Indian packaging convention: DD/MM/YYYY. Do not silently accept impossible dates.
  const match = value.match(/\b(\d{1,2})[/. -](\d{1,2})[/. -](20\d{2})\b/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parsePackageDates(ocrText) {
  const normalized = String(ocrText || "")
    .toUpperCase()
    .replace(/[：]/g, ":")
    .replace(/[–—]/g, "-")
    .replace(/\u00a0/g, " ")
    // Common OCR confusions in small package coding stamps.
    .replace(/[|]/g, "I");

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const allText = lines.join(" ");

  let manufacturing = null;
  let expiry = null;
  let evidence = "";
  let method = "";
  let confidence = "low";

  // On the supplied Simple and Pond's packages, the printed legend explains
  // that # is MFD and @ is USE BEFORE. Accept OCR's common @ -> Q/O/© errors,
  // but only when the legend or a paired # and @-like code supports it.
  const hasMfgLegend = /\b(MFD|MFG|MANUFACTURING|MANUFACTURED)\b/.test(allText);
  const hasUseBeforeLegend = /\bUSE\s*BEFORE\b/.test(allText);
  const hasMfgCode = /#\s*([01]?\d)\s*[\/. -]?\s*(\d{2}|20\d{2})/.test(allText);
  const hasUseCode = /(?:@|Q|©|O)\s*([01]?\d)\s*[\/. -]?\s*(\d{2}|20\d{2})/.test(allText);
  const hasCodingEvidence =
    (hasMfgLegend && hasUseBeforeLegend) ||
    (hasMfgCode && hasUseCode);

  if (hasCodingEvidence) {
    const mfgMatch = allText.match(/#\s*([01]?\d)\s*[\/. -]?\s*(\d{2}|20\d{2})/);
    if (mfgMatch) {
      const month = Number(mfgMatch[1]);
      const year = twoDigitYear(mfgMatch[2]);
      if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        manufacturing = { month, year };
      }
    }

    const useMatch = allText.match(/(?:@|Q|©|O)\s*([01]?\d)\s*[\/. -]?\s*(\d{2}|20\d{2})/);
    if (useMatch) {
      const month = Number(useMatch[1]);
      const year = twoDigitYear(useMatch[2]);
      if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        expiry = { month, year };
        evidence = useMatch[0].trim();
        method = "Printed package coding: use-before marker";
        confidence = hasUseBeforeLegend ? "high" : "medium";
      }
    }
  }

  // Explicit labels take priority over generic dates elsewhere on the pack.
  if (!expiry) {
    for (const line of lines) {
      const isExpiryLine =
        /\b(EXP(?:IRY|IRES)?|USE\s*BY|USE\s*BEFORE|BEST\s*BEFORE)\b/.test(line);

      if (!isExpiryLine) continue;

      const durationOnly = /\b\d{1,3}\s*MONTHS?\s*FROM\s*(?:THE\s*)?MFG/.test(line);
      if (durationOnly) continue;

      const fullDate = parseFullDate(line);
      if (fullDate) {
        return {
          expiryDate: fullDate,
          manufacturingDate: manufacturing
            ? monthYearToISO(manufacturing.month, manufacturing.year)
            : "",
          precision: "day",
          method: "Explicit expiry / use-before label",
          evidence: line,
          confidence: "medium",
        };
      }

      const monthYear = parseMonthYear(line);
      if (monthYear) {
        expiry = monthYear;
        evidence = line;
        method = "Explicit expiry / use-before label";
        confidence = "medium";
        break;
      }
    }
  }

  if (expiry) {
    return {
      expiryDate: monthYearToISO(expiry.month, expiry.year),
      manufacturingDate: manufacturing
        ? monthYearToISO(manufacturing.month, manufacturing.year)
        : "",
      precision: "month",
      method: method || "Printed expiry month/year",
      evidence: evidence || `${String(expiry.month).padStart(2, "0")}/${expiry.year}`,
      confidence,
    };
  }

  // Duration-based shelf life, e.g. "Use before 36 months from Mfg. Date".
  const durationMatch =
    allText.match(
      /(?:USE\s*BEFORE|BEST\s*BEFORE)[\s\S]{0,70}?(\d{1,3})\s*MONTHS?\s*FROM\s*(?:THE\s*)?MFG\.?\s*DATE/
    ) ||
    allText.match(
      /(\d{1,3})\s*MONTHS?\s*FROM\s*(?:THE\s*)?MFG\.?\s*DATE/
    );

  if (durationMatch) {
    const duration = Number(durationMatch[1]);

    // If no # marker was read, look for a date near MFG DATE / MFG DT / LOT.
    if (!manufacturing) {
      const nearbyDate =
        allText.match(
          /(?:MFG\.?\s*DATE|MFG\.?\s*DT|MFD\.?)[\s\S]{0,100}?([01]?\d)\s*[\/. -]\s*(\d{2}|20\d{2})/
        ) ||
        allText.match(
          /(?:BATCH|LOT|MFG)[\s\S]{0,55}?([01]?\d)\s*[\/. -]\s*(\d{2}|20\d{2})/
        );

      if (nearbyDate) {
        const month = Number(nearbyDate[1]);
        const year = twoDigitYear(nearbyDate[2]);
        if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
          manufacturing = { month, year };
        }
      }
    }

    if (manufacturing && duration > 0 && duration <= 120) {
      return {
        expiryDate: addMonthsToMonthYear(
          manufacturing.month,
          manufacturing.year,
          duration
        ),
        manufacturingDate: monthYearToISO(
          manufacturing.month,
          manufacturing.year
        ),
        precision: "month",
        method: `Calculated from manufacturing date + ${duration} months shelf life`,
        evidence: durationMatch[0].trim(),
        confidence: "medium",
      };
    }
  }

  return {
    expiryDate: "",
    manufacturingDate: manufacturing
      ? monthYearToISO(manufacturing.month, manufacturing.year)
      : "",
    precision: "unknown",
    method: "No reliable expiry marker found",
    evidence: "",
    confidence: "low",
  };
}

function guessCategory(name) {
  const value = name.toLowerCase();
  if (/milk|cheese|curd|yogurt|butter|paneer/.test(value)) return "Dairy";
  if (/apple|banana|orange|mango|grape|fruit/.test(value)) return "Fruits";
  if (/bread|biscuit|cookie|cake|bun/.test(value)) return "Bakery";
  if (/chicken|mutton|beef|meat/.test(value)) return "Meat";
  if (/fish|prawn|seafood/.test(value)) return "Seafood";
  if (/rice|wheat|atta|dal|pasta|oats/.test(value)) return "Grains";
  if (/juice|water|soda|drink|coffee|tea/.test(value)) return "Beverages";
  if (/frozen|ice cream/.test(value)) return "Frozen";
  if (/tomato|potato|onion|carrot|vegetable/.test(value)) return "Vegetables";
  return "Other";
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load this image. Please choose another photo."));
    };
    image.src = objectUrl;
  });
}

function makeOCRRegions(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (!width || !height) {
    throw new Error("Image dimensions could not be read.");
  }

  // OCR the full image and focused package-code areas. The lower region is
  // important for the coding stamp on the supplied Pond's container.
  const regions = [
    { name: "full image", x: 0, y: 0, w: 1, h: 1 },
    { name: "lower package area", x: 0.08, y: 0.55, w: 0.84, h: 0.42 },
    { name: "upper package area", x: 0.08, y: 0.02, w: 0.84, h: 0.38 },
  ];

  return regions.map((region) => {
    const sourceX = Math.round(width * region.x);
    const sourceY = Math.round(height * region.y);
    const sourceW = Math.max(1, Math.round(width * region.w));
    const sourceH = Math.max(1, Math.round(height * region.h));
    const scale = Math.min(3, Math.max(2, 1800 / Math.max(sourceW, sourceH)));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sourceW * scale);
    canvas.height = Math.round(sourceH * scale);

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Image processing is not supported by this browser.");

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Increase contrast and convert to grayscale to help read small stamped text.
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const gray =
        0.299 * pixels[i] +
        0.587 * pixels[i + 1] +
        0.114 * pixels[i + 2];

      const enhanced = Math.max(0, Math.min(255, (gray - 115) * 1.65 + 128));
      pixels[i] = enhanced;
      pixels[i + 1] = enhanced;
      pixels[i + 2] = enhanced;
    }

    context.putImageData(imageData, 0, 0);
    return { name: region.name, canvas };
  });
}

export default function SmartAIScanner({ onClose, onSave }) {
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState("");
  const [dateResult, setDateResult] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "Other",
    quantity: "1",
    unit: "pieces",
    purchaseDate: today(),
    expiryDate: "",
    storageLocation: "Refrigerator",
    barcode: "",
  });

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Always release the webcam when the scanner unmounts.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((cameraError) => {
        console.error("Camera preview failed:", cameraError);
        setError("Camera opened, but preview could not start. Check browser permissions.");
      });
    }
  }, [cameraOpen]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function openCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Live camera is unavailable. Open FoodGuard on localhost or HTTPS in a supported browser.");
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch (cameraError) {
      console.error("Unable to open camera:", cameraError);
      if (cameraError.name === "NotAllowedError" || cameraError.name === "PermissionDeniedError") {
        setError("Camera permission was denied. Click the site icon beside localhost:5173, open Site settings, and allow Camera.");
      } else if (cameraError.name === "NotFoundError" || cameraError.name === "DevicesNotFoundError") {
        setError("No camera was found on this device. You can still upload a package photo.");
      } else if (cameraError.name === "NotReadableError" || cameraError.name === "TrackStartError") {
        setError("The camera may be in use by another app. Close other camera apps and try again.");
      } else {
        setError(cameraError.message || "Could not open the camera. Try uploading an image instead.");
      }
    }
  }

  function captureCameraPhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Camera is still starting. Wait a moment and try Capture again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Could not capture the camera image. Please try again.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not create the photo. Please try again.");
        return;
      }
      const capturedFile = new File([blob], `foodguard-${Date.now()}.jpg`, { type: "image/jpeg" });
      stopCamera();
      chooseFile(capturedFile);
    }, "image/jpeg", 0.92);
  }

  const expiryFound = useMemo(
    () => Boolean(form.expiryDate),
    [form.expiryDate]
  );

  function chooseFile(selected) {
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    setPreview(URL.createObjectURL(selected));
    setFile(selected);
    setRawText("");
    setDateResult(null);
    setError("");
    setProgress(0);
    setForm((current) => ({ ...current, expiryDate: "" }));
  }

  async function runOCR() {
    if (!file || loading) return;

    let worker;

    setLoading(true);
    setError("");
    setProgress(0);
    setRawText("");
    setDateResult(null);

    try {
      const image = await loadImage(file);
      const regions = makeOCRRegions(image);

      let activeRegion = 0;

      worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            const value = Math.round(
              ((activeRegion + message.progress) / regions.length) * 95
            );
            setProgress(Math.min(95, value));
          }
        },
      });

      const regionTexts = [];

      for (let index = 0; index < regions.length; index += 1) {
        activeRegion = index;
        const region = regions[index];
        const result = await worker.recognize(region.canvas);
        const recognized = result?.data?.text?.trim() || "";

        if (recognized) {
          regionTexts.push(`--- ${region.name} ---\n${recognized}`);
        }

        setProgress(Math.round(((index + 1) / regions.length) * 95));
      }

      const combinedText = regionTexts.join("\n\n").trim();

      if (!combinedText) {
        throw new Error(
          "No readable text found. Take a closer photo with the printed coding area in focus."
        );
      }

      setRawText(combinedText);

      const parsedDates = parsePackageDates(combinedText);
      const lines = combinedText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 2);

      const likelyName =
        lines.find(
          (line) =>
            !/(EXP|EXPIRY|BEST BEFORE|MFG|MFD|MANUFACTUR|BATCH|NET WT|INGREDIENTS|NUTRITION|MRP|BARCODE|CONTAINS|PROTEIN|CARBOHYDRATE|ADDRESS|CUSTOMER CARE)/i.test(
              line
            ) &&
            line.length < 45 &&
            /[a-z]{3,}/i.test(line)
        ) || "";

      setDateResult(parsedDates);

      setForm((current) => ({
        ...current,
        name: current.name || likelyName,
        category: current.name
          ? current.category
          : guessCategory(likelyName),
        expiryDate: current.expiryDate || parsedDates.expiryDate,
      }));

      if (!parsedDates.expiryDate) {
        setError(
          "Text was read, but no reliable expiry date was found. Try a closer photo of the printed coding area or enter the date manually."
        );
      }
    } catch (err) {
      setError(err.message || "Could not read this image. Please try again.");
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setProgress(100);
      setLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Confirm the product name before saving.");
      return;
    }

    if (!form.expiryDate) {
      setError("Enter the expiry date. We never guess missing dates.");
      return;
    }

    if (form.expiryDate < today()) {
      const confirmed = window.confirm(
        "This expiry date is in the past. Save this item as expired?"
      );
      if (!confirmed) return;
    }

    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const extractionNote = dateResult
        ? `Expiry extraction: ${dateResult.method}; confidence=${dateResult.confidence}; precision=${dateResult.precision}; evidence=${dateResult.evidence}`
        : "";

      const ocrNote = rawText
        ? `OCR review: ${rawText.slice(0, 300)}`
        : "";

      await onSave({
        ...form,
        name: form.name.trim(),
        quantity,
        expiryDate: form.expiryDate,
        notes: [ocrNote, extractionNote].filter(Boolean).join(" | "),
      });
    } catch (err) {
      setError(err.message || "Could not save this item.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-emerald-900/70 bg-[#091E18] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-400";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
      <div className="my-auto max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-emerald-400/20 bg-[#0B211B] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-emerald-900/50 bg-[#0B211B] px-5 py-4 sm:px-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
              <ScanLine className="text-cyan-300" />
              Smart AI Scanner
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Scan, review and confirm before adding to inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { stopCamera(); onClose?.(); }}
            className="rounded-xl border border-emerald-900/60 p-2 text-slate-300 hover:bg-emerald-950/50"
            aria-label="Close scanner"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-400/30 bg-cyan-400/5 p-4 text-center">
              {cameraOpen ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="max-h-56 w-full rounded-xl object-contain"
                />
              ) : preview ? (
                <img
                  src={preview}
                  alt="Food package preview"
                  className="max-h-56 rounded-xl object-contain"
                />
              ) : (
                <>
                  <Camera size={38} className="mb-3 text-cyan-300" />
                  <p className="text-sm font-semibold text-slate-200">
                    Take a photo or upload package
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Keep product name and expiry label clear.
                  </p>
                </>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {!cameraOpen ? (
                  <>
                    <button
                      type="button"
                      onClick={openCamera}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10"
                    >
                      <Camera size={15} />
                      Open camera
                    </button>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10"
                    >
                      <Upload size={15} />
                      Upload image
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={captureCameraPhoto}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
                    >
                      <Camera size={15} />
                      Capture photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-xl border border-emerald-900/60 px-3 py-2 text-xs text-slate-300"
                    >
                      Stop camera
                    </button>
                  </>
                )}

                {file && !cameraOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setFile(null);
                      setPreview("");
                      setRawText("");
                      setDateResult(null);
                      setProgress(0);
                      setError("");
                      setForm((current) => ({ ...current, expiryDate: "" }));
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="rounded-xl border border-emerald-900/60 px-3 py-2 text-xs text-slate-300"
                  >
                    Clear image
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-900/50 bg-[#081C16] p-4">
              <h3 className="font-semibold text-slate-100">
                Package text recognition
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                FoodGuard reads the full image and enlarged package regions.
                OCR can make mistakes, so verify every field before saving.
              </p>

              <button
                type="button"
                onClick={runOCR}
                disabled={!file || loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Reading package {progress}%
                  </>
                ) : (
                  <>
                    <ScanLine size={16} />
                    Extract package details
                  </>
                )}
              </button>

              {loading && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-cyan-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {rawText && (
                <div className="mt-3 max-h-36 overflow-y-auto rounded-xl bg-black/20 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Raw OCR text from image regions
                  </p>
                  <pre className="whitespace-pre-wrap break-words text-xs text-slate-300">
                    {rawText}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-100">
              {error}
            </div>
          )}

          {dateResult && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs text-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-cyan-200">Expiry interpretation</strong>
                <span
                  className={`rounded-full px-2 py-1 ${
                    dateResult.confidence === "high"
                      ? "bg-emerald-400/10 text-emerald-200"
                      : "bg-amber-400/10 text-amber-200"
                  }`}
                >
                  {dateResult.confidence} confidence · {dateResult.precision} precision
                </span>
              </div>
              <p className="mt-2">{dateResult.method}</p>
              {dateResult.manufacturingDate && (
                <p className="mt-1">
                  Manufacturing month: {dateResult.manufacturingDate.slice(0, 7)}
                </p>
              )}
              {dateResult.expiryDate && (
                <p className="mt-1">
                  Expiry month/date:{" "}
                  {dateResult.precision === "month"
                    ? dateResult.expiryDate.slice(0, 7)
                    : dateResult.expiryDate}
                </p>
              )}
              {dateResult.evidence && (
                <p className="mt-1 text-slate-400">
                  Package evidence: “{dateResult.evidence}”
                </p>
              )}
              {dateResult.precision === "month" && (
                <p className="mt-2 text-amber-200">
                  The inventory stores the final day of the printed expiry month
                  because its current date field requires a full date. Verify
                  the month before saving.
                </p>
              )}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-100">
                Review inventory details
              </h3>
              <span className="text-[11px] text-slate-500">
                All details are editable
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs text-slate-400">
                Product name *
                <input
                  required
                  maxLength={100}
                  className={fieldClass}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Milk"
                />
              </label>

              <label className="space-y-1.5 text-xs text-slate-400">
                Brand
                <input
                  maxLength={100}
                  className={fieldClass}
                  value={form.brand}
                  onChange={(event) =>
                    setForm({ ...form, brand: event.target.value })
                  }
                  placeholder="Optional brand"
                />
              </label>

              <label className="space-y-1.5 text-xs text-slate-400">
                Category
                <select
                  className={fieldClass}
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  {[
                    "Vegetables",
                    "Fruits",
                    "Dairy",
                    "Bakery",
                    "Meat",
                    "Seafood",
                    "Grains",
                    "Beverages",
                    "Frozen",
                    "Other",
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-xs text-slate-400">
                Quantity *
                <input
                  required
                  type="number"
                  min="0.01"
                  step="any"
                  className={fieldClass}
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: event.target.value })
                  }
                />
              </label>

              <label className="space-y-1.5 text-xs text-slate-400">
                Unit
                <select
                  className={fieldClass}
                  value={form.unit}
                  onChange={(event) =>
                    setForm({ ...form, unit: event.target.value })
                  }
                >
                  {["pieces", "kg", "g", "litres", "ml", "packets", "dozen"].map(
                    (item) => (
                      <option key={item}>{item}</option>
                    )
                  )}
                </select>
              </label>

              <label className="space-y-1.5 text-xs text-slate-400">
                Purchase date
                <input
                  type="date"
                  className={fieldClass}
                  value={form.purchaseDate}
                  onChange={(event) =>
                    setForm({ ...form, purchaseDate: event.target.value })
                  }
                />
              </label>

              <label className="space-y-1.5 text-xs text-slate-400">
                Expiry date *
                <input
                  required
                  type="date"
                  className={`${fieldClass} ${
                    expiryFound
                      ? "border-emerald-500/50"
                      : "border-amber-500/40"
                  }`}
                  value={form.expiryDate}
                  onChange={(event) =>
                    setForm({ ...form, expiryDate: event.target.value })
                  }
                />
                <span className="block text-[10px] text-slate-500">
                  {expiryFound
                    ? "Date detected or confirmed — verify against package."
                    : "No reliable full date detected. Enter it manually."}
                </span>
              </label>

              <label className="space-y-1.5 text-xs text-slate-400">
                Storage location
                <select
                  className={fieldClass}
                  value={form.storageLocation}
                  onChange={(event) =>
                    setForm({ ...form, storageLocation: event.target.value })
                  }
                >
                  {[
                    "Refrigerator",
                    "Freezer",
                    "Pantry",
                    "Kitchen shelf",
                    "Other",
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-emerald-900/50 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-emerald-900/60 px-5 py-3 text-sm font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm and add to inventory
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
