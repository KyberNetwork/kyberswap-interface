import { useCallback, useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { DEXES_INFO, NETWORKS_INFO, PoolType, defaultToken } from '@kyber/schema';
import TokenSelectorModal, { MAX_TOKENS, TOKEN_SELECT_MODE } from '@kyber/token-selector';
import { InfoHelper } from '@kyber/ui';

import LiquidityToAdd, { LiquidityToAddSkeleton } from '@/components/TokenInput/LiquidityToAdd';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function TokenInput({ className }: { className?: string }) {
  const {
    theme,
    chainId,
    poolAddress,
    poolType,
    connectedAccount,
    positionId,
    onConnectWallet,
    onOpenZapMigration,
    onEvent,
  } = useWidgetStore([
    'theme',
    'chainId',
    'poolAddress',
    'poolType',
    'connectedAccount',
    'positionId',
    'onConnectWallet',
    'onOpenZapMigration',
    'onEvent',
  ]);
  const { pool } = usePoolStore(['pool']);
  const { tickLower, tickUpper, tokensIn, amountsIn, setTokensIn, setAmountsIn, slippage } = useZapState();

  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false);
  const [tokenAddressSelected, setTokenAddressSelected] = useState<string | undefined>();

  const initializing = !pool;
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const handleOpenZapMigration = useCallback(
    (position: { exchange: string; poolId: string; positionId: string | number }, initialSlippage?: number) => {
      if (!onOpenZapMigration) return undefined;

      const dexNameObj = DEXES_INFO[poolType as PoolType]?.name;
      const dexName = !dexNameObj ? '' : typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId];
      const poolPair = pool ? `${pool.token0.symbol}/${pool.token1.symbol}` : '';
      onEvent?.('LIQ_EXISTING_POSITION_SELECTED', {
        position_id: position.positionId?.toString(),
        pool_pair: poolPair,
        pool_protocol: dexName,
        pool_fee_tier: pool ? `${pool.fee}%` : '',
        chain: NETWORKS_INFO[chainId]?.name,
      });

      return onOpenZapMigration(
        position,
        tickLower !== null && tickUpper !== null
          ? {
              tickLower,
              tickUpper,
            }
          : undefined,
        initialSlippage,
      );
    },
    [onOpenZapMigration, tickLower, tickUpper, pool, poolType, chainId, onEvent],
  );

  const wrappedSetTokensIn = useCallback(
    (newTokensIn: typeof tokensIn) => {
      const prevAddresses = tokensIn.map(t => t.address.toLowerCase());
      const newTokens = newTokensIn.filter(t => !prevAddresses.includes(t.address.toLowerCase()));
      if (newTokens.length > 0 && pool) {
        const poolPair = `${pool.token0.symbol}/${pool.token1.symbol}`;
        newTokens.forEach(t => {
          const isZap =
            t.address.toLowerCase() !== pool.token0.address.toLowerCase() &&
            t.address.toLowerCase() !== pool.token1.address.toLowerCase();
          onEvent?.('LIQ_TOKEN_SELECTED', {
            token_symbol: t.symbol,
            token_address: t.address,
            pool_pair: poolPair,
            is_zap: isZap,
            chain: NETWORKS_INFO[chainId]?.name,
          });
        });
      }
      setTokensIn(newTokensIn);
    },
    [tokensIn, pool, chainId, onEvent, setTokensIn],
  );

  const onCloseTokenSelectModal = useCallback(() => {
    setOpenTokenSelectModal(false);
    setTokenAddressSelected(undefined);
  }, [setOpenTokenSelectModal, setTokenAddressSelected]);

  return (
    <>
      <div className={className}>
        <div>
          <div className="text-base pl-1">
            {positionId ? <Trans>Increase Liquidity</Trans> : <Trans>Add Liquidity</Trans>}
          </div>
          {initializing || !tokensIn.length ? (
            <LiquidityToAddSkeleton />
          ) : (
            tokensIn.map((_, tokenIndex: number) => (
              <LiquidityToAdd
                tokenIndex={tokenIndex}
                key={tokenIndex}
                setOpenTokenSelectModal={setOpenTokenSelectModal}
                setTokenAddressSelected={setTokenAddressSelected}
              />
            ))
          )}
        </div>

        <div className="my-3 text-accent cursor-pointer w-fit text-sm" onClick={() => setOpenTokenSelectModal(true)}>
          <Trans>+ Add Token(s) or Use Existing Position</Trans>
          <InfoHelper
            placement="bottom"
            text={t`You can either zap in with up to ${MAX_TOKENS} tokens or select an existing position as the liquidity source`}
            color={theme.accent}
            width="300px"
            style={{
              verticalAlign: 'baseline',
              position: 'relative',
              top: 2,
              left: 2,
            }}
          />
        </div>
      </div>

      {openTokenSelectModal && (
        <TokenSelectorModal
          chainId={chainId}
          onClose={onCloseTokenSelectModal}
          wallet={{
            account: connectedAccount?.address,
            onConnectWallet,
          }}
          tokenOptions={{
            tokensIn,
            amountsIn,
            setTokensIn: wrappedSetTokensIn,
            setAmountsIn,
            mode: tokenAddressSelected ? TOKEN_SELECT_MODE.SELECT : TOKEN_SELECT_MODE.ADD,
            selectedTokenAddress: tokenAddressSelected,
            token0Address: token0.address,
            token1Address: token1.address,
          }}
          positionOptions={{
            showUserPositions: !!onOpenZapMigration,
            positionId,
            poolAddress,
            initialSlippage: slippage,
            onSelectLiquiditySource: onOpenZapMigration ? handleOpenZapMigration : undefined,
          }}
        />
      )}
    </>
  );
}
