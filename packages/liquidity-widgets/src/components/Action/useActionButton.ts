import { useMemo, useState } from 'react';

import { t } from '@lingui/macro';

import { usePositionOwner } from '@kyber/hooks';
import { APPROVAL_STATE, useErc20Approvals } from '@kyber/hooks';
import { API_URLS, CHAIN_ID_TO_CHAIN, univ3PoolNormalize, univ4Types } from '@kyber/schema';
import { translateFriendlyErrorMessage, translateZapImpact } from '@kyber/ui';
import { PI_LEVEL, friendlyError } from '@kyber/utils';
import { parseUnits } from '@kyber/utils/crypto';

import { ERROR_MESSAGE, translateErrorMessage } from '@/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapSnapshotState } from '@/types/index';
import { estimateGasForTx } from '@/utils';

export default function useActionButton({
  nftApproved,
  approveNft,
  nftApprovePendingTx,
  setWidgetError,
  setZapSnapshotState,
}: {
  nftApproved: boolean;
  nftApprovePendingTx: string;
  approveNft: () => Promise<void>;
  setWidgetError: (_value: string | undefined) => void;
  setZapSnapshotState: (_value: ZapSnapshotState | null) => void;
}) {
  const {
    chainId,
    rpcUrl,
    poolType,
    connectedAccount,
    onConnectWallet,
    onSwitchChain,
    onSubmitTx,
    positionId,
    source,
  } = useWidgetStore([
    'chainId',
    'rpcUrl',
    'poolType',
    'connectedAccount',
    'onConnectWallet',
    'onSwitchChain',
    'onSubmitTx',
    'positionId',
    'source',
  ]);
  const { pool } = usePoolStore(['pool']);
  const positionOwner = usePositionOwner({
    positionId: positionId || '',
    chainId,
    poolType,
  });
  const {
    zapInfo,
    errors,
    ttl,
    loading: zapLoading,
    tickLower,
    tickUpper,
    slippage,
    tokensIn,
    amountsIn,
    toggleSetting,
    uiState,
  } = useZapState();

  const { address: account } = connectedAccount;

  const amountsInWei: string[] = useMemo(
    () =>
      !amountsIn
        ? []
        : amountsIn
            .split(',')
            .map((amount, index) => parseUnits(amount || '0', tokensIn[index]?.decimals || 0).toString()),
    [tokensIn, amountsIn],
  );

  const tokenAddressesToApprove = tokensIn
    .filter((_, index) => Number(amountsInWei[index]) > 0)
    .map(token => token?.address || '');
  const amountsToApprove = amountsInWei.filter(amount => Number(amount) > 0);

  const { loading, approvalStates, approve, addressToApprove } = useErc20Approvals({
    amounts: amountsToApprove,
    addreses: tokenAddressesToApprove,
    owner: connectedAccount?.address || '',
    rpcUrl,
    spender: zapInfo?.routerAddress || '',
    onSubmitTx: onSubmitTx,
  });

  const notApprove = useMemo(
    () => tokensIn.find(item => approvalStates[item?.address || ''] === APPROVAL_STATE.NOT_APPROVED),
    [approvalStates, tokensIn],
  );

  const [clickedApprove, setClickedLoading] = useState(false);
  const [gasLoading, setGasLoading] = useState(false);

  const isUniv4 = univ4Types.includes(poolType);
  const isNotOwner =
    positionId &&
    positionOwner &&
    connectedAccount?.address &&
    positionOwner !== connectedAccount?.address?.toLowerCase()
      ? true
      : false;
  const isWrongNetwork = errors.includes(ERROR_MESSAGE.WRONG_NETWORK);
  const isNotConnected = errors.includes(ERROR_MESSAGE.CONNECT_WALLET);

  const btnDisabled =
    (isUniv4 && isNotOwner) ||
    clickedApprove ||
    nftApprovePendingTx ||
    loading ||
    zapLoading ||
    gasLoading ||
    (errors.length > 0 && !isWrongNetwork && !isNotConnected) ||
    Object.values(approvalStates).some(item => item === APPROVAL_STATE.PENDING);

  const zapImpact = !zapInfo
    ? null
    : translateZapImpact(zapInfo.zapDetails.priceImpact, zapInfo.zapDetails.suggestedSlippage || 100);

  const isVeryHighZapImpact = zapImpact?.level === PI_LEVEL.VERY_HIGH;
  const isHighZapImpact = zapImpact?.level === PI_LEVEL.HIGH;
  const isInvalidZapImpact = zapImpact?.level === PI_LEVEL.INVALID;

  const buttonStates = [
    { condition: addressToApprove || nftApprovePendingTx, text: t`Approving` },
    { condition: zapLoading, text: t`Fetching Route` },
    { condition: gasLoading, text: t`Estimating Gas` },
    { condition: errors.length > 0, text: translateErrorMessage(errors[0]) },
    { condition: isUniv4 && isNotOwner, text: t`Not the position owner` },
    { condition: loading, text: t`Checking Allowance` },
    { condition: notApprove, text: t`Approve ${notApprove?.symbol ?? ''}` },
    { condition: isUniv4 && positionId && !nftApproved, text: t`Approve NFT` },
    { condition: isVeryHighZapImpact || isInvalidZapImpact, text: t`Zap anyway` },
  ];
  const btnText = buttonStates.find(state => state.condition)?.text || t`Preview`;

  const getGasEstimation = async ({ deadline }: { deadline: number }) => {
    if (!zapInfo) return;
    setGasLoading(true);
    const res = await fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/in/route/build`, {
      method: 'POST',
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then(res => res.json())
      .then(async res => {
        const { data } = res || {};
        if (data?.callData && account) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: `0x${BigInt(data.value).toString(16)}`,
          };

          const { gasUsd, error } = await estimateGasForTx({ rpcUrl, txData, chainId });

          if (error) {
            setWidgetError(error);
            return;
          }
          return gasUsd;
        }
      })
      .catch(err => {
        setWidgetError(translateFriendlyErrorMessage(friendlyError(err as Error)));
        console.error(err);
      })
      .finally(() => {
        setGasLoading(false);
      });

    return res;
  };

  const hanldeClick = async () => {
    if (!slippage) return;
    const { success: isUniV3Pool } = univ3PoolNormalize.safeParse(pool);
    if (isNotConnected) {
      onConnectWallet();
      return;
    }
    if (isWrongNetwork) {
      onSwitchChain();
      return;
    }
    if (notApprove) {
      setClickedLoading(true);
      approve(notApprove.address).finally(() => setClickedLoading(false));
    } else if (isUniv4 && positionId && !nftApproved) {
      setClickedLoading(true);
      approveNft().finally(() => setClickedLoading(false));
    } else if (
      pool !== null &&
      amountsIn &&
      tokensIn.every(Boolean) &&
      zapInfo &&
      (isUniV3Pool ? tickLower !== null && tickUpper !== null : true)
    ) {
      if ((isVeryHighZapImpact || isInvalidZapImpact) && !uiState.degenMode) {
        toggleSetting(true);
        document.getElementById('zapin-setting')?.scrollIntoView({ behavior: 'smooth' });

        return;
      }

      const date = new Date();
      date.setMinutes(date.getMinutes() + (ttl || 20));
      const deadline = Math.floor(date.getTime() / 1000);

      const gasUsd = await getGasEstimation({ deadline });
      if (!gasUsd) return;

      setZapSnapshotState({
        zapInfo,
        deadline,
        gasUsd,
      });
    }
  };

  const btnLoading = zapLoading || loading || addressToApprove || nftApprovePendingTx || gasLoading;
  const btnWarning =
    (isVeryHighZapImpact || isInvalidZapImpact) &&
    !errors.length &&
    !isWrongNetwork &&
    !isNotConnected &&
    Object.values(approvalStates).every(item => item === APPROVAL_STATE.APPROVED) &&
    (isUniv4 ? nftApproved : true);

  const isVeryHighWarning = isVeryHighZapImpact || isInvalidZapImpact;
  const isHighWarning = isHighZapImpact;

  return {
    btnText,
    hanldeClick,
    btnLoading,
    btnWarning,
    btnDisabled,
    approvalStates,
    isHighWarning,
    isVeryHighWarning,
  };
}
