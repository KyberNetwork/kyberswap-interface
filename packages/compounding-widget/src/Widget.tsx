import { useShallow } from 'zustand/shallow';

import { useNftApproval } from '@kyber/hooks';
import { NETWORKS_INFO } from '@kyber/schema';
import { getNftManagerContractAddress } from '@kyber/utils';

import ChevronLeftIcon from '@/assets/svg/chevron-left.svg';
import ErrorIcon from '@/assets/svg/error.svg';
import Action from '@/components/Action';
import EstLiqValue from '@/components/Content/EstLiqValue';
import PriceInfo from '@/components/Content/PriceInfo';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import PositionLiquidity from '@/components/PositionLiquidity';
import Preview from '@/components/Preview';
import PriceRange from '@/components/PriceRange';
import ReInvest from '@/components/ReInvest';
import Setting from '@/components/Setting';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Widget() {
  const { poolType, chainId, connectedAccount, onClose, positionId, onSubmitTx } = useWidgetStore(
    useShallow(s => ({
      poolType: s.poolType,
      chainId: s.chainId,
      connectedAccount: s.connectedAccount,
      onClose: s.onClose,
      positionId: s.positionId,
      onSubmitTx: s.onSubmitTx,
    })),
  );
  const { poolError } = usePoolStore(
    useShallow(s => ({
      poolError: s.poolError,
    })),
  );
  const { zapInfo, snapshotState, setSnapshotState } = useZapState();

  const nftManagerContract = getNftManagerContractAddress(poolType, chainId);
  const {
    isApproved: nftApproved,
    approve: approveNft,
    approvePendingTx: nftApprovePendingTx,
    checkApproval: checkNftApproval,
  } = useNftApproval({
    tokenId: +positionId,
    spender: zapInfo?.routerAddress || '',
    userAddress: connectedAccount?.address || '',
    rpcUrl: NETWORKS_INFO[chainId].defaultRpc,
    nftManagerContract,
    onSubmitTx: onSubmitTx,
  });

  return (
    <div className="ks-cw ks-cw-style">
      {poolError && (
        <Modal isOpen onClick={() => onClose()}>
          <div className="flex flex-col items-center gap-8 text-error">
            <ErrorIcon className="text-error" />
            <div className="text-center">{poolError}</div>
            <button className="ks-primary-btn w-[95%] bg-error border-solid border-error" onClick={onClose}>
              Close
            </button>
          </div>
        </Modal>
      )}
      {snapshotState && (
        <Modal isOpen onClick={() => setSnapshotState(null)} modalContentClass="!max-h-[96vh]">
          <Preview
            zapState={snapshotState}
            onDismiss={() => {
              checkNftApproval();
              setSnapshotState(null);
            }}
          />
        </Modal>
      )}

      <div className={`p-6 ${snapshotState ? 'hidden' : ''}`}>
        <Header />
        <div className="mt-5 flex gap-5 max-sm:flex-col">
          <div className="w-1/2 max-sm:w-full flex flex-col gap-4">
            <ReInvest />
            <div className="w-full flex justify-center">
              <ChevronLeftIcon className="-rotate-90 text-primary border border-primary rounded-full p-1 w-8 h-8 -mt-2 -mb-2" />
            </div>
            <PositionLiquidity />
            <PriceInfo />
            <PriceRange />
          </div>

          <div className="w-1/2 max-sm:w-full">
            <EstLiqValue />
          </div>
        </div>
        <Action nftApproved={nftApproved} nftApprovePendingTx={nftApprovePendingTx} approveNft={approveNft} />
      </div>
      <Setting />
    </div>
  );
}
