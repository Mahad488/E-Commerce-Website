import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AlertCircle, ImageOff, ImagePlus, Link2, Loader2, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { getImageUrl } from "../../src/lib/catalog";
import {
  ACCEPTED_IMAGE_TYPES,
  checkImageFile,
  isUploadedImage,
  uploadProductImage,
  UploadCancelledError,
  type ImageUpload,
} from "./uploadImage";

interface ImageUploaderProps {
  /** The stored image: an uploaded path ("/uploads/…") or a pasted https URL. */
  value: string;
  onChange: (url: string) => void;
  /** What the photo is for, e.g. "Product photo". Read out by screen readers. */
  label: string;
  /** Smaller layout for colour-variant rows. */
  compact?: boolean;
  /** Called with true when an upload starts and false when it ends, so a form can wait for it. */
  onBusyChange?: (busy: boolean) => void;
}

interface ActiveUpload {
  preview: string;
  progress: number;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flare";
const controlButton = `inline-flex h-9 items-center gap-1.5 rounded-control border px-3 text-xs font-semibold transition-colors ${focusRing}`;
const secondaryButton = `${controlButton} border-line-strong bg-surface text-ink hover:bg-porcelain`;
const dangerButton = `${controlButton} border-error bg-surface text-error hover:bg-error-tint`;
const linkButton = `inline-flex items-center gap-1 rounded-tag text-xs font-semibold text-muted underline-offset-2 hover:text-ink hover:underline ${focusRing}`;

export default function ImageUploader({ value, onChange, label, compact = false, onBusyChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<ImageUpload | null>(null);
  const dragDepth = useRef(0);
  const onBusyChangeRef = useRef(onBusyChange);
  const urlInputId = useId();

  const [mode, setMode] = useState<"file" | "url">("file");
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState<ActiveUpload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);

  useEffect(() => {
    onBusyChangeRef.current = onBusyChange;
  });

  // Closing the form mid-upload cancels the request.
  useEffect(() => {
    const upload = uploadRef;
    return () => upload.current?.abort();
  }, []);

  const startUpload = async (file: File) => {
    if (uploadRef.current) return;
    const problem = checkImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }

    const preview = URL.createObjectURL(file);
    const upload = uploadProductImage(file, (progress) => setActive({ preview, progress }));
    uploadRef.current = upload;
    setError(null);
    setActive({ preview, progress: 0 });
    setAnnouncement("Uploading photo");
    onBusyChangeRef.current?.(true);

    try {
      const url = await upload.done;
      onChange(url);
      setMode("file");
      setAnnouncement("Photo uploaded");
    } catch (err) {
      const cancelled = err instanceof UploadCancelledError;
      if (!cancelled) setError(err instanceof Error ? err.message : "The upload failed. Try again.");
      setAnnouncement(cancelled ? "Upload cancelled" : "");
    } finally {
      uploadRef.current = null;
      URL.revokeObjectURL(preview);
      setActive(null);
      onBusyChangeRef.current?.(false);
    }
  };

  const pickFile = () => fileInputRef.current?.click();

