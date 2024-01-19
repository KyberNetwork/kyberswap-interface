import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { Flex, Text } from 'rebass'
import { useCreateOptionMutation } from 'services/commonService'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useNotify } from 'state/application/hooks'

const Option = styled.div<{ disabled: boolean; active: boolean }>`
  border: 1px solid ${({ theme, active }) => (active ? theme.primary : theme.border)};
  background: ${({ theme, active }) => (active ? rgba(theme.primary, 0.2) : theme.buttonGray)};
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  gap: 8px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s;
`
const Opt = styled.div<{ active: boolean }>`
  text-shadow: ${({ theme, active }) => (active ? `0px 0px 3px ${theme.primary}` : undefined)};
  color: ${({ theme, active }) => (!active ? theme.subText : theme.primary)};
  width: 40px;
  height: 40px;
  font-size: 24px;
  font-weight: 500;
  line-height: 40px;
  text-align: center;
`

export default function ChooseGrantModal({
  isOpen,
  onDismiss,
  userSelectedOption,
}: {
  isOpen: boolean
  onDismiss: () => void
  userSelectedOption?: string
}) {
  const theme = useTheme()

  const options = {
    A: t`USD stablecoins equivalent to 60% of the Reference Value of Lost Affected Assets contributed from such Affected Address, vested continuously on a linear basis over 3 months.`,
    B: t`USD stablecoins equivalent to 100% of the Reference Value of Lost Affected Assets contributed from such Affected Address, vested continuously on a linear basis over 12 months.`,
    // C: t`Opt out.`,
  }

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

  // const [isAcceptTerm, setIsAcceptTerm] = useState(false)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth="480px" width="100%">
      <Flex flexDirection="column" padding="20px" bg={theme.background} width="100%" lineHeight={1.5}>
        <Text color={theme.text} fontSize="20px" fontWeight="500" textAlign="center">
          <Trans>Treasury Grant Options</Trans>
        </Text>

        <Text fontSize="12px" marginTop="24px" color={theme.subText} textAlign="justify">
          <Trans>
            KyberSwap Elastic Exploit Treasury Grant Program (“Program”) will support Affected Users who have lost
            Affected Assets to the KyberSwap Elastic Exploit. Under the Program, an Affected User who fulfils
            Eligibility Requirements can choose from one of the following options for the Treasury Grants in respect of
            each Affected Address of such Affected User.
          </Trans>
        </Text>

        <Flex flexDirection="column" sx={{ gap: '12px' }} marginTop="24px">
          {Object.keys(options).map(opt => {
            return (
              <Option
                key={opt}
                onClick={() => !loading && !userSelectedOption && setSelectedOption(opt)}
                active={selectedOption === opt}
                disabled={!!userSelectedOption}
                role="button"
              >
                <Opt active={selectedOption === opt}>{opt}</Opt>
                <Text flex={1} fontSize="12px">
                  {options[opt]}
                </Text>
              </Option>
            )
          })}
        </Flex>

        {!userSelectedOption && (
          <Text marginTop="6px" fontSize="12px" color={theme.warning}>
            <Trans>Once you make a selection, you are unable to change your choice.</Trans>
          </Text>
        )}

        {userSelectedOption ? (
          <Flex marginTop="24px">
            <ButtonOutlined onClick={onDismiss}>
              <Trans>Close</Trans>
            </ButtonOutlined>
          </Flex>
        ) : (
          <>
            {/* <TermAndCondition onClick={() => setIsAcceptTerm(prev => !prev)} style={{ marginTop: '24px' }}>
              <input
                type="checkbox"
                checked={isAcceptTerm}
                data-testid="accept-term"
                style={{ marginRight: '12px', height: '14px', width: '14px', minWidth: '14px', cursor: 'pointer' }}
              />
              <Text color={theme.subText}>
                <Trans>Accept </Trans>{' '}
                <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS} onClick={e => e.stopPropagation()}>
                  <Trans>KyberSwap&lsquo;s Terms of Use</Trans>
                </ExternalLink>{' '}
                <Trans>and</Trans>{' '}
                <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY} onClick={e => e.stopPropagation()}>
                  <Trans>Privacy Policy</Trans>
                </ExternalLink>
              </Text>
            </TermAndCondition>
            */}
            <Flex marginTop="16px" sx={{ gap: '1rem' }}>
              <ButtonOutlined onClick={onDismiss}>
                <Trans>Rethink</Trans>
              </ButtonOutlined>
              <ButtonPrimary onClick={signMessage} disabled={!selectedOption || loading}>
                {loading ? <Dots>Signing</Dots> : <Trans>Sign with your wallet</Trans>}
              </ButtonPrimary>
            </Flex>
          </>
        )}
      </Flex>
    </Modal>
  )
}
