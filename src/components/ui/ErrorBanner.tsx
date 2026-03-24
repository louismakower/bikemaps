"use client";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
      <span className="mt-0.5 shrink-0">⚠️</span>
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-red-500 hover:text-red-700"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
