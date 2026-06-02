"use client";

type LoadingOverlayProps = {
  isOpen: boolean;
  message?: string;
};

export default function LoadingOverlay({
  isOpen,
  message = "\uCC98\uB9AC \uC911\uC785\uB2C8\uB2E4...",
}: LoadingOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="flex w-[280px] flex-col items-center rounded-2xl bg-white px-6 py-7 shadow-xl">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-500" />

        <p className="text-center text-base font-semibold text-gray-800">
          {message}
        </p>

        <p className="mt-2 text-center text-sm text-gray-500">
          {"\uC7A0\uC2DC\uB9CC \uAE30\uB2E4\uB824\uC8FC\uC138\uC694."}
        </p>
      </div>
    </div>
  );
}
