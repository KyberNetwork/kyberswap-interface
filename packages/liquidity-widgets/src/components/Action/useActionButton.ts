import { useMemo, useState } from 'react';

import { t } from '@lingui/macro';

import { PermitNftState, useDebounce, usePositionOwner } from '@kyber/hooks';
import { APPROVAL_STATE } from '@kyber/hooks';
import { API_URLS, CHAIN_ID_TO_CHAIN, univ3PoolNormalize, univ4Types } from '@kyber/schema';
import { PI_LEVEL, friendlyError } from '@kyber/utils';

import { ERROR_MESSAGE, translateErrorMessage } from '@/constants';
import { ApprovalState } from '@/hooks/useApproval';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { BuildDataWithGas } from '@/types/index';
import { estimateGasForTx } from '@/utils';

export default function useActionButton({ approval, deadline }: { approval: ApprovalState; deadline: number }) {
  const {
    chainId,
    rpcUrl,
    poolType,
    connectedAccount,
    onConnectWallet,
    onSwitchChain,
    positionId,
    source,
    referral,
    setError: setWidgetError,
  } = useWidgetStore([
    'chainId',
    'rpcUrl',
    'poolType',
    'connectedAccount',
    'onConnectWallet',
    'onSwitchChain',
    'positionId',
    'source',
    'referral',
    'setError',
  ]);
  const { pool } = usePoolStore(['pool']);
  const positionOwner = usePositionOwner({
    positionId: positionId || '',
    chainId,
    poolType,
  });
  const {
    route,
    errors: rawErrors,
    loading: zapLoading,
    tickLower,
    tickUpper,
    slippage,
    tokensIn,
    amountsIn,
    toggleSetting,
    uiState,
    setBuildData,
  } = useZapState();
  const errors = useDebounce(rawErrors, 200);
  const { zapImpact } = useZapRoute();

  const { address: account } = connectedAccount;

  const tokenInNotApproved = useMemo(
    () => tokensIn.find(item => approval.tokenApproval.states[item?.address || ''] === APPROVAL_STATE.NOT_APPROVED),
    [approval.tokenApproval.states, tokensIn],
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

  const isVeryHighZapImpact = zapImpact.level === PI_LEVEL.VERY_HIGH;
  const isHighZapImpact = zapImpact.level === PI_LEVEL.HIGH;
  const isInvalidZapImpact = zapImpact.level === PI_LEVEL.INVALID;

  const btnDisabled =
    (isUniv4 && isNotOwner) ||
    clickedApprove ||
    approval.nftApproval.pendingTx ||
    approval.nftApprovalAll.pendingTx ||
    approval.tokenApproval.loading ||
    (zapLoading && !route) ||
    gasLoading ||
    approval.nftApproval.isChecking ||
    approval.nftApprovalAll.isChecking ||
    (errors.length > 0 && !isWrongNetwork && !isNotConnected) ||
    Object.values(approval.tokenApproval.states).some(item => item === APPROVAL_STATE.PENDING) ||
    approval.permit.state === PermitNftState.SIGNING;

  const needApproveNft =
    isUniv4 &&
    positionId &&
    approval.permit.state !== PermitNftState.SIGNED &&
    !approval.nftApproval.isApproved &&
    !approval.nftApprovalAll.isApproved;
  const approvalPending =
    approval.tokenApproval.addressToApprove || approval.nftApproval.pendingTx || approval.nftApprovalAll.pendingTx;
  const buttonStates = [
    {
      condition: approvalPending,
      text: t`Approving...`,
    },
    { condition: gasLoading, text: t`Estimating Gas...` },
    // { condition: approval.tokenApproval.loading, text: t`Checking Allowance...` },
    { condition: errors.length > 0, text: translateErrorMessage(errors[0]) },
    {
      condition: needApproveNft && (approval.nftApproval.isChecking || approval.nftApprovalAll.isChecking),
      text: t`Checking Approval...`,
    },
    { condition: zapLoading && !route, text: t`Fetching Route...` },
    { condition: isUniv4 && isNotOwner, text: t`Not the position owner` },
    { condition: tokenInNotApproved, text: t`Approve ${tokenInNotApproved?.symbol ?? ''}` },
    { condition: !route, text: t`No route found` },
    { condition: isVeryHighZapImpact || isInvalidZapImpact, text: t`Zap anyway` },
  ];
  const btnText = buttonStates.find(state => state.condition)?.text || t`Preview`;
  const isInNftApprovalStep = Boolean(
    errors.length === 0 &&
      route &&
      !approval.tokenApproval.addressToApprove &&
      !gasLoading &&
      !isNotOwner &&
      needApproveNft,
  );
  const nftApprovalDisabled = Boolean(
    isInNftApprovalStep &&
      (approval.nftApproval.pendingTx ||
        approval.nftApprovalAll.pendingTx ||
        approval.permit.state === PermitNftState.SIGNING),
  );
  const nftApprovalText =
    approval.nftApproval.pendingTx || approval.nftApprovalAll.pendingTx ? t`Approving...` : t`Approve NFT`;
  const permitEnable = Boolean(
    isInNftApprovalStep &&
      (approval.permit.state === PermitNftState.READY_TO_SIGN ||
        approval.permit.state === PermitNftState.SIGNING ||
        approval.permit.state === PermitNftState.ERROR),
  );

  const getBuildDataWithGas = async () => {
    if (!route) return;
    setGasLoading(true);
    const buildBody = {
      sender: account,
      recipient: account,
      route: route.route,
      deadline,
      source,
      referral,
    } as any; // Type assertion added to allow dynamic property assignment
    if (isUniv4 && positionId && approval.permit.state === PermitNftState.SIGNED && approval.permit.data?.permitData) {
      (buildBody as any).permits = {
        positionId: approval.permit.data.permitData,
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
    if (isNotConnected) {
      onConnectWallet();
      return;
    }
    if (isWrongNetwork) {
      onSwitchChain();
      return;
    }
    if (!slippage || needApproveNft) return;
    const { success: isUniV3Pool } = univ3PoolNormalize.safeParse(pool);
    if (tokenInNotApproved) {
      setClickedLoading(true);
      approval.tokenApproval.approve(tokenInNotApproved.address).finally(() => setClickedLoading(false));
    } else if (
      pool !== null &&
      amountsIn &&
      tokensIn.every(Boolean) &&
      route &&
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

  return {
    btnText,
    hanldeClick,
    btnDisabled,
    approvalStates: approval.tokenApproval.states,
    isHighWarning: isHighZapImpact,
    isVeryHighWarning: isVeryHighZapImpact || isInvalidZapImpact,
    isInNftApprovalStep,
    nftApproval: {
      disabled: nftApprovalDisabled,
      text: nftApprovalText,
      type: approval.nftApprovalType,
      setType: approval.setNftApprovalType,
      approve: () => {
        if (approval.nftApprovalType === 'single') {
          approval.nftApproval.approve().finally(() => setClickedLoading(false));
        } else {
          approval.nftApprovalAll.approve().finally(() => setClickedLoading(false));
        }
      },
    },
    permit: {
      enable: permitEnable,
      disabled: nftApprovalDisabled,
      sign: approval.permit.sign,
      state: approval.permit.state,
    },
  };
}