  const handleFilePicked = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void startUpload(file);
  };

  const handleRemove = () => {
    onChange("");
    setError(null);
    setAnnouncement("Photo removed");
  };

  const toggleMode = () => {
    setMode((current) => (current === "url" ? "file" : "url"));
    setError(null);
  };

  const hasFiles = (event: DragEvent<HTMLDivElement>) => event.dataTransfer.types.includes("Files");
  const dropTarget = {
    onDragEnter: (event: DragEvent<HTMLDivElement>) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = active ? "none" : "copy";
    },
    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
      if (!hasFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) void startUpload(file);
    },
  };

  const showDrop = dragging && !active;
  const labelInSentence = label.charAt(0).toLowerCase() + label.slice(1);
  const shownSrc = active ? active.preview : value ? getImageUrl(value) : "";
  const broken = !active && shownSrc !== "" && brokenSrc === shownSrc;
  const tile = (
    <PhotoTile
      src={shownSrc}
      broken={broken}
      uploading={!!active}
      onBroken={() => setBrokenSrc(shownSrc)}
      size={compact ? "h-14 w-14" : "h-24 w-24"}
    />
  );

  const statusText = active
    ? `Uploading… ${active.progress}%`
    : showDrop
    ? value
      ? "Drop to replace the photo"
      : "Drop to upload"
    : broken
    ? "This image can't be loaded. Check the link or upload a file."
    : value
    ? isUploadedImage(value)
      ? "Uploaded photo"
      : "Photo from a link"
    : "No photo yet";

  let body;
  if (mode === "url") {
    body = (
      <div className="flex items-center gap-3">
        {tile}
        <div className="min-w-0 flex-1">
          <label htmlFor={urlInputId} className="sr-only">
            {label} link
          </label>
          <input
            id={urlInputId}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://images.unsplash.com/photo-…"
            value={value}
            onChange={(event) => onChange(event.target.value.trim())}
            className="h-10 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flare"
          />
          {broken && <p className="mt-1 text-xs text-muted">{statusText}</p>}
        </div>
      </div>
    );
  } else if (!value && !active && !compact) {
    body = (
      <div
        {...dropTarget}
        className={`rounded-tile border-2 border-dashed transition-colors ${
          showDrop ? "border-flare bg-flare-tint" : "border-line-strong bg-surface hover:bg-porcelain"
        }`}
      >
        <button
          type="button"
          onClick={pickFile}
          className={`flex w-full flex-col items-center gap-2 rounded-tile px-4 py-8 text-center ${focusRing}`}
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              showDrop ? "bg-flare text-white" : "bg-well text-ink"
            }`}
          >
            <Upload size={20} aria-hidden />
          </span>
          <span className="text-sm font-semibold text-ink">
            {showDrop ? (
              "Drop to upload"
            ) : (
              <>
                Drag a photo here or <span className="text-flare-press underline underline-offset-2">choose a file</span>
              </>
            )}
          </span>
          <span className="text-xs text-muted">JPEG, PNG or WebP, up to 3 MB</span>
          <span className="sr-only">{label}</span>
        </button>
      </div>
    );
  } else {
    body = (
      <div
        {...dropTarget}
        className={`flex items-center gap-3 rounded-tile border-2 border-dashed transition-colors ${compact ? "p-1" : "p-2"} ${
          showDrop ? "border-flare bg-flare-tint" : compact ? "border-transparent" : "border-line bg-surface"
        }`}
      >
        <button
          type="button"
          onClick={pickFile}
          disabled={!!active}
          aria-label={`${value ? "Change" : "Upload"} ${labelInSentence}`}
          className={`rounded-control ${focusRing}`}
        >
          {tile}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ink tabular-nums">{statusText}</p>
          {value && !active && !compact && (
            <p className="truncate text-xs text-muted" title={value}>
              {value}
            </p>
          )}
          {active && (
            <span
              role="progressbar"
              aria-label={`Uploading ${labelInSentence}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={active.progress}
              className="mt-1.5 block h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-well"
            >
              <span
                className="block h-full origin-left bg-ink transition-transform duration-150 ease-nova-out"
                style={{ transform: `scaleX(${active.progress / 100})` }}
              />
            </span>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {active ? (
              <button type="button" onClick={() => uploadRef.current?.abort()} className={secondaryButton}>
                <X size={14} aria-hidden /> Cancel
              </button>
            ) : (
              <>
                <button type="button" onClick={pickFile} className={secondaryButton}>
                  {value ? <RefreshCw size={14} aria-hidden /> : <ImagePlus size={14} aria-hidden />}
                  {value ? "Change" : "Choose file"}
                </button>
                {value && (
                  <button type="button" onClick={handleRemove} className={dangerButton}>
                    <Trash2 size={14} aria-hidden /> Remove
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        tabIndex={-1}
        onChange={handleFilePicked}
      />
      {body}
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-error">
          <AlertCircle size={14} className="mt-px shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {!active && (
        <button type="button" onClick={toggleMode} className={linkButton}>
          {mode === "url" ? <Upload size={12} aria-hidden /> : <Link2 size={12} aria-hidden />}
          {mode === "url" ? "Upload a file instead" : "Or paste image URL instead"}
        </button>
      )}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}

interface PhotoTileProps {
  src: string;
  broken: boolean;
  uploading: boolean;
  onBroken: () => void;
  size: string;
}

function PhotoTile({ src, broken, uploading, onBroken, size }: PhotoTileProps) {
  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-control bg-well text-muted ${size}`}>
      {!src ? (
        <ImagePlus size={20} aria-hidden />
      ) : broken ? (
        <ImageOff size={20} aria-hidden />
      ) : (
        <img src={src} alt="" onError={onBroken} className={`h-full w-full object-cover ${uploading ? "opacity-40" : ""}`} />
      )}
      {uploading && (
        <span className="absolute inset-0 flex items-center justify-center text-ink">
          <Loader2 size={20} className="motion-safe:animate-spin" aria-hidden />
        </span>
      )}
    </span>
  );
}
