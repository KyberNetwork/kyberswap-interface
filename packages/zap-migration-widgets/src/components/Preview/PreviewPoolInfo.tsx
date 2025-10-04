import { useCopy } from '@kyber/hooks';
import { ChainId, DEXES_INFO, NETWORKS_INFO, Pool } from '@kyber/schema';
import { TokenLogo, TokenSymbol } from '@kyber/ui';

export default function PreviewPoolInfo({ pool, chainId }: { pool: Pool; chainId: ChainId }) {
  const copy = useCopy({
    text: pool.address,
    copyClassName: 'text-subText w-4 h-4',
    successClassName: 'w-4 h-4',
  });

  const dex = DEXES_INFO[pool.poolType];
  const dexName = typeof dex.name === 'string' ? dex.name : dex.name[chainId];

  return (
    <div className="border border-stroke rounded-md p-4 flex gap-2 items-start">
      <div className="flex items-end">
        <TokenLogo src={pool.token0.logo} size={36} alt={pool.token0.symbol} className="z-0" />
        <TokenLogo src={pool.token1.logo} size={36} alt={pool.token1.symbol} className="-ml-3 z-10" />
        <TokenLogo src={NETWORKS_INFO[chainId].logo} alt={NETWORKS_INFO[chainId].name} className="-ml-1.5 z-20" />
      </div>
      <div>
        <div className="flex gap-1 items-center">
          <TokenSymbol symbol={pool.token0.symbol} maxWidth={80} />/
          <TokenSymbol symbol={pool.token1.symbol} maxWidth={80} /> {copy}
        </div>
        <div className="flex gap-1 items-center text-subText mt-1">
          <TokenLogo src={dex.icon} size={12} alt={dexName} />
          <div className="text-sm opacity-70">{dexName}</div>
          <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">Fee {pool.fee}%</div>
        </div>
      </div>
    </div>
  );
}
