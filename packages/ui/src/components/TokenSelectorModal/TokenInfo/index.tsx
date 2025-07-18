import { ChainId, Token } from '@kyber/schema';

import ChevronLeft from '../assets/chevron-left.svg?react';
import MarketInfo from './MarketInfo';
import SecurityInfo from './SecurityInfo';

const TokenInfo = ({ token, chainId, onGoBack }: { token: Token; chainId: ChainId; onGoBack: () => void }) => {
  return (
    <div className="w-full mx-auto text-white overflow-hidden">
      <div className="flex items-center gap-1 p-4 pb-[14px]">
        <ChevronLeft className="text-subText w-[26px] h-[26px] cursor-pointer hover:text-text" onClick={onGoBack} />
        <span className="ml-1">{token.symbol || ''}</span>
        <span className="text-xs text-subText mt-1">{token.name || ''}</span>
      </div>
      <MarketInfo token={token} chainId={chainId} />
      <SecurityInfo token={token} chainId={chainId} />
    </div>
  );
};

export default TokenInfo;
