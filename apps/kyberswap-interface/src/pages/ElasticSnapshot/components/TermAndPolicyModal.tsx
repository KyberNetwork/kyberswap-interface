import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import CheckBox from 'components/CheckBox'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

export default function TermAndPolicyModal({
  isOpen,
  onDismiss,
  onOk,
}: {
  isOpen: boolean
  onDismiss: () => void
  onOk: () => void
}) {
  const theme = useTheme()
  const [accept1, setAccept1] = useState(false)
  const [accept2, setAccept2] = useState(false)
  const [accept3, setAccept3] = useState(false)
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth="800px" width="100%">
      <Flex
        flexDirection="column"
        padding="20px"
        bg={theme.background}
        width="100%"
        lineHeight={1.5}
        sx={{
          position: 'relative',
          fontSize: '14px',
          gap: '24px',
          lineHeight: 1.5,
          textAlign: 'justify',
        }}
      >
        <ButtonEmpty
          onClick={() => {
            onDismiss()
          }}
          width="36px"
          height="36px"
          padding="0"
          style={{ position: 'absolute', right: '1rem', top: '1rem' }}
        >
          <X color={theme.text} />
        </ButtonEmpty>

        <Text color={theme.text} fontSize="20px" fontWeight="500" textAlign="center">
          Terms and Conditions
        </Text>

        <Flex
          alignItems="flex-start"
          sx={{ gap: '8px', cursor: 'pointer' }}
          onClick={() => setAccept1(prev => !prev)}
          role="button"
        >
          <CheckBox checked={accept1} />
          <Text marginTop="-4px">
            I understand that my participation in the [KyberSwap Elastic Exploit Grant Program] (“Grant Program”) will
            be subject to my completion of KYC screening to the satisfaction of KyberSwap and further subject to terms
            (“Terms of Grant”) to be published by KyberSwap, which Terms of Grant will include terms that require return
            of all or part of any grant to me pursuant to the Grant Program in the event of my full or partial recovery
            of assets taken from me in the KyberSwap Elastic Exploit.
          </Text>
        </Flex>

        <Flex
          alignItems="flex-start"
          sx={{ gap: '8px', cursor: 'pointer' }}
          onClick={() => setAccept2(prev => !prev)}
          role="button"
        >
          <CheckBox checked={accept2} />
          <Text marginTop="-4px">
            I further understand that I will have to read and agree to the Terms of Grant as and when published before I
            will be eligible to be considered for or to receive any grant as KyberSwap may decide to extend to me
            pursuant to the Terms of Grant.
          </Text>
        </Flex>

        <Flex
          alignItems="flex-start"
          sx={{ gap: '8px', cursor: 'pointer' }}
          onClick={() => setAccept3(prev => !prev)}
          role="button"
        >
          <CheckBox checked={accept3} />
          <Text marginTop="-4px">
            I acknowledge I have read and agree to the{' '}
            <ExternalLink href="https://kyberswap.com/files/Kyber%20-%20Privacy%20Policy%20-%2020%20November%202023.pdf">
              KyberSwap Privacy Policy
            </ExternalLink>{' '}
            which I agree will apply to any personal data provided by me in connection with the above mentioned KYC
            screening and my participation in the Grant Program.
          </Text>
        </Flex>

        <Flex marginTop="16px" sx={{ gap: '1rem' }}>
          <ButtonOutlined onClick={onDismiss}>
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          <ButtonPrimary
            onClick={() => {
              if (accept1 && accept2 && accept3) onOk()
            }}
            disabled={!accept1 || !accept2 || !accept3}
          >
            Proceed with KYC
          </ButtonPrimary>
        </Flex>
      </Flex>
    </Modal>
  )
}
