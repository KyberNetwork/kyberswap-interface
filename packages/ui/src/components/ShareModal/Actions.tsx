import { useState } from 'react';

import html2canvas from 'html2canvas';

import { cn } from '@kyber/utils/tailwind-helpers';

import CircleCheckIcon from '@/assets/icons/circle-check.svg?react';
import CopyIcon from '@/assets/icons/ic_copy.svg?react';
import DownloadIcon from '@/assets/icons/ic_download.svg?react';
import LinkIcon from '@/assets/icons/ic_link.svg?react';
import { ShareOption, ShareType } from '@/components/ShareModal/types';
import { Pool, getSharePath } from '@/components/ShareModal/utils';
import Loading from '@/components/loading';

interface ActionsProps {
  type: ShareType;
  pool: Pool;
  shareBannerRef: React.RefObject<HTMLDivElement>;
  selectedOptions: Set<ShareOption>;
}

const SuccessIcon = () => <CircleCheckIcon className="w-4 h-4 relative top-[1px] text-primary" />;

// Helper function to convert oklch/modern colors to hex/rgb
const convertModernColorsToLegacy = (element: HTMLElement) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, null);

  const elements: HTMLElement[] = [];
  let node;
  while ((node = walker.nextNode())) {
    elements.push(node as HTMLElement);
  }

  const originalStyles: Array<{ element: HTMLElement; property: string; value: string }> = [];

  elements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    const styleProperties = [
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
    ];

    styleProperties.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (
        value &&
        (value.includes('oklch') || value.includes('oklab') || value.includes('lch') || value.includes('lab'))
      ) {
        // Store original value
        originalStyles.push({
          element: el,
          property: prop,
          value: (el.style as any)[prop] || '',
        });

        // Convert to rgb
        const tempDiv = document.createElement('div');
        tempDiv.style.color = value;
        document.body.appendChild(tempDiv);
        const rgbValue = window.getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);

        (el.style as any)[prop] = rgbValue;
      }
    });
  });

  return () => {
    // Restore original styles
    originalStyles.forEach(({ element, property, value }) => {
      if (value) {
        (element.style as any)[property] = value;
      } else {
        element.style.removeProperty(property);
      }
    });
  };
};

export default function Actions({ type, pool, shareBannerRef, selectedOptions }: ActionsProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImageCopied, setIsImageCopied] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);

  const path = getSharePath(type, pool);

  const handleCopyPath = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(path);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    }
  };

  const generateCanvas = async (element: HTMLElement) => {
    const restoreStyles = convertModernColorsToLegacy(element);

    try {
      const canvas = await html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        backgroundColor: null,
        ignoreElements: element => {
          // Ignore elements that might cause issues
          return element.tagName === 'IFRAME' || element.tagName === 'OBJECT';
        },
        onclone: clonedDoc => {
          // Additional cleanup for cloned document
          const clonedElement = clonedDoc.querySelector('[data-html2canvas-ignore]');
          if (clonedElement) {
            clonedElement.remove();
          }
        },
      });
      return canvas;
    } finally {
      restoreStyles();
    }
  };

  const handleDownloadImage = async () => {
    if (shareBannerRef.current) {
      setIsDownloading(true);
      try {
        const canvas = await generateCanvas(shareBannerRef.current);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'kyberswap-earn-info.png';
        link.click();

        setIsDownloaded(true);
        setTimeout(() => {
          setIsDownloaded(false);
        }, 1500);
      } catch (error) {
        console.error('Failed to download image:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleCopyImage = async () => {
    if (shareBannerRef.current && navigator?.clipboard) {
      setIsCopyingImage(true);
      try {
        const canvas = await generateCanvas(shareBannerRef.current);

        canvas.toBlob(async blob => {
          if (blob) {
            try {
              // Create a ClipboardItem with the image blob
              const clipboardItem = new ClipboardItem({
                'image/png': blob,
              });

              await navigator.clipboard.write([clipboardItem]);
              setIsImageCopied(true);
              setTimeout(() => {
                setIsImageCopied(false);
              }, 1500);
            } catch (error) {
              console.error('Failed to copy image to clipboard:', error);
              // Fallback: try to copy as data URL
              try {
                const dataUrl = canvas.toDataURL('image/png');
                await navigator.clipboard.writeText(dataUrl);
                setIsImageCopied(true);
                setTimeout(() => {
                  setIsImageCopied(false);
                }, 1500);
              } catch (fallbackError) {
                console.error('Fallback copy also failed:', fallbackError);
              }
            }
          }
        }, 'image/png');
      } catch (error) {
        console.error('Failed to generate image:', error);
      } finally {
        setIsCopyingImage(false);
      }
    }
  };

  return (
    <div className="flex justify-center flex-wrap gap-4">
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
          'flex items-center justify-center py-[6px] px-4 gap-1 rounded-[30px] bg-[#ffffff14] hover:brightness-120 outline-none text-subText transition-all duration-200',
          isImageCopied && 'text-primary bg-primary-200',
        )}
        onClick={handleCopyImage}
      >
        {isImageCopied ? <SuccessIcon /> : isCopyingImage ? <Loading className="text-subText" /> : <CopyIcon />}
        Copy Image
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
  );
}
