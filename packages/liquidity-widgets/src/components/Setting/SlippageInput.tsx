import { useEffect, useState } from 'react';

import { MouseoverTooltip } from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import AlertIcon from '@/assets/svg/alert.svg';
import { parseSlippageInput, validateSlippageInput } from '@/components/Setting/utils';
import { getSlippageStorageKey } from '@/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

const SlippageInput = ({
  className,
  inputClassName,
  suggestionClassName,
}: {
  className?: string;
  inputClassName?: string;
  suggestionClassName?: string;
}) => {
  const { slippage, setSlippage, zapInfo } = useZapState();
  const pool = usePoolStore(s => s.pool);
  const chainId = useWidgetStore(s => s.chainId);
  const [v, setV] = useState(() => {
    if (!slippage) return '';
    if ([5, 10, 50, 100].includes(slippage)) return '';
    return ((slippage * 100) / 10_000).toString();
  });

  const suggestedSlippage = zapInfo?.zapDetails.suggestedSlippage || 0;

  const [isFocus, setIsFocus] = useState(false);
  const { isValid, message } = validateSlippageInput(v, suggestedSlippage);
  const { message: slpWarning } = validateSlippageInput(
    slippage ? ((slippage * 100) / 10_000).toString() : '',
    suggestedSlippage,
  );

  const onCustomSlippageFocus = () => setIsFocus(true);

  const onCustomSlippageBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocus(false);
    if (!e.currentTarget.value) setSlippage(10);
    else if (isValid) {
      setSlippage(parseSlippageInput(e.currentTarget.value));
    }
  };

  const onCustomSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === '') {
      setV(value);
      setSlippage(10);
      return;
    }

    const numberRegex = /^(\d+)\.?(\d{1,2})?$/;
    if (!value.match(numberRegex)) {
      e.preventDefault();
      return;
    }

    const res = validateSlippageInput(value, suggestedSlippage);

    if (res.isValid) {
      const parsedValue = parseSlippageInput(value);
      setSlippage(parsedValue);
    } else {
      setSlippage(10);
    }
    setV(value);
  };

  useEffect(() => {
    if (pool !== 'loading' && slippage && suggestedSlippage > 0 && slippage !== suggestedSlippage) {
      try {
        const storageKey = getSlippageStorageKey(pool.token0.symbol, pool.token1.symbol, chainId, pool.fee);
        localStorage.setItem(storageKey, slippage.toString());
      } catch (error) {
        // Silently handle localStorage errors
        console.warn('Failed to save slippage to localStorage:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slippage, suggestedSlippage]);

  return (
    <>
      <div className={cn('rounded-full p-1 flex gap-[2px] bg-layer1', className)}>
        {[5, 10, 50, 100].map(item => (
          <div
            className="relative border rounded-full text-subText text-sm p-1 font-medium w-12 flex border-solid border-transparent items-center gap-1 justify-center cursor-pointer hover:border-accent data-[active='true']:text-text data-[active='true']:border-accent"
            data-active={item === slippage}
            role="button"
            onClick={() => {
              setSlippage(item);
              setV('');
            }}
            key={item}
            style={{ flex: 2 }}
          >
            {(item * 100) / 10_000}%
          </div>
        ))}

        <div
          className="relative border w-[72px] rounded-full text-subText text-sm p-1 font-medium flex border-solid border-transparent items-center gap-1 justify-center cursor-pointer hover:border-accent data-[active='true']:text-text data-[active='true']:border-accent data-[error='true']:border-error data-[warning='true']:border-warning data-[focus='true']:border-accent"
          data-active={slippage && ![5, 10, 50, 100].includes(slippage)}
          data-error={!!message && !isValid}
          data-warning={zapInfo && !!message && isValid}
          data-focus={isFocus}
          style={{ flex: 3 }}
        >
          {zapInfo && message && (
            <AlertIcon className={`absolute top-[5px] left-1 w-4 h-4 ${isValid ? 'text-warning' : 'text-error'}`} />
          )}
          <input
            className={cn(
              'bg-layer1 border-none outline-none text-right text-text w-full text-xs p-0 focus:bg-layer1',
              inputClassName,
            )}
            data-active={slippage && ![5, 10, 50, 100].includes(slippage)}
            placeholder="Custom"
            onFocus={onCustomSlippageFocus}
            onBlur={onCustomSlippageBlur}
            value={v}
            onChange={onCustomSlippageChange}
            pattern="/^(\d+)\.?(\d{1,2})?$/"
          />
          <span>%</span>
        </div>
      </div>
      {suggestedSlippage > 0 && slippage !== suggestedSlippage && (
        <div
          className={cn('flex items-center gap-1 mt-1 text-primary cursor-pointer text-sm', suggestionClassName)}
          onClick={() => {
            if (suggestedSlippage > 0) {
              setSlippage(suggestedSlippage);
              if (![5, 10, 50, 100].includes((suggestedSlippage * 100) / 10_000)) {
                setV(((suggestedSlippage * 100) / 10_000).toString());
              }
            }
          }}
        >
          <MouseoverTooltip text="Dynamic entry based on trading pair." width="fit-content" placement="bottom">
            <span className="border-b border-dotted border-primary">Suggestion</span>
          </MouseoverTooltip>
          <span>{((suggestedSlippage * 100) / 10_000).toFixed(2)}%</span>
        </div>
      )}
      {zapInfo && (message || slpWarning) && (
        <div
          className={`text-xs text-left w-full rounded-2xl px-3 py-2 mt-3 ${isValid ? 'text-warning bg-warning-200' : 'text-error bg-error-200'}`}
        >
          {message || slpWarning}
        </div>
      )}
    </>
  );
};

export default SlippageInput;
