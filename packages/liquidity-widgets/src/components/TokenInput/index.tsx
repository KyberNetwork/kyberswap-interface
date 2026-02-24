import { useCallback, useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { defaultToken } from '@kyber/schema';
import TokenSelectorModal, { MAX_TOKENS, TOKEN_SELECT_MODE } from '@kyber/token-selector';
import { InfoHelper } from '@kyber/ui';

import LiquidityToAdd, { LiquidityToAddSkeleton } from '@/components/TokenInput/LiquidityToAdd';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function TokenInput({ className }: { className?: string }) {
  const { theme, chainId, poolAddress, connectedAccount, positionId, onConnectWallet, onOpenZapMigration } =
    useWidgetStore([
      'theme',
      'chainId',
      'poolAddress',
      'connectedAccount',
      'positionId',
      'onConnectWallet',
      'onOpenZapMigration',
    ]);
  const { pool } = usePoolStore(['pool']);
  const { tickLower, tickUpper, tokensIn, amountsIn, setTokensIn, setAmountsIn, slippage } = useZapState();

  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false);
  const [tokenAddressSelected, setTokenAddressSelected] = useState<string | undefined>();

  const initializing = !pool;
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const handleOpenZapMigration = useCallback(
    (position: { exchange: string; poolId: string; positionId: string | number }, initialSlippage?: number) =>
      onOpenZapMigration
        ? onOpenZapMigration(
            position,
            tickLower !== null && tickUpper !== null
              ? {
                  tickLower,
                  tickUpper,
                }
              : undefined,
            initialSlippage,
          )
        : undefined,
    [onOpenZapMigration, tickLower, tickUpper],
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
            setTokensIn,
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
