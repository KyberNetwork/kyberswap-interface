import { useRef, useState } from 'react';

import html2canvas from 'html2canvas';

import { formatAprNumber, formatDisplayNumber } from '@kyber/utils/number';

import CircleCheckIcon from '../../assets/icons/circle-check.svg?react';
import CopyIcon from '../../assets/icons/ic_copy.svg?react';
import DownloadIcon from '../../assets/icons/ic_download.svg?react';
import KyberLogo from '../../assets/icons/kyber_logo.svg?react';
import ShareBanner from '../../assets/share-banner.png';
import '../../styles.css';
import TokenLogo from '../token-logo';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Dialog } from '../ui/dialog';

export enum ShareType {
  POOL_INFO,
  POSITION_INFO,
  POSITION_REWARDS_INFO,
}

export interface ShareModalProps {
  pool: {
    address: string;
    chainId: number;
    chainLogo: string;
    dexLogo: string;
    dexName: string;
    exchange: string;
    token0: {
      symbol: string;
      logo: string;
    };
    token1: {
      symbol: string;
      logo: string;
    };
    apr?: number;
  };
  position?: {
    apr: number;
    createdTime?: number;
    rewardEarnings?: number;
  };
  type: ShareType;
  onClose: () => void;
}

// Convert timestamp to format like "3 days 4 hrs" or "1 month 3 days" when days > 30
const formatTimeDurationFromTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const targetTime = typeof timestamp === 'number' && timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const diffMs = Math.abs(now - targetTime);

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);

  if (minutes < 60) {
    return minutes === 1 ? '1 min' : `${minutes} mins`;
  }

  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return hours === 1 ? '1 hr' : `${hours} hrs`;
    }
    const hrText = hours === 1 ? 'hr' : 'hrs';
    const minText = remainingMinutes === 1 ? 'min' : 'mins';
    return `${hours} ${hrText} ${remainingMinutes} ${minText}`;
  }

  if (days <= 30) {
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return days === 1 ? '1 day' : `${days} days`;
    }
    const dayText = days === 1 ? 'day' : 'days';
    const hrText = remainingHours === 1 ? 'hr' : 'hrs';
    return `${days} ${dayText} ${remainingHours} ${hrText}`;
  }

  // For days > 30, show months and remaining days
  const remainingDays = days % 30;
  if (remainingDays === 0) {
    return months === 1 ? '1 month' : `${months} months`;
  }
  const monthText = months === 1 ? 'month' : 'months';
  const dayText = remainingDays === 1 ? 'day' : 'days';
  return `${months} ${monthText} ${remainingDays} ${dayText}`;
};

const getProxyImage = (url: string | undefined) =>
  !url ? '' : url.startsWith('data:') ? url : `https://proxy.kyberswap.com/token-logo?url=${url}`;

