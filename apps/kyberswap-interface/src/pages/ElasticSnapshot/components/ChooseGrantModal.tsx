import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useCreateOptionMutation } from 'services/commonService'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { cn } from 'utils/cn'

export default function ChooseGrantModal({
  isOpen,
  onDismiss,
  userSelectedOption,
}: {
  isOpen: boolean
  onDismiss: () => void
  userSelectedOption?: string
}) {
  const options = {
    A: t`USD stablecoins equivalent to 60% of the Reference Value of Lost Affected Assets contributed from such Affected Address, vested continuously on a linear basis over 3 months.`,
    B: t`USD stablecoins equivalent to 100% of the Reference Value of Lost Affected Assets contributed from such Affected Address, vested continuously on a linear basis over 12 months.`,
  }

  const accountOnlyOptionB = [
    '0x3872afe887ced05d353252a88a2acebdacda5071',
    '0x87b1594e6e8b8fee7b14cd77a5c2324e31a7bcd4',
    '0x2244cfdb499a05c8f08a548f75a13c7485fe9433',
    '0xee2147fcf090ce08095e65a3c9e193c459364d5b',
    '0x00e6bc5f73ef330c5f553554dcec8a863db84a23',
    '0xcab9760e56bfd28803b41cac1e6616704aa5ecce',
    '0xd5c6519a51a840398c4444c2fbd9d34820baa10c',
  ]

  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState(userSelectedOption || '')
  useEffect(() => {
    if (userSelectedOption) setSelectedOption(userSelectedOption)
  }, [userSelectedOption])

  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [createOption] = useCreateOptionMutation()
  const notify = useNotify()

  const signMessage = () => {
    const message = (() => {
      switch (selectedOption) {
        case 'A':
          return 'I confirm choosing Option A - USD stablecoins equivalent to 60% of the Reference Value of Lost Affected Assets contributed from such Affected Address, vested continuously on a linear basis over 3 months.'
        case 'B':
          return 'I confirm choosing Option B - USD stablecoins equivalent to 100% of the Reference Value of Lost Affected Assets contributed from such Affected Address, vested continuously on a linear basis over 12 months.'
        case 'C':
        default:
          return 'I confirm choosing Option C - Opt out.'
      }
    })()
    setLoading(true)
    library
      ?.getSigner()
      .signMessage(message)
      .then(async signature => {
        if (signature && account) {
          const res = await createOption({
            walletAddress: account,
            signature,
            message,
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((res as any)?.data?.code === 0) {
            notify({
              title: t`Choose option successfully`,
              summary: t`You have chosen option ${selectedOption} for KyberSwap Elastic Exploit Treasury Grant Program`,
              type: NotificationType.SUCCESS,
            })
            onDismiss()
          } else {
            notify({
              title: t`Error`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              summary: (res as any).error?.data?.message || t`Something went wrong`,
              type: NotificationType.ERROR,
            })
          }
        } else {
          notify({
            title: t`Error`,
            summary: t`Something went wrong`,
            type: NotificationType.ERROR,
          })
        }
      })
      .finally(() => setLoading(false))
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth="480px" width="100%">
      <div className="flex w-full flex-col bg-background p-5 leading-normal">
        <span className="text-center text-xl font-medium text-text">
          <Trans>Treasury Grant Options</Trans>
        </span>

        <span className="mt-6 text-justify text-xs text-subText">
          <Trans>
            KyberSwap Elastic Exploit Treasury Grant Program (“Program”) will support Affected Users who have lost
            Affected Assets to the KyberSwap Elastic Exploit. Under the Program, an Affected User who fulfils
            Eligibility Requirements can choose from one of the following options for the Treasury Grants in respect of
            each Affected Address of such Affected User.
          </Trans>
        </span>

        <div className="mt-6 flex flex-col gap-3">
          {Object.keys(options).map(opt => {
            const disabled = opt === 'A' && accountOnlyOptionB.includes(account?.toLowerCase() ?? '')
            const active = selectedOption === opt
            return (
              <div
                key={opt}
                onClick={() => !disabled && !loading && !userSelectedOption && setSelectedOption(opt)}
                role="button"
                className={cn(
                  'flex items-center gap-2 rounded-2xl border border-solid p-3 transition-all duration-200',
                  active ? 'border-primary bg-primary-20' : 'border-border bg-buttonGray',
                  !!userSelectedOption || disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                )}
              >
                <div
                  className={cn(
                    'size-10 text-center text-2xl font-medium leading-10',
                    active ? 'text-primary [text-shadow:0px_0px_3px_var(--ks-primary)]' : 'text-subText',
                  )}
                >
                  {opt}
                </div>
                <span className="flex-1 text-xs">{options[opt as keyof typeof options]}</span>
              </div>
            )
          })}
        </div>

        {!userSelectedOption && (
          <span className="mt-1.5 text-xs text-warning">
            <Trans>Once you make a selection, you are unable to change your choice.</Trans>
          </span>
        )}

        {userSelectedOption ? (
          <div className="mt-6 flex">
            <ButtonOutlined onClick={onDismiss}>
              <Trans>Close</Trans>
            </ButtonOutlined>
          </div>
        ) : (
          <div className="mt-4 flex gap-4">
            <ButtonOutlined onClick={onDismiss}>
              <Trans>Rethink</Trans>
            </ButtonOutlined>
            <ButtonPrimary onClick={signMessage} disabled={!selectedOption || loading}>
              {loading ? <Dots>Signing</Dots> : <Trans>Sign with your wallet</Trans>}
            </ButtonPrimary>
          </div>
        )}
      </div>
    </Modal>
  )
}
