import { useMemo, useState } from 'react';

import { useCopy } from '@kyber/hooks';
import { ChainId, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, Token } from '@kyber/schema';
import { shortenAddress } from '@kyber/utils/crypto';

import Loader from '../../loader';
import TokenLogo from '../../token-logo';
import LogoCoingecko from '../assets/coingecko.svg?react';
import IconDown from '../assets/down.svg?react';
import IconZiczac from '../assets/ziczac.svg?react';
import useMarketTokenInfo from './useMarketTokenInfo';

const MarketInfo = ({ token, chainId }: { token: Token; chainId: ChainId }) => {
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

  const { marketTokenInfo, loading } = useMarketTokenInfo({ tokenAddress, chainId });
  const [expand, setExpand] = useState<boolean>(false);

  const handleChangeExpand = () => setExpand(prev => !prev);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 text-text bg-icon-200">
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
        {(marketTokenInfo || []).map((item: any) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-subText">{item.label}</span>
            <span>{loading ? <Loader className="animate-spin w-[10px] h-[10px]" /> : item.value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 px-[26px] py-[14px]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-subText">Contract Address</span>
          <div className="flex items-center gap-1">
            {token ? (
              <>
                <TokenLogo src={token.logo} />
                <span>{shortenAddress(tokenAddress, 3)}</span>
                {Copy}
              </>
            ) : (
              <Loader className="animate-spin w-[10px] h-[10px]" />
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
