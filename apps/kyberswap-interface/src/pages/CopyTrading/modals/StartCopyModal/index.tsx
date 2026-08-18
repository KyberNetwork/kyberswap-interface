import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import { AgentHeader, StartCopyForm, StartCopyReview } from 'pages/CopyTrading/modals/StartCopyModal/components'
import type { StartCopyTarget } from 'pages/CopyTrading/modals/StartCopyModal/startCopy'
import { useStartCopyFlow } from 'pages/CopyTrading/modals/StartCopyModal/useStartCopyFlow'

type StartCopyModalProps = {
  isOpen: boolean
  onDismiss: () => void
  agent: StartCopyTarget
}

const StartCopyModal = ({ isOpen, onDismiss, agent }: StartCopyModalProps) => {
  const flow = useStartCopyFlow({ agent, onDismiss })

  const reviewPreparing = flow.flowState.phase === 'review' && flow.flowState.isPreparing === true

  const review = (
    <StartCopyReview
      agreed={flow.agreed}
      confirmBalanceError={flow.confirmBalanceError}
      isAuthorizing={flow.isAuthorizing}
      isLoading={reviewPreparing}
      onAgreementChange={flow.setAgreed}
      preparedToken={flow.startPreview?.quoteToken}
      quoteToken={flow.capital.quoteToken}
      startPreview={flow.startPreview}
      targetCapitalRaw={flow.capital.amountRaw}
    />
  )

  const successActions = flow.createdCopyRun ? (
    <PreparedActionSuccessActions onClose={flow.dismiss} onPrimaryAction={flow.viewMyCopies} primaryLabel="My Copies" />
  ) : undefined

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={flow.dismiss}
      state={flow.flowState}
      title={<AgentHeader agent={agent} />}
      review={review}
      confirmLabel={
        reviewPreparing ? 'Preparing' : flow.authorizationRequired ? flow.authorizationLabel : 'Start Copying'
      }
      confirmLoading={flow.isAuthorizing}
      confirmDisabled={!flow.agreed || !!flow.confirmBalanceError}
      onBack={flow.flowState.hash ? undefined : flow.editAmount}
      onConfirm={() => void flow.confirmStartCopy()}
      onRetry={flow.retry}
      successTitle={"You're now copying " + agent.displayName}
      successText="The transaction is confirmed and your new Copy is ready."
      successActions={successActions}
      width={520}
    >
      <StartCopyForm
        accountConnected={flow.accountConnected}
        agent={agent}
        amount={flow.capital.amount}
        amountError={flow.capital.amountError}
        amountIsValid={flow.capital.amountIsValid}
        availabilityMessage={flow.availabilityMessage}
        isPreparing={flow.flowState.isPreparing === true}
        onAmountChange={value => {
          flow.capital.setAmount(value)
          flow.setAgreed(false)
        }}
        onExpectedChain={flow.capital.onExpectedChain}
        onPercentageChange={flow.setPercentageAmount}
        onPrimaryAction={flow.handlePrimaryAction}
        presetAmounts={flow.capital.presetAmounts}
        presetsEnabled={flow.capital.presetsEnabled}
        primaryActionLabel={flow.primaryActionLabel}
        quoteCurrency={flow.capital.quoteCurrency}
        walletBalanceText={flow.capital.walletBalanceText}
      />
    </PreparedActionModal>
  )
}

export default StartCopyModal
