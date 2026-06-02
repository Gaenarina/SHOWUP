type Props = {
  score: number;
  onClose: () => void;
};

export function ReputationGauge({ score }: { score: number }) {
  const position = Math.min(100, Math.max(0, score));

  const emotion = (() => {
    if (score <= 20) return "😡";
    if (score <= 40) return "😠";
    if (score <= 60) return "😐";
    if (score <= 80) return "🙂";
    return "😆";
  })();

  return (
    <div className="w-full p-4">

      {/* 🔥 relative 컨테이너 */}
      <div className="relative w-full h-10">

        {/* 1️⃣ 그래프 바 (아래 레이어) */}
        <div
          className="absolute top-1/2 left-0 w-full h-6 rounded-full -translate-y-1/2"
          style={{
            background:
              "linear-gradient(to right, #ef4444, #facc15, #60a5fa)",
          }}
        />

        {/* 2️⃣ 이모지 (위 레이어) */}
        <div
          className="absolute top-1/2 text-2xl z-10"
          style={{
            left: `${position}%`,
            transform: "translate(-50%, -50%)",
            transition: "left 0.3s ease",
          }}
        >
          {emotion}
        </div>
      </div>

      <p className="text-center text-sm text-gray-600 mt-3">
        현재 평판: {score}점
      </p>
    </div>
  );
}
// 2️⃣ 메인 평판 모달 컴포넌트
export function ReputationModal({ score, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-2">평판 점수</h2>

        {/* 기존 단색 바 코드를 제거하고 새 게이지 컴포넌트 적용 */}
        <ReputationGauge score={score} />

        {/* 등급 기준 안내 점수판 */}
        <div className="space-y-2 text-sm border-t pt-4 mt-2 text-gray-700">
          <p>😆 약속왕 (81~100)</p>
          <p>🙂 우수함 (61~80)</p>
          <p>😐 일반 (41~60)</p>
          <p>😠 주의 필요 (21~40)</p>
          <p>😡 노쇼왕 (0~20)</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-2 rounded-lg bg-[#566F2F] text-white font-medium hover:bg-[#455924] transition"
        >
          닫기
        </button>
      </div>
    </div>
  );
}