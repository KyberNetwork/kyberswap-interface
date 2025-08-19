import { useRef, useState } from 'react';

import KyberLogo from '@/assets/icons/kyber_logo.svg?react';
import ShareBanner from '@/assets/images/share-banner.png';
import Actions from '@/components/ShareModal/Actions';
import Options from '@/components/ShareModal/Options';
import { DEFAULT_SHARE_OPTION } from '@/components/ShareModal/constants';
import { ShareModalProps, ShareOption, ShareType } from '@/components/ShareModal/types';
import {
  formatTimeDurationFromTimestamp,
  getProxyImage,
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
  defaultOptions,
  onClose,
}: ShareModalProps) {
  const isPoolSharing = type === ShareType.POOL_INFO;
  const isPositionSharing = type === ShareType.POSITION_INFO;
  const isRewardSharing = type === ShareType.REWARD_INFO;

  const [selectedOptions, setSelectedOptions] = useState<Set<ShareOption>>(
    new Set(defaultOptions || DEFAULT_SHARE_OPTION[type]),
  );

  const shareBannerRef = useRef<HTMLDivElement>(null);

  const banner = (bannerRef?: React.RefObject<HTMLDivElement>, forDownload = false) => {
    const options = [...selectedOptions];
    const option1Label = options[0];
    const option2Label = options[1];

    const option1Value = getValueByOption({ type, option: option1Label, pool, position, reward });
    const option2Value = getValueByOption({ type, option: option2Label, pool, position, reward });

    return (
      <div
        ref={bannerRef}
        className={`bg-cover bg-center font-cera ${
          forDownload
            ? 'p-4 pb-10 flex flex-col gap-7 w-[680px]' // Fixed desktop size for download
            : 'p-4 pb-8 sm:pb-10 flex flex-col gap-5 sm:gap-7' // Responsive for display
        }`}
        style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), transparent), url(${ShareBanner})` }}
      >
        {/* Banner header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center -ml-2">
            <KyberLogo className="h-8" />
            <p className="text-sm">KyberSwap</p>
          </div>
          <div
            className={`flex items-center gap-1 text-sm ${forDownload ? 'flex-row' : 'flex-col sm:flex-row items-start sm:items-center gap-0 sm:gap-1'}`}
          >
            <p>Explore details: </p>
            <p
              className="text-primary cursor-pointer"
              onClick={() => window.open('https://kyberswap.com/earn/', '_blank')}
            >
              Kyberswap.com/earn
            </p>
          </div>
        </div>

        {/* Banner content */}
        <div
          className={`flex flex-col ${forDownload ? 'ml-9' : 'ml-4 sm:ml-9'} ${forDownload ? 'gap-5' : 'gap-3 sm:gap-5'}`}
          style={{ height: 'calc(100% - 48px)' }}
        >
          <div className="flex items-center gap-1">
            <TokenLogo
              className={forDownload ? 'h-5 w-5' : 'h-[18px] sm:h-5 w-[18px] sm:w-5'}
              src={getProxyImage(pool.dexLogo)}
            />
            <p className={forDownload ? 'text-lg' : 'text-base sm:text-lg'}>{pool.dexName}</p>
          </div>
          <div className="flex flex-col gap-3">
            {!isRewardSharing ? (
              <div className="flex items-center">
                <div className="flex items-center">
                  <TokenLogo size={22} src={getProxyImage(pool.token0?.logo)} />
                  <TokenLogo size={22} className="-ml-2" src={getProxyImage(pool.token1?.logo)} />
                  <TokenLogo
                    size={12}
                    className="relative -left-[6px] -bottom-[6px]"
                    src={getProxyImage(pool.chainLogo)}
                  />
                </div>
                <p className={forDownload ? 'text-2xl' : 'text-[22px] sm:text-2xl'}>
                  {pool.token0?.symbol} - {pool.token1?.symbol}
                </p>
              </div>
            ) : (
              <div className="h-[12px]" />
            )}
            {selectedOptions.size === 1 ? (
              isPoolSharing || isRewardSharing ? (
                <div className="flex flex-col">
                  <p className={forDownload ? 'text-2xl -mb-1' : 'text-[22px] text-2xl -mb-2 sm:-mb-1'}>
                    {option1Label}
                  </p>
                  <p
                    className={`text-primary font-semibold tracking-wide ${forDownload ? 'text-[68px]' : 'text-[60px] sm:text-[68px]'}`}
                  >
                    {renderStaggeredNumber(option1Value)}
                  </p>
                </div>
              ) : isPositionSharing ? (
                <div className={`flex flex-col ${forDownload ? 'gap-[6px]' : 'gap-[2px] sm:gap-[6px]'}`}>
                  <div>
                    <p className={forDownload ? 'text-xl -mb-[6px]' : 'text-lg sm:text-xl -mb-[6px]'}>{option1Label}</p>
                    <p className="text-primary font-semibold text-[58px] tracking-wide">
                      {renderStaggeredNumber(option1Value)}
                    </p>
                  </div>
                  <p className={forDownload ? 'text-xl' : 'text-lg sm:text-xl'}>
                    Position age: {formatTimeDurationFromTimestamp(position?.createdTime || 0)}
                  </p>
                </div>
              ) : null
            ) : selectedOptions.size === 2 ? (
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-lg -mb-[2px]">{option1Label}</p>
                  <p
                    className={`text-primary font-semibold ${option1Label === ShareOption.TOTAL_EARNINGS ? 'text-[54px]' : 'text-3xl'} tracking-wide`}
                  >
                    {renderStaggeredNumber(option1Value)}
                  </p>
                </div>
                <div>
                  <p className="text-lg -mb-[2px]">{option2Label}</p>
                  <p
                    className={`text-primary font-semibold ${option1Label === ShareOption.TOTAL_EARNINGS ? 'text-2xl' : 'text-3xl'} tracking-wide`}
                  >
                    {renderStaggeredNumber(option2Value)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[113px]" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog onOpenChange={onClose} open={true}>
      <DialogContent containerClassName="ks-ui-style" className="w-[680px] max-w-[100%]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-left">Share this with your friends!</DialogTitle>
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
          />
        </div>

        <DialogFooter className="block">
          <Actions type={type} pool={pool} shareBannerRef={shareBannerRef} selectedOptions={selectedOptions} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
