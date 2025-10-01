import { useMemo, useState } from 'react';

import { useCopy } from '@kyber/hooks';
import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@kyber/schema';
import { Token } from '@kyber/schema';
import { Loading, TokenLogo } from '@kyber/ui';

import LogoCoingecko from '@/assets/svg/coingecko.svg';
import IconDown from '@/assets/svg/down.svg';
import IconZiczac from '@/assets/svg/ziczac.svg';
import useMarketTokenInfo from '@/components/TokenSelector/TokenInfo/useMarketTokenInfo';
import { shortenAddress } from '@/components/TokenSelector/TokenInfo/utils';
import { useZapOutContext } from '@/stores';

const MarketInfo = ({ token }: { token: Token }) => {
  const theme = useZapOutContext(s => s.theme);
  const chainId = useZapOutContext(s => s.chainId);

  const tokenAddress = useMemo(
    () =>
      (token?.address
        ? token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NETWORKS_INFO[chainId].wrappedToken.address
          : token.address
        : ''
      ).toLowerCase(),
    [token, chainId],
  );
  const Copy = useCopy({
    text: tokenAddress,
    copyClassName: 'w-3 h-3 text-text hover:text-subText',
    successClassName: 'w-3 h-3',
  });

  const { marketTokenInfo, loading } = useMarketTokenInfo(tokenAddress);
  const [expand, setExpand] = useState<boolean>(false);

  const handleChangeExpand = () => setExpand(prev => !prev);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 text-text" style={{ background: `${theme.icons}33` }}>
        <div className="flex items-center gap-2">
          {' '}
          <IconZiczac className="h-6 w-6" />
          <span>Market Info</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-subText text-[10px]">Powered by</span> <LogoCoingecko className="h-4 w-14" />
        </div>
      </div>
      <div
        className={`flex flex-col gap-3 px-[26px] pt-[14px] transition-all ease-in-out duration-300 overflow-hidden ${
          expand ? 'h-[226px]' : 'h-[86px]'
        }`}
      >
        {(marketTokenInfo || []).map(item => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-subText">{item.label}</span>
            <span>{loading ? <Loading className="w-[10px] h-[10px]" /> : item.value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 px-[26px] py-[14px]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-subText">Contract Address</span>
          <div className="flex items-center gap-1">
            {token ? (
              <>
                <TokenLogo src={token.logo} alt={token.symbol} />
                <span>{shortenAddress(tokenAddress, 3)}</span>
                {Copy}
              </>
            ) : (
              <Loading className="w-[10px] h-[10px]" />
            )}
          </div>
        </div>
        <div
          className="text-xs text-accent cursor-pointer mx-auto w-fit flex items-center"
          onClick={handleChangeExpand}
        >
          <span>{!expand ? 'View more' : 'View less'}</span>
          <IconDown className={`transition ease-in-out duration-300 ${expand ? 'rotate-[-180deg]' : ''}`} />
        </div>
      </div>
    </>
  );
};

export default MarketInfo;
