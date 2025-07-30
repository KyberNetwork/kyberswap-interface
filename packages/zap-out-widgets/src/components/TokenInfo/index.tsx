import ChevronLeft from '@/assets/svg/chevron-left.svg';
import MarketInfo from '@/components/TokenInfo/MarketInfo';
import SecurityInfo from '@/components/TokenInfo/SecurityInfo';
import { Token } from '@/schema';

const TokenInfo = ({ token, onGoBack }: { token: Token; onGoBack: () => void }) => {
  return (
    <div className="w-full mx-auto text-white overflow-hidden">
      <div className="flex items-center gap-1 p-4 pb-[14px]">
        <ChevronLeft className="text-subText w-[26px] h-[26px] cursor-pointer hover:text-text" onClick={onGoBack} />
        <span className="ml-1">{token.symbol || ''}</span>
        <span className="text-xs text-subText mt-1">{token.name || ''}</span>
      </div>
      <MarketInfo token={token} />
      <SecurityInfo token={token} />
    </div>
  );
};

export default TokenInfo;
