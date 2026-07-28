import type { ReactNode } from "react";

import { cn } from "@kyber/utils/tailwind-helpers";

// Faux browser chrome that dresses the iframe as "a partner site framing KyberSwap". The address
// bar shows the embedder origin — the value KyberSwap receives as the Referer.
const BrowserFrame = ({
  address,
  className,
  children,
}: {
  address: string;
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "w-full max-w-[460px] overflow-hidden rounded-2xl border border-white/10 bg-[#151515] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="flex shrink-0 gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-black/40 px-3 py-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="shrink-0 text-subText">
            <path
              d="M6 10V8a6 6 0 1 1 12 0v2m-13 0h14v10H5V10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <span className="truncate text-xs text-subText">{address}</span>
        </div>
      </div>
      {children}
    </div>
  );
};

export default BrowserFrame;
