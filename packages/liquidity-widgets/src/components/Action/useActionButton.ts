import { useMemo, useState } from 'react';

import { t } from '@lingui/macro';

import { PermitNftState, usePermitNft, usePositionOwner } from '@kyber/hooks';
import { APPROVAL_STATE, useErc20Approvals } from '@kyber/hooks';
import { API_URLS, CHAIN_ID_TO_CHAIN, univ3PoolNormalize, univ4Types } from '@kyber/schema';
import { translateZapImpact } from '@kyber/ui';
import { PI_LEVEL, friendlyError, getNftManagerContractAddress } from '@kyber/utils';
import { parseUnits } from '@kyber/utils/crypto';

import { ERROR_MESSAGE, translateErrorMessage } from '@/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { BuildDataWithGas } from '@/types/index';
import { estimateGasForTx } from '@/utils';

export default function useActionButton({
  nftApproval,
  nftApprovalAll,
  setWidgetError,
  setBuildData,
  deadline,
}: {
  nftApproval: { approved: boolean; onApprove: () => Promise<void>; pendingTx: string; isChecking: boolean };
  nftApprovalAll: { approved: boolean; onApprove: () => Promise<void>; pendingTx: string; isChecking: boolean };
  setWidgetError: (_value: string | undefined) => void;
  setBuildData: (_value: BuildDataWithGas | null) => void;
  deadline: number;
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
    signTypedData,
    referral,
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
    'signTypedData',
    'referral',
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

  const nftManagerContract = getNftManagerContractAddress(poolType, chainId);
  const { permitState, signPermitNft, permitData } = usePermitNft({
    nftManagerContract,
    tokenId: positionId,
    spender: zapInfo?.routerPermitAddress,
    account: connectedAccount?.address,
    chainId: connectedAccount?.chainId,
    rpcUrl,
    signTypedData,
  });

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
    Object.values(approvalStates).some(item => item === APPROVAL_STATE.PENDING) ||
    permitState === PermitNftState.SIGNING;

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

  const zapImpact = !zapInfo
    ? null
    : translateZapImpact(zapInfo.zapDetails.priceImpact, zapInfo.zapDetails.suggestedSlippage || 100);

  const isVeryHighZapImpact = zapImpact?.level === PI_LEVEL.VERY_HIGH;
  const isHighZapImpact = zapImpact?.level === PI_LEVEL.HIGH;
  const isInvalidZapImpact = zapImpact?.level === PI_LEVEL.INVALID;

  const needApproveNft =
    isUniv4 && positionId && permitState !== PermitNftState.SIGNED && !nftApproved && !nftApprovedAll;
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

  const permitEnable = Boolean(
    isInNftApprovalStep &&
      (permitState === PermitNftState.READY_TO_SIGN ||
        permitState === PermitNftState.SIGNING ||
        permitState === PermitNftState.ERROR),
  );
  const permitDisabled = Boolean(isInNftApprovalStep && (permitState === PermitNftState.SIGNING || approvalPending));

  const getBuildDataWithGas = async () => {
    if (!zapInfo) return;
    setGasLoading(true);
    const buildBody = {
      sender: account,
      recipient: account,
      route: zapInfo.route,
      deadline,
      source,
      referral,
    } as any; // Type assertion added to allow dynamic property assignment
    if (isUniv4 && positionId && permitState === PermitNftState.SIGNED && permitData?.permitData) {
      (buildBody as any).permits = {
        positionId: permitData.permitData,
      };
    }
    try {
      const response = await fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/in/route/build`, {
        method: 'POST',
        body: JSON.stringify(buildBody),
      });

      let body: { data: BuildDataWithGas } | null = null;
      body = await response.json();

      const { data } = body || {};
      if (data && data.callData && account) {
        const txData = {
          from: account,
          to: data.routerAddress,
          data: data.callData,
          value: `0x${BigInt(data.value).toString(16)}`,
        };

        const { gasUsd, error } = await estimateGasForTx({ rpcUrl, txData, chainId });

        if (error || !gasUsd) {
          setWidgetError(error);
          return;
        }
        return { ...data, gasUsd };
      }

      throw new Error('Invalid response from build route');
    } catch (err) {
      setWidgetError(friendlyError(err as Error));
      console.error(err);
    } finally {
      setGasLoading(false);
    }
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

      const buildData = await getBuildDataWithGas();
      if (!buildData) return;

      setBuildData(buildData);
    }
  };

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

  return {
    btnText,
    hanldeClick,
    btnLoading,
    tooltipContent,
    btnDisabled,
    approvalStates,
    isHighWarning: isHighZapImpact,
    isVeryHighWarning: isVeryHighZapImpact || isInvalidZapImpact,
    nftApprovalType,
    setNftApprovalType,
    isInNftApprovalStep,
    permit: {
      enable: permitEnable,
      disabled: permitDisabled,
      sign: signPermitNft,
    },
  };
}
