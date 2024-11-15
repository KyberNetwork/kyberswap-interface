import { useState } from "react";
import { useZapState } from "@/hooks/useZapInState";
import { cn } from "@kyber/utils/tailwind-helpers";
import AlertIcon from "@/assets/alert.svg";

export const parseSlippageInput = (str: string): number =>
  Math.round(Number.parseFloat(str) * 100);

export const validateSlippageInput = (
  str: string
): { isValid: boolean; message?: string } => {
  if (str === "") {
    return {
      isValid: true,
    };
  }

  const numberRegex = /^(\d+)\.?(\d{1,2})?$/;
  if (!str.match(numberRegex)) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    };
  }

  const rawSlippage = parseSlippageInput(str);

  if (Number.isNaN(rawSlippage)) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    };
  }

  if (rawSlippage < 0) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    };
  } else if (rawSlippage < 50) {
    return {
      isValid: true,
      message: `Your transaction may fail`,
    };
  } else if (rawSlippage > 5000) {
    return {
      isValid: false,
      message: `Enter a smaller slippage percentage`,
    };
  } else if (rawSlippage > 500) {
    return {
      isValid: true,
      message: `Your transaction may be frontrun`,
    };
  }

  return {
    isValid: true,
  };
};

const SlippageInput = () => {
  const { slippage, setSlippage } = useZapState();
  const [v, setV] = useState(() => {
    if ([5, 10, 50, 100].includes(slippage)) return "";
    return ((slippage * 100) / 10_000).toString();
  });

  const { isValid, message } = validateSlippageInput(v);

  const handleCustomSlippageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (value === "") {
      setV(value);
      setSlippage(10);
      return;
    }

    const numberRegex = /^(\d+)\.?(\d{1,2})?$/;
    if (!value.match(numberRegex)) {
      e.preventDefault();
      return;
    }
    const res = validateSlippageInput(value);

    if (res.isValid) {
      const parsedValue = parseSlippageInput(value);
      setSlippage(parsedValue);
    } else setSlippage(10);
    setV(value);
  };
  const onCustomSlippageBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!e.currentTarget.value) setSlippage(10);
    else if (isValid) setSlippage(parseSlippageInput(e.currentTarget.value));
  };

  return (
    <>
      <div className="flex gap-2 w-full">
        <div
          className="rounded-md mt-[10px] bg-inputBackground border border-inputBackground flex flex-1 h-10"
          style={{ boxShadow: "0 2px 0 -1px #0000000f inset" }}
        >
          {[5, 10, 50, 100].map((item) => (
            <div
              className="rounded-[15px] text-subText text-sm px-[6px] font-semibold flex flex-1 border border-transparent items-center gap-2 justify-center cursor-pointer box-border data-[active='true']:text-textReverse data-[active='true']:bg-textSecondary"
              data-active={item === slippage}
              role="button"
              onClick={() => setSlippage(item)}
              key={item}
            >
              {(item * 100) / 10_000}%
            </div>
          ))}
        </div>

        <div
          className="rounded-md mt-[10px] bg-inputBackground border border-inputBackground h-10 flex flex-1 w-[100px] data-[error='true']:border-[var(--ks-lw-error)] data-[warning='true']:border-warning"
          style={{ boxShadow: "0 2px 0 -1px #0000000f inset" }}
          data-error={!!message && !isValid}
          data-warning={!!message && isValid}
        >
          <div className="relative rounded-[15px] text-subText text-sm px-[6px] font-semibold flex flex-1 border border-transparent items-center gap-2 justify-center cursor-pointer box-border w-[72px]">
            {message && (
              <AlertIcon
                className={cn(
                  "absolute top-2 left-1 w-4 h-3",
                  isValid ? "text-warning" : "text-[var(--ks-lw-error)]"
                )}
              />
            )}
            <input
              className="bg-inputBackground text-[var(--ks-lw-text)] font-semibold border-none outline-none text-right w-full text-base p-0"
              placeholder="Custom"
              onBlur={onCustomSlippageBlur}
              onChange={handleCustomSlippageChange}
              pattern="/^(\d+)\.?(\d{1,2})?$/"
              value={v}
            />
            <span>%</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={cn(
            "text-xs text-left mt-1",
            isValid ? "text-warning" : "text-[var(--ks-lw-error)]"
          )}
        >
          {message}
        </div>
      )}
    </>
  );
};

export default SlippageInput;
