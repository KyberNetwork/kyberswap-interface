import { useRef, useState } from 'react';

import html2canvas from 'html2canvas';

import { cn } from '@kyber/utils/tailwind-helpers';

import CircleCheckIcon from '@/assets/icons/circle-check.svg?react';
// import CopyIcon from '@/assets/icons/ic_copy.svg?react';
import DownloadIcon from '@/assets/icons/ic_download.svg?react';
import LinkIcon from '@/assets/icons/ic_link.svg?react';
import KyberLogo from '@/assets/icons/kyber_logo.svg?react';
import ShareBanner from '@/assets/images/share-banner.png';
import {
  DEFAULT_SHARE_OPTION,
  MAX_SELECTED_OPTIONS,
  NON_FARMING_EXCLUDED_OPTIONS,
  conflictOptions,
  shareOptions,
} from '@/components/ShareModal/constants';
import { ShareModalProps, ShareOption, ShareType } from '@/components/ShareModal/types';
import {
  formatTimeDurationFromTimestamp,
  getProxyImage,
  getSharePath,
  getValueByOption,
  renderStaggeredNumber,
} from '@/components/ShareModal/utils';
import { MouseoverTooltip } from '@/components/Tooltip';
import Loading from '@/components/loading';
import TokenLogo from '@/components/token-logo';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import '@/styles.css';

export { ShareType, ShareOption, type ShareModalProps };

const SuccessIcon = () => <CircleCheckIcon className="w-4 h-4 relative top-[1px] text-primary" />;

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

  const path = getSharePath(type, pool);

  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Set<ShareOption>>(
    new Set(defaultOptions || DEFAULT_SHARE_OPTION[type]),
  );

  const shareBannerRef = useRef<HTMLDivElement>(null);

  const handleCopyPath = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(path);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    }
  };

  const handleDownloadImage = async () => {
    if (shareBannerRef.current) {
      setIsDownloading(true);
      html2canvas(shareBannerRef.current, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      })
        .then(canvas => {
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = 'kyberswap-earn-info.png';
          link.click();

          setIsDownloaded(true);
          setTimeout(() => {
            setIsDownloaded(false);
          }, 1500);
        })
        .finally(() => {
          setIsDownloading(false);
        });
    }
  };

  const handleOptionChange = (option: ShareOption, checked: boolean) => {
    const newSelectedOptions = new Set(selectedOptions);
    if (checked) {
      newSelectedOptions.add(option);
    } else {
      newSelectedOptions.delete(option);
    }

    const sortedOptions = new Set<ShareOption>();

    // Always add TOTAL_EARNINGS first if it exists in the selected options
    if (newSelectedOptions.has(ShareOption.TOTAL_EARNINGS)) {
      sortedOptions.add(ShareOption.TOTAL_EARNINGS);
    }

    // Add remaining options in the order they appear in shareOptions[type]
    const typeOptions = shareOptions[type];
    typeOptions.forEach(optionType => {
      if (newSelectedOptions.has(optionType) && optionType !== ShareOption.TOTAL_EARNINGS) {
        sortedOptions.add(optionType);
      }
    });

    setSelectedOptions(sortedOptions);
  };

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

          <div className="flex items-center justify-center flex-wrap gap-6 py-3">
            {shareOptions[type].map(option => {
              const isExcluded = !isFarming && NON_FARMING_EXCLUDED_OPTIONS.includes(option);
              const isMaxSelected = selectedOptions.size === MAX_SELECTED_OPTIONS && !selectedOptions.has(option);
              const isConflict = conflictOptions[type][option]?.some(o => selectedOptions.has(o));
              const isDisabled = isExcluded || isMaxSelected || isConflict;

              const message = isExcluded
                ? `This option is not available for non-farming pools`
                : isMaxSelected
                  ? `You can only select up to ${MAX_SELECTED_OPTIONS} options`
                  : isConflict
                    ? `This option is not available when you select ${conflictOptions[type][option]?.join(', ')}`
                    : undefined;

              return (
                <MouseoverTooltip text={message} placement="top" key={option}>
                  <Checkbox
                    label={option}
                    disabled={isDisabled}
                    checked={selectedOptions.has(option)}
                    onChange={checked => handleOptionChange(option, checked)}
                  />
                </MouseoverTooltip>
              );
            })}
          </div>
        </div>

        <DialogFooter className="block">
          <div className="flex justify-center gap-4">
            <button
              className={cn(
                'flex items-center justify-center py-[6px] px-4 gap-1 rounded-[30px] bg-[#ffffff14] hover:brightness-120 outline-none text-subText transition-all duration-200',
                isCopied && 'text-primary bg-primary-200',
              )}
              onClick={handleCopyPath}
            >
              {isCopied ? <SuccessIcon /> : <LinkIcon />}
              Copy URL
            </button>
            <button
              className={cn(
                'flex items-center justify-center py-[6px] px-4 gap-1 rounded-[30px] text-subText bg-[#ffffff14] hover:brightness-120 outline-none transition-all duration-200',
                isDownloaded && 'text-primary bg-primary-200',
                selectedOptions.size === 0 && 'opacity-50 cursor-not-allowed !brightness-100',
              )}
              disabled={selectedOptions.size === 0}
              onClick={handleDownloadImage}
            >
              {isDownloaded ? <SuccessIcon /> : isDownloading ? <Loading className="text-subText" /> : <DownloadIcon />}
              Download Image
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