const renderStaggeredNumber = (numberString: string) => {
  const chars = numberString.split('');

  const effects = [
    'translate-y-0 scale-100',
    'translate-y-0 scale-100',
    '-translate-y-0.5 scale-103',
    '-translate-y-0.2 scale-101',
    'translate-y-0.5 scale-99',
    '-translate-y-0.5 scale-102',
    'translate-y-0 scale-100',
    '-translate-y-0.5 scale-99',
    'translate-y-0.5 scale-101',
  ];

  return (
    <span className="inline-flex items-baseline">
      {chars.map((char, index) => (
        <span
          key={index}
          className={`inline-block ${
            !['$', '%'].includes(char) ? effects[index % effects.length] : ''
          } transition-transform duration-300`}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

export default function ShareModal({ pool, position, type, onClose }: ShareModalProps) {
  const path = `${window.location.origin || 'kyberswap.com'}/earn/pools?poolAddress=${pool.address}&poolChainId=${pool.chainId}&exchange=${pool.exchange}`;

  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

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
      html2canvas(shareBannerRef.current, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'kyberswap-earn-info.png';
        link.click();

        setIsDownloaded(true);
        setTimeout(() => {
          setIsDownloaded(false);
        }, 1500);
      });
    }
  };

  const banner = (bannerRef?: React.RefObject<HTMLDivElement>, forDownload = false) => (
    <div
      ref={bannerRef}
      className={`bg-cover bg-center font-cera ${
        forDownload
          ? 'p-4 pb-10 flex flex-col gap-7 w-[600px]' // Fixed desktop size for download
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
        className={`flex flex-col ${forDownload ? 'ml-9' : 'ml-4 sm:ml-9'} ${
          type === ShareType.POOL_INFO
            ? forDownload
              ? 'gap-7'
              : 'gap-5 sm:gap-7'
            : forDownload
              ? 'gap-5'
              : 'gap-3 sm:gap-5'
        }`}
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
          <div className="flex items-center">
            <div className="flex items-center">
              <TokenLogo size={22} src={getProxyImage(pool.token0.logo)} />
              <TokenLogo size={22} className="-ml-2" src={getProxyImage(pool.token1.logo)} />
              <TokenLogo size={12} className="relative -left-[6px] -bottom-[6px]" src={getProxyImage(pool.chainLogo)} />
            </div>
            <p className={forDownload ? 'text-2xl' : 'text-[22px] sm:text-2xl'}>
              {pool.token0.symbol} - {pool.token1.symbol}
            </p>
          </div>
          {type === ShareType.POOL_INFO ? (
            <div className="flex flex-col">
              <p className={forDownload ? 'text-2xl -mb-1' : 'text-[22px] text-2xl -mb-2 sm:-mb-1'}>APR</p>
              <p
                className={`text-primary font-semibold tracking-wide ${forDownload ? 'text-[68px]' : 'text-[60px] sm:text-[68px]'}`}
              >
                {renderStaggeredNumber(formatAprNumber(pool.apr || 0) + '%')}
              </p>
            </div>
          ) : type === ShareType.POSITION_REWARDS_INFO ? (
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-lg -mb-[2px]">Reward earnings</p>
                <p className="text-primary font-semibold text-[54px] tracking-wide">
                  {renderStaggeredNumber(
                    formatDisplayNumber(position?.rewardEarnings || 0, { significantDigits: 4, style: 'currency' }),
                  )}
                </p>
              </div>
              <div>
                <p className="text-lg -mb-[2px]">APR</p>
                <p className="text-primary font-semibold text-2xl tracking-wide">
                  {renderStaggeredNumber(formatAprNumber(position?.apr || 0) + '%')}
                </p>
              </div>
            </div>
          ) : type === ShareType.POSITION_INFO ? (
            <div className={`flex flex-col ${forDownload ? 'gap-[6px]' : 'gap-[2px] sm:gap-[6px]'}`}>
              <div>
                <p className={forDownload ? 'text-xl -mb-[6px]' : 'text-lg sm:text-xl -mb-[6px]'}>APR</p>
                <p className="text-primary font-semibold text-[58px] tracking-wide">
                  {renderStaggeredNumber(formatAprNumber(position?.apr || 0) + '%')}
                </p>
              </div>
              <p className={forDownload ? 'text-xl' : 'text-lg sm:text-xl'}>
                Position age: {formatTimeDurationFromTimestamp(position?.createdTime || 0)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog onOpenChange={onClose} open={true}>
      <DialogContent containerClassName="ks-ui-style" className="w-[600px] max-w-[100%]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-left">Share this with your friends!</DialogTitle>
        </DialogHeader>

        {/* Visible responsive banner */}
        {banner()}

        {/* Hidden desktop-sized banner for download */}
        <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">{banner(shareBannerRef, true)}</div>

        <DialogFooter className="block">
          <div className="flex justify-center gap-4">
            <button
              className="flex items-center justify-center py-[6px] px-4 gap-1 rounded-[30px] text-subText bg-[#ffffff14] hover:brightness-150 outline-none"
              onClick={handleCopyPath}
            >
              {isCopied ? <CircleCheckIcon className="w-4 h-4 text-primary" /> : <CopyIcon />}
              Copy URL
            </button>
            <button
              className="flex items-center justify-center py-[6px] px-4 gap-1 rounded-[30px] text-subText bg-[#ffffff14] hover:brightness-150 outline-none"
              onClick={handleDownloadImage}
            >
              {isDownloaded ? <CircleCheckIcon className="w-4 h-4 text-primary" /> : <DownloadIcon />}
              Download Image
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
