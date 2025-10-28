import { cn } from '@kyber/utils/tailwind-helpers';

import UnknownToken from '@/assets/unknown-token.svg?url';

const getProxyTokenLogo = (logoUrl: string | undefined): string =>
  logoUrl ? (logoUrl.startsWith('data:') ? logoUrl : `https://proxy.kyberswap.com/token-logo?url=${logoUrl}`) : '';

const TokenLogo = ({
  src,
  alt,
  className,
  size = 16,
  fallbackWithProxy,
  style,
}: {
  src?: string;
  alt?: string;
  className?: string;
  size?: number;
  fallbackWithProxy?: boolean;
  style?: React.CSSProperties;
}) => (
  <img
    src={src || UnknownToken}
    style={style}
    className={cn('rounded-full', className, ' ks-ui-style')}
    width={size}
    height={size}
    alt={alt || ''}
    onError={({ currentTarget }) => {
      if (!fallbackWithProxy) {
        currentTarget.onerror = null; // prevents looping
        currentTarget.src = UnknownToken;
      } else {
        const hasTriedProxy = currentTarget.getAttribute('data-tried-proxy') === 'true';
        if (!hasTriedProxy) {
          currentTarget.setAttribute('data-tried-proxy', 'true');
          currentTarget.src = getProxyTokenLogo(currentTarget.src);
        } else {
          currentTarget.onerror = null; // prevents looping
          currentTarget.src = UnknownToken;
        }
      }
    }}
  />
);

export default TokenLogo;
