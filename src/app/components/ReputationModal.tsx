type Props = {
  score: number;
  onClose: () => void;
};

export default function ReputationModal({ score, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-md">
        <h2 className="text-xl font-bold mb-4">평판 점수</h2>

        <div className="mb-4">
          <div className="w-full h-4 bg-gray-200 rounded-full">
            <div
              className="h-4 bg-green-500 rounded-full"
              style={{
                width: `${score}%`,
              }}
            />
          </div>
          <p className="mt-2 text-center font-bold">{score}점</p>
        </div>

        <div className="space-y-2 text-sm">
          <p>🏆 약속왕 (81~100)</p>
          <p>✨ 우수함 (61~80)</p>
          <p>🙂 일반 (41~60)</p>
          <p>⚠️ 주의 필요 (21~40)</p>
          <p>🚨 노쇼왕 (0~20)</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-2 rounded-lg bg-[#566F2F] text-white"
        >
          닫기
        </button>
      </div>
    </div>
  );
}