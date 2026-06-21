"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Live room error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="bg-red-900/50 p-6 rounded-2xl border border-red-500 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">發生未預期的錯誤</h2>
        <p className="text-red-200 mb-4 break-all">
          {error.message || "未知錯誤"}
        </p>
        <div className="bg-black/50 p-4 rounded text-xs text-gray-300 font-mono mb-6 overflow-auto max-h-40">
          {error.stack || "無錯誤堆疊追蹤"}
        </div>
        <button
          onClick={() => reset()}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full transition-colors"
        >
          嘗試重新載入
        </button>
      </div>
    </div>
  );
}
