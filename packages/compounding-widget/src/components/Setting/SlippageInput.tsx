import { useState } from 'react';

import { t } from '@lingui/macro';

import AlertIcon from '@/assets/svg/alert.svg';
import { parseSlippageInput, validateSlippageInput } from '@/components/Setting/utils';
import { useZapState } from '@/hooks/useZapState';

const SlippageInput = () => {
  const { slippage, setSlippage, setManualSlippage, zapInfo } = useZapState();
  const [v, setV] = useState(() => {
    if ([5, 10, 50, 100].includes(slippage)) return '';
    return ((slippage * 100) / 10_000).toString();
  });

  const suggestedSlippage = zapInfo?.zapDetails.suggestedSlippage || 100;

  const [isFocus, setIsFocus] = useState(false);
  const { isValid, message } = validateSlippageInput(v, suggestedSlippage);
  const { message: slpWarning } = validateSlippageInput(((slippage * 100) / 10_000).toString(), suggestedSlippage);

  const onCustomSlippageFocus = () => setIsFocus(true);

  const onCustomSlippageBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocus(false);
    if (!e.currentTarget.value) setSlippage(10);
    else if (isValid) {
      setSlippage(parseSlippageInput(e.currentTarget.value));
      setManualSlippage(true);
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

  return (
    <>
      <div className="rounded-full mt-2 bg-layer1 p-1 flex gap-[2px]">
        {[5, 10, 50, 100].map(item => (
          <div
            className="relative border rounded-full text-subText text-sm p-1 font-medium w-12 flex border-solid border-transparent items-center gap-1 justify-center cursor-pointer hover:border-accent data-[active='true']:text-text data-[active='true']:border-accent"
            data-active={item === slippage}
            role="button"
            onClick={() => {
              setSlippage(item);
              setManualSlippage(true);
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
          data-active={![5, 10, 50, 100].includes(slippage)}
          data-error={!!message && !isValid}
          data-warning={zapInfo && !!message && isValid}
          data-focus={isFocus}
          style={{ flex: 3 }}
        >
          {zapInfo && message && (
            <AlertIcon className={`absolute top-[5px] left-1 w-4 h-4 ${isValid ? 'text-warning' : 'text-error'}`} />
          )}
          <input
            className="bg-layer1 border-none outline-none text-right text-text w-full text-xs p-0 focus:bg-layer1"
            data-active={![5, 10, 50, 100].includes(slippage)}
            placeholder={t`Custom`}
            onFocus={onCustomSlippageFocus}
            onBlur={onCustomSlippageBlur}
            value={v}
            onChange={onCustomSlippageChange}
            pattern="/^(\d+)\.?(\d{1,2})?$/"
          />
          <span>%</span>
        </div>
      </div>
      {zapInfo && (message || slippage) && (
        <div className={`text-xs text-left mt-1 max-w-[280px] ${isValid ? 'text-warning' : 'text-error'}`}>
          {message || slpWarning}
        </div>
      )}
    </>
  );
};

export default SlippageInput;
