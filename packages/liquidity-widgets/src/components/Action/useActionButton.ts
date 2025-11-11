import { useMemo, useState } from 'react';

import { t } from '@lingui/macro';

import { usePositionOwner } from '@kyber/hooks';
import { APPROVAL_STATE, useErc20Approvals } from '@kyber/hooks';
import { API_URLS, CHAIN_ID_TO_CHAIN, univ3PoolNormalize, univ4Types } from '@kyber/schema';
import { translateZapImpact } from '@kyber/ui';
import { PI_LEVEL, friendlyError } from '@kyber/utils';
import { parseUnits } from '@kyber/utils/crypto';

import { ERROR_MESSAGE, translateErrorMessage } from '@/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapSnapshotState } from '@/types/index';
import { estimateGasForTx } from '@/utils';

export default function useActionButton({
  nftApproval,
  nftApprovalAll,
  setWidgetError,
  setZapSnapshotState,
}: {
  nftApproval: { approved: boolean; onApprove: () => Promise<void>; pendingTx: string; isChecking: boolean };
  nftApprovalAll: { approved: boolean; onApprove: () => Promise<void>; pendingTx: string; isChecking: boolean };
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

  const {
    loading: tokenApprovalLoading,
    approvalStates,
    approve,
    addressToApprove,
  } = useErc20Approvals({
    amounts: amountsToApprove,
    addreses: tokenAddressesToApprove,
    owner: connectedAccount?.address || '',
    rpcUrl,
    spender: zapInfo?.routerAddress || '',
    onSubmitTx: onSubmitTx,
  });
  const {
    approved: nftApproved,
    onApprove: approveNft,
    pendingTx: nftApprovePendingTx,
    isChecking: isCheckingNftApproval,
  } = nftApproval;
  const {
    approved: nftApprovedAll,
    onApprove: approveNftAll,
    pendingTx: nftApprovePendingTxAll,
    isChecking: isCheckingNftApprovalAll,
  } = nftApprovalAll;
  const [nftApprovalType, setNftApprovalType] = useState<'single' | 'all'>('single');

  const tokenInNotApproved = useMemo(
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
    nftApprovePendingTxAll ||
    tokenApprovalLoading ||
    zapLoading ||
    gasLoading ||
    isCheckingNftApproval ||
    isCheckingNftApprovalAll ||
    (errors.length > 0 && !isWrongNetwork && !isNotConnected) ||
    Object.values(approvalStates).some(item => item === APPROVAL_STATE.PENDING);

  const zapImpact = !zapInfo
    ? null
    : translateZapImpact(zapInfo.zapDetails.priceImpact, zapInfo.zapDetails.suggestedSlippage || 100);

  const isVeryHighZapImpact = zapImpact?.level === PI_LEVEL.VERY_HIGH;
  const isHighZapImpact = zapImpact?.level === PI_LEVEL.HIGH;
  const isInvalidZapImpact = zapImpact?.level === PI_LEVEL.INVALID;

  const needApproveNft = isUniv4 && positionId && !nftApproved && !nftApprovedAll;
  const approvalPending = addressToApprove || nftApprovePendingTx || nftApprovePendingTxAll;
  const buttonStates = [
    { condition: approvalPending, text: t`Approving` },
    { condition: gasLoading, text: t`Estimating Gas` },
    { condition: tokenApprovalLoading, text: t`Checking Allowance` },
    { condition: errors.length > 0, text: translateErrorMessage(errors[0]) },
    {
      condition: needApproveNft && (isCheckingNftApproval || isCheckingNftApprovalAll),
      text: t`Checking Approval`,
    },
    { condition: zapLoading, text: t`Fetching Route` },
    { condition: isUniv4 && isNotOwner, text: t`Not the position owner` },
    { condition: tokenInNotApproved, text: t`Approve ${tokenInNotApproved?.symbol ?? ''}` },
    { condition: needApproveNft, text: t`Approve NFT` },
    { condition: isVeryHighZapImpact || isInvalidZapImpact, text: t`Zap anyway` },
  ];
  const btnText = buttonStates.find(state => state.condition)?.text || t`Preview`;
  const isInNftApprovalStep = Boolean(
    !approvalPending &&
      !gasLoading &&
      !tokenApprovalLoading &&
      !zapLoading &&
      errors.length === 0 &&
      !(isUniv4 && isNotOwner) &&
      !tokenInNotApproved &&
      !isCheckingNftApproval &&
      !isCheckingNftApprovalAll &&
      needApproveNft,
  );

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
        setWidgetError(friendlyError(err as Error));
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
    if (tokenInNotApproved) {
      setClickedLoading(true);
      approve(tokenInNotApproved.address).finally(() => setClickedLoading(false));
    } else if (needApproveNft) {
      setClickedLoading(true);
      if (nftApprovalType === 'single') {
        approveNft().finally(() => setClickedLoading(false));
      } else {
        approveNftAll().finally(() => setClickedLoading(false));
      }
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

  const btnLoading =
    errors.length === 0 &&
    (zapLoading ||
      tokenApprovalLoading ||
      addressToApprove ||
      nftApprovePendingTx ||
      nftApprovePendingTxAll ||
      isCheckingNftApproval ||
      isCheckingNftApprovalAll ||
      gasLoading);

  const tooltipContent = (() => {
    if (
      approvalPending ||
      gasLoading ||
      tokenApprovalLoading ||
      zapLoading ||
      errors.length > 0 ||
      isWrongNetwork ||
      isNotConnected ||
      isCheckingNftApproval ||
      isCheckingNftApprovalAll ||
      Object.values(approvalStates).some(item => item === APPROVAL_STATE.NOT_APPROVED)
    )
      return '';

    if (needApproveNft)
      return t`Authorize ZapRouter through an on-chain approval. Choose whether to approve once or all positions.`;

    if (isVeryHighZapImpact || isInvalidZapImpact)
      return uiState.degenMode
        ? t`You have turned on Degen Mode from settings. Trades with very high price impact can be executed`
        : t`To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.`;

    return '';
  })();

  const isVeryHighWarning = isVeryHighZapImpact || isInvalidZapImpact;
  const isHighWarning = isHighZapImpact;

  return {
    btnText,
    hanldeClick,
    btnLoading,
    tooltipContent,
    btnDisabled,
    approvalStates,
    isHighWarning,
    isVeryHighWarning,
    nftApprovalType,
    setNftApprovalType,
    isInNftApprovalStep,
  };
}
