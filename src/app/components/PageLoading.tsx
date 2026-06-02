type PageLoadingProps = {
  message?: string;
  bottomPadding?: "default" | "seller" | "none";
};

const paddingByType = {
  default: "pb-20",
  seller: "pb-24",
  none: "",
};

export default function PageLoading({
  message = "濡쒕뵫 以묒엯?덈떎.",
  bottomPadding = "default",
}: PageLoadingProps) {
  return (
    <div
      className={`min-h-screen p-4 ${paddingByType[bottomPadding]} flex items-center justify-center`}
    >
      <div className="flex flex-col items-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-500" />
        <p className="text-center text-sm font-medium text-gray-500">
          {message}
        </p>
      </div>
    </div>
  );
}
