import { useEffect, useMemo, useRef, useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { useOnClickOutside } from '@kyber/hooks';
import { MouseoverTooltip, Toggle } from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import X from '@/assets/svg/x.svg';
import Modal from '@/components/Modal';
import SlippageInput from '@/components/Setting/SlippageInput';
import { validateDeadlineString } from '@/components/Setting/utils';
import { useZapState } from '@/hooks/useZapState';

export default function Setting() {
  const { showSetting, ttl, setTtl, toggleSetting, degenMode, setDegenMode, highlightDegenMode } = useZapState();
  const ref = useRef(null);
  const [deadline, setDeadline] = useState(ttl);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirm, setConfirm] = useState('');

  const isValid = useMemo(() => validateDeadlineString(deadline.toString()), [deadline]);

  useEffect(() => {
    if (isValid) {
      setTtl(deadline);
    } else {
      setTtl(20);
    }
  }, [deadline, isValid, setTtl]);

  useOnClickOutside(ref, () => {
    if (showSetting) {
      if (!isValid) setDeadline(20);
      toggleSetting();
    }
  }, ['setting', 'ks-cw-modal-overlay', 'kyber-portal']);

  if (!showSetting) return null;

  return (
    <>
      <Modal isOpen={showConfirm}>
        <div>
          <div className="flex justify-between text-xl items-center font-medium">
            <div>
              <Trans>Are you sure?</Trans>
            </div>

            <X className="cursor-pointer" role="button" onClick={() => setShowConfirm(false)} />
          </div>

          <div className="text-sm text-subText mt-5">
            <Trans>
              Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can
              result in bad rates and loss of funds. Be cautious.
            </Trans>
          </div>

          <div className="text-sm text-subText mt-5">
            <Trans>
              Please type the word <span className="text-warning">Confirm</span> below to enable Degen Mode
            </Trans>
          </div>

          <input
            className="box-border mt-5 py-2 px-4 text-sm outline-none border-none w-full text-white bg-layer2 rounded-md"
            placeholder={t`Confirm`}
            value={confirm}
            onChange={e => {
              setConfirm(e.target.value.trim());
            }}
          />

          <div className="flex gap-4 mt-6">
            <button
              className="ks-outline-btn flex-1"
              onClick={() => {
                setShowConfirm(false);
                setConfirm('');
              }}
            >
              <Trans>No, Go back</Trans>
            </button>
            <button
              className="ks-primary-btn bg-warning border-none flex-1"
              onClick={() => {
                if (confirm.toLowerCase() === t`Confirm`.toLowerCase()) {
                  setDegenMode(true);
                  setShowConfirm(false);
                  setConfirm('');
                }
              }}
            >
              <Trans>Confirm</Trans>
            </button>
          </div>
        </div>
      </Modal>
      <div className="absolute right-6 top-[116px] bg-layer2 p-5 rounded-md min-w-[330px]" ref={ref}>
        <div className="text-base font-medium mb-5">
          <Trans>Advanced Setting</Trans>
        </div>
        <MouseoverTooltip
          text={t`Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!`}
          width="220px"
          className="w-fit"
        >
          <div className="text-sm border-b border-dotted border-subText">
            <Trans>Slippage Tolerance</Trans>
          </div>
        </MouseoverTooltip>
        <SlippageInput />

        <div className="flex items-center justify-between mt-3">
          <MouseoverTooltip
            text={t`Transaction will revert if it is pending for longer than the indicated time.`}
            width="220px"
          >
            <div className="text-sm border-b border-dotted border-subText">
              <Trans>Transaction Time Limit</Trans>
            </div>
          </MouseoverTooltip>

          <div className="flex py-[6px] px-2 gap-1 rounded-full bg-transparent text-subText text-xs font-medium text-right">
            <input
              className="border-none outline-none w-12 p-0 bg-transparent text-right text-subText focus:text-text data-[invalid='true']:text-error"
              maxLength={5}
              placeholder="20"
              value={deadline ? deadline.toString() : ''}
              data-invalid={!isValid}
              onChange={e => {
                const v = +e.target.value
                  .trim()
                  .replace(/[^0-9.]/g, '')
                  .replace(/(\..*?)\..*/g, '$1')
                  .replace(/^0[^.]/, '0');
                setDeadline(v);
              }}
            />
            <span>
              <Trans>mins</Trans>
            </span>
          </div>
        </div>

        <div
          className={cn(
            'flex items-center justify-between degen-mode rounded-xl mt-2 py-1',
            highlightDegenMode ? '-mx-2 px-2' : '',
          )}
          data-highlight={highlightDegenMode}
        >
          <MouseoverTooltip
            text={t`Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can result in bad rates and loss of funds. Be cautious.`}
            width="220px"
          >
            <div className="text-sm border-b border-dotted border-subText">
              <Trans>Degen Mode</Trans>
            </div>
          </MouseoverTooltip>
          <Toggle
            isActive={degenMode}
            toggle={() => {
              if (!degenMode) setShowConfirm(true);
              else setDegenMode(false);
            }}
          />
        </div>
      </div>
    </>
  );
}
