import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useIsSmartAccount } from 'hooks/useIsSmartAccount'
import useTheme from 'hooks/useTheme'
import Actions from 'pages/Earns/components/SmartExit/Actions'
import Confirmation from 'pages/Earns/components/SmartExit/Confirmation'
import ExpireSetting from 'pages/Earns/components/SmartExit/ExpireSetting'
import GasSetting from 'pages/Earns/components/SmartExit/GasSetting'
import { GuidedHighlightProvider } from 'pages/Earns/components/SmartExit/GuidedHighlight'
import Metrics from 'pages/Earns/components/SmartExit/Metrics'
import PoolPrice from 'pages/Earns/components/SmartExit/PoolPrice'
import PositionHeader from 'pages/Earns/components/SmartExit/PositionHeader'
import PositionLiquidity from 'pages/Earns/components/SmartExit/PositionLiquidity'
import Warning, { OrTimeAlreadyMetWarning } from 'pages/Earns/components/SmartExit/Warning'
import { FOREVER_EXPIRE_TIME } from 'pages/Earns/components/SmartExit/constants'
import { useSmartExitDeadline } from 'pages/Earns/components/SmartExit/hooks/useSmartExitDeadline'
import { useSmartExitFeeEstimation } from 'pages/Earns/components/SmartExit/hooks/useSmartExitFeeEstimation'
import { useSmartExitValidation } from 'pages/Earns/components/SmartExit/hooks/useSmartExitValidation'
import { ContentWrapper } from 'pages/Earns/components/SmartExit/styles'
import { useSmartExit } from 'pages/Earns/components/SmartExit/useSmartExit'
import { defaultFeeYieldCondition } from 'pages/Earns/components/SmartExit/utils'
import { ConditionType, Metric, ParsedPosition, SelectedMetric } from 'pages/Earns/types'
import { useWalletModalToggle } from 'state/application/hooks'

interface SmartExitProps {
  position: ParsedPosition | null
  onDismiss: () => void
  isLoading?: boolean
}

