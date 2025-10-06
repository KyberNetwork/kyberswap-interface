import { useMemo, useState } from 'react';

import { usePositionOwner } from '@kyber/hooks';
import { APPROVAL_STATE, useErc20Approvals } from '@kyber/hooks';
import { API_URLS, CHAIN_ID_TO_CHAIN, NETWORKS_INFO, univ3PoolNormalize, univ4Types } from '@kyber/schema';
import { PI_LEVEL, getZapImpact } from '@kyber/utils';
import { parseUnits } from '@kyber/utils/crypto';

import { ERROR_MESSAGE } from '@/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapSnapshotState } from '@/types/index';
import { estimateGasForTx } from '@/utils';

const IS_DISABLED = true;

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
  const { poolType, chainId, connectedAccount, onConnectWallet, onSwitchChain, onSubmitTx, positionId, source } =
    useWidgetStore([
      'poolType',
      'chainId',
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
    rpcUrl: NETWORKS_INFO[chainId].defaultRpc,
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
    IS_DISABLED ||
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
    : getZapImpact(zapInfo.zapDetails.priceImpact, zapInfo.zapDetails.suggestedSlippage || 100);

  const isVeryHighZapImpact = zapImpact?.level === PI_LEVEL.VERY_HIGH;
  const isHighZapImpact = zapImpact?.level === PI_LEVEL.HIGH;
  const isInvalidZapImpact = zapImpact?.level === PI_LEVEL.INVALID;

  const buttonStates = [
    { condition: IS_DISABLED, text: 'Zap Temporarily Unavailable' },
    { condition: zapLoading, text: 'Fetching Route' },
    { condition: gasLoading, text: 'Estimating Gas' },
    { condition: errors.length > 0, text: errors[0] },
    { condition: isUniv4 && isNotOwner, text: 'Not the position owner' },
    { condition: loading, text: 'Checking Allowance' },
    { condition: addressToApprove || nftApprovePendingTx, text: 'Approving' },
    { condition: notApprove, text: `Approve ${notApprove?.symbol}` },
    { condition: isUniv4 && positionId && !nftApproved, text: 'Approve NFT' },
    { condition: isVeryHighZapImpact || isInvalidZapImpact, text: 'Zap anyway' },
  ];
  const btnText = buttonStates.find(state => state.condition)?.text || 'Preview';

  const getGasEstimation = async ({ deadline }: { deadline: number }) => {
    if (!zapInfo) return;
    setGasLoading(true);
    const rpcUrl = NETWORKS_INFO[chainId].defaultRpc;

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

          setGasLoading(false);
          if (error) {
            setWidgetError(error);
            return;
          }
          return gasUsd;
        }
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
      pool !== 'loading' &&
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
