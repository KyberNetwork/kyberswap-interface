import { Trans, t } from '@lingui/macro'
import { X } from 'react-feather'
import { useGetSmartExitConfigQuery } from 'services/smartExit'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useIsSmartAccount } from 'hooks/useIsSmartAccount'
import { PermitNftState, usePermitNft } from 'hooks/usePermitNft'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import Condition from 'pages/Earns/components/SmartExit/Confirmation/Condition'
import MoreInfo from 'pages/Earns/components/SmartExit/Confirmation/MoreInfo'
import Success from 'pages/Earns/components/SmartExit/Confirmation/Success'
import { ConditionType, ParsedPosition, SelectedMetric } from 'pages/Earns/types'
import { useNotify } from 'state/application/hooks'

export default function Confirmation({
  selectedMetrics,
  position,
  deadline,
  conditionType,
  feeSettings: { protocolFee, maxGas },
  onDismiss,
  onCloseSmartExit,
  createSmartExitOrder,
  isCreating,
  isSuccess,
  revertPrice = false,
}: {
  selectedMetrics: SelectedMetric[]
  position: ParsedPosition
  conditionType: ConditionType
  deadline: number
  feeSettings: { protocolFee: number; maxGas: number }
  onDismiss: () => void
  onCloseSmartExit: () => void
  createSmartExitOrder: (opts: { maxGas: number; permitData: string }) => Promise<boolean>
  isCreating: boolean
  isSuccess: boolean
  revertPrice?: boolean
}) {
  const { chainId } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const isSmartAccount = useIsSmartAccount()
  // Match usePermitNft's smart-account gate so the button doesn't sit on
  // PermitNftState.NOT_APPLICABLE silently — clicking would no-op and leave
  // the user stuck without an explanation. Covers Coinbase Smart Wallet via
  // passkey, Argent, Ambire, EIP-7702 EOAs in addition to connector-level
  // smart wallets (Porto, Safe).
  const isSmartWallet = isSmartConnector || isSmartAccount
  const { changeNetwork } = useChangeNetwork()
  const notify = useNotify()
  const { data: smartExitConfig } = useGetSmartExitConfigQuery(position.chain.id)
  const { permitState, signPermitNft, permitData } = usePermitNft({
    contractAddress: position.positionId.split('-')[0],
    tokenId: position.tokenId,
    spender: smartExitConfig?.smartIntentAddress ?? '',
    deadline,
  })

  if (isSuccess) return <Success onDismiss={onDismiss} onCloseSmartExit={onCloseSmartExit} />

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconArrowLeft onClick={onDismiss} />
          <span className="text-xl font-medium">
            <Trans>Confirmation</Trans>
          </span>
        </div>
        <X onClick={onDismiss} />
      </div>

      <Condition
        position={position}
        selectedMetrics={selectedMetrics}
        conditionType={conditionType}
        revertPrice={revertPrice}
      />
      <MoreInfo deadline={deadline} protocolFee={protocolFee} maxGas={maxGas} />

      <p className="my-4 text-sm italic text-subText">
        <Trans>
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions
        </Trans>
      </p>

      <ButtonPrimary
        disabled={Boolean(permitState === PermitNftState.SIGNING || isCreating || !maxGas)}
        onClick={async () => {
          if (!maxGas) return
          if (chainId !== position.chain.id) {
            changeNetwork(position.chain.id)
            return
          }

          if (isSmartWallet) {
            // Smart wallets produce EIP-1271 signatures that the NFT contract's
            // ecrecover-based permit can't verify, so the order would fail on
            // execution even if we let it sign here.
            notify({
              type: NotificationType.ERROR,
              title: t`Smart Wallet not supported`,
              summary: t`Smart Exit requires a regular EOA wallet (e.g. MetaMask, Rabby) that hasn't been upgraded to a smart account (e.g. via EIP-7702) to sign the position permit. Please reconnect with a non-smart wallet.`,
            })
            return
          }

          if (permitState !== PermitNftState.SIGNED || !permitData?.permitData) {
            await signPermitNft()
            return
          }

          await createSmartExitOrder({ maxGas, permitData: permitData.permitData })
        }}
      >
        {chainId !== position.chain.id ? (
          <Trans>Switch Network</Trans>
        ) : isCreating ? (
          <Trans>Creating Order...</Trans>
        ) : permitState === PermitNftState.SIGNED ? (
          <Trans>Confirm Smart Exit</Trans>
        ) : permitState === PermitNftState.SIGNING ? (
          <Trans>Signing...</Trans>
        ) : (
          <Trans>Permit NFT</Trans>
        )}
      </ButtonPrimary>
    </>
  )
}