export const SmartExit = ({ position, onDismiss, isLoading = false }: SmartExitProps) => {
  const theme = useTheme()
  const { isSmartConnector } = useWeb3React()
  const { chainId } = useActiveWeb3React()
  const isSmartAccount = useIsSmartAccount()
  // Cover both connector-level smart wallets (Porto, Safe) and account-level
  // smart wallets detected via bytecode / EIP-5792 capabilities (Coinbase
  // Smart Wallet via passkey, Argent, Ambire, EIP-7702 delegated EOAs).
  const isSmartWallet = isSmartConnector || isSmartAccount
  const chainName = NETWORKS_INFO[chainId]?.name ?? 'this network'
  const toggleWalletModal = useWalletModalToggle()
  const [selectedMetrics, setSelectedMetrics] = useState<Array<SelectedMetric | null>>([
    { metric: Metric.FeeYield, condition: defaultFeeYieldCondition },
  ])
  const [conditionType, setConditionType] = useState<ConditionType>(ConditionType.And)
  const [expireTime, setExpireTime] = useState(FOREVER_EXPIRE_TIME)
  const [showConfirm, setShowConfirm] = useState(false)
  const [revertPrice, setRevertPrice] = useState(false)

  const [multiplier, setMultiplier] = useState<number>(2)
  const [customGasPercent, setCustomGasPercent] = useState<string>('')

  const deadline = useSmartExitDeadline(expireTime)
  const { isValid, deadlineBeforeConditionTime, timeBeforeNow, orWithTimeAlreadyMet, conditionTime } =
    useSmartExitValidation(selectedMetrics, deadline, conditionType)

  const smartExit = useSmartExit({
    position,
    selectedMetrics,
    conditionType,
    deadline,
  })

  const { feeInfo, feeLoading } = useSmartExitFeeEstimation({
    isValid,
    estimateFee: smartExit.estimateFee,
  })

  const positionLoading = isLoading || !position

  const maxGasPercent = customGasPercent ? parseFloat(customGasPercent) : (feeInfo?.gas.percentage || 0) * multiplier
  const isGasTooHigh = maxGasPercent >= 100

  const disabled = positionLoading || !isValid || !feeInfo || feeLoading || isGasTooHigh

  return (
    <Modal
      isOpen
      mobileFullWidth
      onDismiss={onDismiss}
      width="100vw"
      maxWidth={isSmartWallet ? 480 : showConfirm ? 450 : 800}
      bgColor={theme.background}
      padding="20px"
    >
      <div className="flex w-full flex-col">
        {isSmartWallet ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">
                <Trans>Smart Exit unavailable with your current wallet</Trans>
              </span>
              <X onClick={onDismiss} className="cursor-pointer" />
            </div>
            <span className="text-sm text-subText">
              <Trans>
                Smart wallets (Porto, Safe, Coinbase Smart Wallet, Argent, Ambire, ...) — including EOAs upgraded to a
                smart account via EIP-7702 on {chainName} — aren&apos;t compatible with Smart Exit because the position
                permit can&apos;t verify their contract signatures. Switch to a standard EOA wallet (e.g. MetaMask,
                Rabby) that hasn&apos;t been upgraded to use this feature.
              </Trans>
            </span>
            <div className="mt-2 flex justify-end">
              <ButtonPrimary
                width="fit-content"
                padding="8px 16px"
                onClick={() => {
                  onDismiss()
                  toggleWalletModal()
                }}
              >
                <Trans>Switch wallet</Trans>
              </ButtonPrimary>
            </div>
          </div>
        ) : showConfirm && position ? (
          <Confirmation
            selectedMetrics={selectedMetrics.filter(metric => metric !== null) as SelectedMetric[]}
            conditionType={conditionType}
            deadline={deadline}
            position={position}
            onDismiss={() => setShowConfirm(false)}
            onCloseSmartExit={onDismiss}
            feeSettings={{
              protocolFee: feeInfo?.protocol.percentage || 0,
              maxGas: customGasPercent ? parseFloat(customGasPercent) : (feeInfo?.gas.percentage || 0) * multiplier,
            }}
            createSmartExitOrder={smartExit.createSmartExitOrder}
            isCreating={smartExit.isCreating}
            isSuccess={smartExit.isSuccess}
            revertPrice={revertPrice}
          />
        ) : (
          <GuidedHighlightProvider selectedMetrics={selectedMetrics}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xl font-medium">
                <Trans>Set Up Smart Exit</Trans>
              </span>
              <X onClick={onDismiss} className="cursor-pointer" />
            </div>

            <div className="flex items-center justify-between">
              <PositionHeader position={position} isLoading={positionLoading} initialLoading={positionLoading} />
              <ExpireSetting expireTime={expireTime} setExpireTime={setExpireTime} />
            </div>

            <ContentWrapper>
              <div className="flex flex-1 flex-col gap-4">
                <PositionLiquidity position={position} isLoading={positionLoading} />
                <PoolPrice
                  position={position}
                  isLoading={positionLoading}
                  revertPrice={revertPrice}
                  setRevertPrice={setRevertPrice}
                />
                {orWithTimeAlreadyMet && conditionTime && <OrTimeAlreadyMetWarning conditionTime={conditionTime} />}
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <Metrics
                  position={position}
                  selectedMetrics={selectedMetrics}
                  setSelectedMetrics={setSelectedMetrics}
                  conditionType={conditionType}
                  setConditionType={setConditionType}
                  isLoading={positionLoading}
                  revertPrice={revertPrice}
                />
                <GasSetting
                  feeInfo={feeInfo}
                  multiplier={multiplier}
                  setMultiplier={setMultiplier}
                  customGasPercent={customGasPercent}
                  setCustomGasPercent={setCustomGasPercent}
                  isLoading={positionLoading}
                />
                <Warning
                  deadlineBeforeConditionTime={deadlineBeforeConditionTime}
                  timeBeforeNow={timeBeforeNow}
                  isGasTooHigh={isGasTooHigh}
                />
              </div>
            </ContentWrapper>

            <Actions
              onDismiss={onDismiss}
              onPreview={() => !disabled && setShowConfirm(true)}
              disabled={disabled}
              feeLoading={feeLoading}
              positionLoading={positionLoading}
            />
          </GuidedHighlightProvider>
        )}
      </div>
    </Modal>
  )
}
