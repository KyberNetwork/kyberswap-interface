import { cn } from "@kyber/utils/tailwind-helpers";
import { MouseoverTooltip } from "./Tooltip";

export const SlippageWarning = ({
  slippage,
  suggestedSlippage,
  className,
  showWarning,
}: {
  slippage: number;
  suggestedSlippage: number;
  className?: string;
  showWarning: boolean;
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between mt-2 text-sm",
        className
      )}
    >
      <MouseoverTooltip
        text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
        width="220px"
      >
        <div
          className={cn(
            "text-subText text-xs border-b border-dotted border-subText",
            showWarning &&
              (slippage > 2 * suggestedSlippage ||
                slippage < suggestedSlippage / 2)
              ? "text-warning border-warning"
              : ""
          )}
        >
          Max Slippage
        </div>
      </MouseoverTooltip>
      <MouseoverTooltip
        text={
          !showWarning
            ? ""
            : slippage > 2 * suggestedSlippage
            ? "Your slippage is set higher than usual, which may cause unexpected losses."
            : slippage < suggestedSlippage / 2
            ? "Your slippage is set lower than usual, increasing the risk of transaction failure."
            : ""
        }
        width="220px"
      >
        <span
          className={`font-medium ${
            showWarning &&
            (slippage > 2 * suggestedSlippage ||
              slippage < suggestedSlippage / 2)
              ? "text-warning border-b border-warning border-dotted"
              : "text-text"
          }`}
        >
          {((slippage * 100) / 10_000).toFixed(2)}%
        </span>
      </MouseoverTooltip>
    </div>
  );
};
