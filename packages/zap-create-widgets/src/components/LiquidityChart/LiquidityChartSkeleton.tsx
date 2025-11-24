const BAR_COUNT = 22;
const barHeights = [5, 10, 15, 30, 45, 55, 60, 70, 85, 90, 100, 100, 80, 75, 55, 60, 30, 30, 25, 15, 10, 5];
const barColors = ['bg-layer2', 'bg-layer2'];

export default function LiquidityChartSkeleton() {
  return (
    <div className="w-full h-[180px] pt-2 mt-4 relative rounded-md flex flex-col justify-end overflow-hidden">
      {/* Axis */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-layer2 z-[1]" />
      {/* Bars */}
      <div className="flex justify-center items-end gap-[2px] h-full w-full px-2 pb-1 z-[2]">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 min-w-1 max-w-2 ${barColors[i % 2]} rounded-t-sm relative overflow-hidden flex items-end`}
            style={{ height: `${barHeights[i]}%` }}
          >
            <div
              className="absolute top-0 left-0 w-full h-full opacity-60 animate-[shimmer_1.8s_linear_infinite]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 50%, transparent 100%)',
                zIndex: 2,
                animationName: 'shimmer',
              }}
            />
          </div>
        ))}
      </div>
      {/* Shimmer keyframes */}
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
}
