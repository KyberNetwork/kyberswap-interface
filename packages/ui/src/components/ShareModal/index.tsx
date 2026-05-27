import { useRef, useState } from 'react';

import { useLingui } from '@lingui/react';

import KyberLogo from '@/assets/icons/kyber_logo.svg?react';
import ShareBanner from '@/assets/images/share-banner.png';
import Actions from '@/components/ShareModal/Actions';
import Options from '@/components/ShareModal/Options';
import { DEFAULT_SHARE_OPTION, shareOptions } from '@/components/ShareModal/constants';
import { ShareModalProps, ShareOption, ShareType } from '@/components/ShareModal/types';
import {
  formatTimeDurationFromTimestamp,
  getShareOptionLabel,
  getValueByOption,
  renderStaggeredNumber,
} from '@/components/ShareModal/utils';
import TokenLogo from '@/components/token-logo';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import '@/styles.css';

export { ShareType, ShareOption, type ShareModalProps };

export default function ShareModal({
  pool,
  position,
  reward,
  type,
  isFarming,
  hasActiveApr,
  defaultOptions,
  onClose,
}: ShareModalProps) {
  const { i18n } = useLingui();
  const isPoolSharing = type === ShareType.POOL_INFO;
  const isPositionSharing = type === ShareType.POSITION_INFO;
  const isRewardSharing = type === ShareType.REWARD_INFO;
  const initialOptions =
    defaultOptions || (isPoolSharing && hasActiveApr ? [ShareOption.ACTIVE_APR] : DEFAULT_SHARE_OPTION[type]);

  const [selectedOptions, setSelectedOptions] = useState<Set<ShareOption>>(new Set(initialOptions));

  const shareBannerRef = useRef<HTMLDivElement>(null);

  const banner = (bannerRef?: React.RefObject<HTMLDivElement>, forDownload = false) => {
    const options = shareOptions[type].filter(option => selectedOptions.has(option));
    const option1 = options[0];
    const option2 = options[1];

    const option1Label = option1 ? getShareOptionLabel(i18n, option1) : '';
    const option2Label = option2 ? getShareOptionLabel(i18n, option2) : '';

    const option1Value = getValueByOption({ type, option: option1, selectedOptions, pool, position, reward });
    const option2Value = getValueByOption({ type, option: option2, selectedOptions, pool, position, reward });

    return (
      <div
        ref={bannerRef}
        className={`bg-cover bg-center font-cera ${
          forDownload
            ? 'p-4 flex flex-col gap-7 w-[680px]' // Fixed desktop size for download
            : 'p-4 flex flex-col gap-5 sm:gap-7' // Responsive for display
        }`}
        style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), transparent), url(${ShareBanner})` }}
      >
        {/* Banner header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <KyberLogo className="h-8" />
            <p className="text-sm leading-tight">KyberSwap</p>
          </div>
          <div
            className={`flex items-center gap-1 text-sm ${forDownload ? 'flex-row' : 'flex-col sm:flex-row items-start sm:items-center gap-0 sm:gap-1'}`}
          >
            <p className="leading-tight">{i18n._('Explore details:')}</p>
            <p
              className="text-primary cursor-pointer leading-tight"
              onClick={() => window.open('https://kyberswap.com/earn/', '_blank')}
            >
              Kyberswap.com/earn
            </p>
          </div>
        </div>

        {/* Banner content */}
        <div
          className={`flex flex-col ${forDownload ? 'ml-10' : 'ml-4 sm:ml-10'} ${forDownload ? 'gap-4' : 'gap-3 sm:gap-4'}`}
          style={{ height: 'calc(100% - 48px)' }}
        >
          {pool ? (
            <div className="flex items-center gap-1">
              <TokenLogo
                className={forDownload ? 'h-5 w-5' : 'h-[18px] sm:h-5 w-[18px] sm:w-5'}
                src={pool.dexLogo}
                fallbackWithProxy
              />
              <p className={forDownload ? 'text-lg leading-tight' : 'text-base sm:text-lg leading-tight'}>
                {pool.dexName}
              </p>
            </div>
          ) : null}
          <div className="min-h-[18px]">
            {!isRewardSharing && pool ? (
              <div className="flex items-center gap-1">
                <div className="relative h-[28px] w-[46px] shrink-0">
                  <TokenLogo size={22} className="absolute left-0 top-0" src={pool.token0?.logo} fallbackWithProxy />
                  <TokenLogo
                    size={22}
                    className="absolute left-[14px] top-0"
                    src={pool.token1?.logo}
                    fallbackWithProxy
                  />
                  <TokenLogo
                    size={12}
                    className="absolute bottom-0 left-[30px]"
                    src={pool.chainLogo}
                    fallbackWithProxy
                  />
                </div>
                <p className={forDownload ? 'text-2xl leading-tight' : 'text-[22px] sm:text-2xl leading-tight'}>
                  {pool.token0?.symbol} - {pool.token1?.symbol}
                </p>
                {pool.feeTier && (
                  <p className="text-sm leading-tight bg-[#ffffff14] rounded-full ml-1 px-2 py-[2px]">
                    {pool.feeTier.toString() + '%'}
                  </p>
                )}
              </div>
            ) : null}
          </div>
          <div className={forDownload ? 'min-h-[180px]' : 'min-h-[148px] sm:min-h-[180px]'}>
            {selectedOptions.size === 1 ? (
              isPoolSharing || isRewardSharing ? (
                <div className="flex flex-col gap-1">
                  <p className={forDownload ? 'text-2xl leading-tight' : 'text-[22px] sm:text-2xl leading-tight'}>
                    {option1Label}
                  </p>
                  <p
                    className={`text-primary font-semibold tracking-wide leading-none ${forDownload ? 'text-[68px]' : 'text-[60px] sm:text-[68px]'}`}
                  >
                    {renderStaggeredNumber(option1Value)}
                  </p>
                </div>
              ) : isPositionSharing ? (
                <div className={`flex flex-col ${forDownload ? 'gap-3' : 'gap-2 sm:gap-3'}`}>
                  <div className="flex flex-col gap-1">
                    <p className={forDownload ? 'text-xl leading-tight' : 'text-lg sm:text-xl leading-tight'}>
                      {option1Label}
                    </p>
                    <p className="text-primary font-semibold text-[58px] tracking-wide leading-none">
                      {renderStaggeredNumber(option1Value)}
                    </p>
                  </div>
                  <p className={forDownload ? 'text-xl leading-tight' : 'text-lg sm:text-xl leading-tight'}>
                    {i18n._('Position age: {duration}', {
                      duration: formatTimeDurationFromTimestamp(position?.createdTime || 0),
                    })}
                  </p>
                </div>
              ) : null
            ) : selectedOptions.size === 2 ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-lg leading-tight">{option1Label}</p>
                  <p className="text-primary font-semibold text-5xl tracking-wide leading-none">
                    {renderStaggeredNumber(option1Value)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-lg leading-tight">{option2Label}</p>
                  <p className="text-primary font-semibold text-5xl tracking-wide leading-none">
                    {renderStaggeredNumber(option2Value)}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog onOpenChange={onClose} open={true}>
      <DialogContent containerClassName="ks-ui-style" className="w-[680px] max-w-[100%]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-left">{i18n._('Share this with your friends!')}</DialogTitle>
        </DialogHeader>

        <div className="bg-[#00000014]">
          {/* Visible responsive banner */}
          {banner()}

          {/* Hidden desktop-sized banner for download */}
          <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">{banner(shareBannerRef, true)}</div>

          <Options
            type={type}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
            isFarming={isFarming}
            hasActiveApr={hasActiveApr}
            pool={pool}
            position={position}
            reward={reward}
          />
        </div>

        <DialogFooter className="block">
          <Actions type={type} pool={pool} shareBannerRef={shareBannerRef} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
