import { ButtonLight, ButtonPrimary } from 'components/Button'
import { HStack } from 'components/Stack'
import PreparedActionModal from 'pages/CopyTrading/modals/PreparedActionModal'
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

  const review = (
    <StartCopyReview
      agreed={flow.agreed}
      confirmBalanceError={flow.confirmBalanceError}
      isAuthorizing={flow.isAuthorizing}
      onAgreementChange={flow.setAgreed}
      preparedToken={flow.startPreview?.quoteToken}
      quoteToken={flow.capital.quoteToken}
      startPreview={flow.startPreview}
      targetCapitalRaw={flow.capital.targetCapitalRaw}
    />
  )

  const successActions = flow.createdCopyRun ? (
    <HStack className="w-full gap-3">
      <ButtonLight type="button" className="flex-1" onClick={flow.dismiss}>
        Close
      </ButtonLight>
      <ButtonPrimary type="button" className="flex-1" onClick={flow.viewCreatedCopy}>
        My Copy
      </ButtonPrimary>
    </HStack>
  ) : undefined

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={flow.dismiss}
      state={flow.flowState}
      title={<AgentHeader agent={agent} />}
      review={review}
      confirmLabel={flow.authorizationRequired ? flow.authorizationLabel : 'Start Copying'}
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
