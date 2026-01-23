import { useState } from 'react';

import { useLingui } from '@lingui/react';

import { ChainId, DEX_NAME, Exchange, Univ2EarnDex } from '@kyber/schema';
import { enumToArrayOfValues } from '@kyber/utils';
import { shortenAddress } from '@kyber/utils/crypto';
import { formatDisplayNumber } from '@kyber/utils/number';

import usePositions from '@/components/TokenSelectorModal/UserPositions/usePositions';
import CircleCheckBig from '@/components/TokenSelectorModal/assets/circle-check-big.svg?react';
import IconCopy from '@/components/TokenSelectorModal/assets/copy.svg?react';
import IconPositionConnectWallet from '@/components/TokenSelectorModal/assets/ic_position_connect_wallet.svg?react';
import IconPositionNotFound from '@/components/TokenSelectorModal/assets/ic_position_not_found.svg?react';
import { EarnPosition, PositionStatus } from '@/components/TokenSelectorModal/types';
import Loading from '@/components/loading';
import TokenLogo from '@/components/token-logo';

const COPY_TIMEOUT = 2000;
let hideCopied: ReturnType<typeof setTimeout>;

const listDexesWithVersion = [
  Exchange.DEX_UNISWAPV2,
  Exchange.DEX_UNISWAPV3,
  Exchange.DEX_UNISWAP_V4,
  Exchange.DEX_UNISWAP_V4_FAIRFLOW,
  Exchange.DEX_PANCAKE_INFINITY_CL,
  Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW,
  Exchange.DEX_PANCAKE_INFINITY_CL_ALPHA,
  Exchange.DEX_PANCAKE_INFINITY_CL_DYNAMIC,
  Exchange.DEX_PANCAKE_INFINITY_CL_LO,
  Exchange.DEX_PANCAKE_INFINITY_CL_BREVIS,
  Exchange.DEX_PANCAKESWAPV3,
  Exchange.DEX_SUSHISWAPV3,
  Exchange.DEX_QUICKSWAPV3ALGEBRA,
  Exchange.DEX_CAMELOTV3,
];

export const earnSupportedExchanges = enumToArrayOfValues(Exchange);

export const TokenLoader = () => (
  <div className="h-[288px] px-[26px] flex justify-center items-center">
    <Loading className="text-accent w-8 h-8" />
  </div>
);

const UserPositions = ({
  search,
  chainId,
  account,
  positionId,
  poolAddress,
  initialSlippage,
  onConnectWallet,
  onOpenZapMigration,
  onClose,
}: {
  search: string;
  chainId: ChainId;
  account?: string;
  positionId?: string;
  poolAddress?: string;
  initialSlippage?: number;
  onConnectWallet: () => void;
  onOpenZapMigration: (
    position: { exchange: string; poolId: string; positionId: string | number },
    initialSlippage?: number,
  ) => void;
  onClose: () => void;
}) => {
  const { i18n } = useLingui();
  const [copied, setCopied] = useState<string | null>(null);

  const { positions, loading } = usePositions({
    positionId,
    poolAddress,
    search,
    account,
    chainId,
  });

  const copy = (position: EarnPosition) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(position.pool.address);
    setCopied(position.tokenId.toString());

    clearTimeout(hideCopied);
    hideCopied = setTimeout(() => {
      setCopied(null);
    }, COPY_TIMEOUT);
  };

  if (!onOpenZapMigration) return null;

  if (!account)
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-subText font-medium h-[260px] relative mx-6">
        <IconPositionConnectWallet />
        {i18n._('No positions found. Connect your wallet first.')}
        <button className="ks-primary-btn w-full absolute -bottom-14 left-0" onClick={onConnectWallet}>
          {i18n._('Connect')}
        </button>
      </div>
    );

  return loading ? (
    <TokenLoader />
  ) : positions.length ? (
    positions.map((position: EarnPosition, index: number) => {
      const isUniv2 = Univ2EarnDex.safeParse(position.pool.protocol.type).success;
      const posStatus = isUniv2 ? PositionStatus.IN_RANGE : position.status;
      const dexName = DEX_NAME[position.pool.protocol.type];
      const version = listDexesWithVersion.includes(position.pool.protocol.type)
        ? dexName.split(' ')[dexName.split(' ').length - 1] || ''
        : '';

      return (
        <div key={index}>
          <div
            className="flex flex-col py-3 px-[26px] gap-2 cursor-pointer hover:bg-[#31cb9e33]"
            onClick={() => {
              const isUniV2 = Univ2EarnDex.safeParse(position.pool.protocol.type).success;
              if (isUniV2 && !account) return;

              onClose();
              onOpenZapMigration(
                {
                  exchange: position.pool.protocol.type,
                  poolId: position.pool.address,
                  positionId: !isUniV2 ? position.tokenId : account,
                },
                initialSlippage,
              );
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2 items-center">
                <div className="flex items-end">
                  <TokenLogo
                    src={position.pool.tokenAmounts[0]?.token.logo}
                    size={26}
                    className="border-[2px] border-transparent"
                  />
                  <TokenLogo
                    src={position.pool.tokenAmounts[1]?.token.logo}
                    size={26}
                    className="ml-[-8px] border-[2px] border-transparent"
                  />
                  <TokenLogo
                    src={position.chain.logo}
                    size={14}
                    className="ml-[-6px] border-[2px] border-transparent  relative top-1"
                  />
                </div>
                <span>
                  {position.pool.tokenAmounts[0]?.token.symbol || ''}/
                  {position.pool.tokenAmounts[1]?.token.symbol || ''}
                </span>
                {position.pool.fees?.length > 0 && (
                  <div className="rounded-full text-sm bg-[#ffffff14] text-subText px-[10px] py-1">
                    {position.pool.fees[0]}%
                  </div>
                )}
              </div>
              <div className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
                {formatDisplayNumber(position.valueInUSD, {
                  style: 'currency',
                  significantDigits: 4,
                })}
              </div>
            </div>
            <div className="flex items-center justify-between w-full flex-wrap">
              <div className="flex gap-2 items-center">
                <div className="flex gap-1 items-center">
                  <TokenLogo src={position.pool.protocol.logo} />
                  {version && <span className="text-subText text-xs">{version}</span>}
                </div>
                {!isUniv2 && <span className="text-subText">#{position.tokenId}</span>}
                <div className="text-[#027BC7] bg-[#ffffff0a] rounded-full px-[10px] py-1 flex gap-1 text-sm">
                  {shortenAddress(position.pool.address, 4)}
                  {copied !== position.tokenId.toString() ? (
                    <IconCopy
                      className="w-[14px] h-[14px] text-[#027BC7] hover:brightness-125 relative top-[3px] cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        copy(position);
                      }}
                    />
                  ) : (
                    <CircleCheckBig className="w-[14px] h-[14px] text-accent relative top-1" />
                  )}
                </div>
              </div>
              <div
                className={`rounded-full text-xs px-2 py-1 font-normal ${
                  posStatus === PositionStatus.OUT_RANGE ? 'text-warning bg-warning-200' : 'text-accent bg-accent-200'
                }`}
              >
                {posStatus === PositionStatus.OUT_RANGE ? i18n._('● Out of range') : i18n._('● In range')}
              </div>
            </div>
          </div>
          {index !== positions.length - 1 && <div className="h-[1px] bg-[#ffffff14] mx-[26px]" />}
        </div>
      );
    })
  ) : (
    <div className="flex flex-col items-center justify-center gap-3 text-subText font-medium h-[280px]">
      <IconPositionNotFound />
      {i18n._('No positions found.')}
    </div>
  );
};

export default UserPositions;
