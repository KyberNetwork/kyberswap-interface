import { AlertTriangle } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ButtonError } from 'components/Button'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

import Modal from './Modal'

const ElasticDisclaimerModal = ({ isOpen, onOk }: { isOpen: boolean; onOk?: () => void }) => {
  const navigate = useNavigate()
  const theme = useTheme()

  return (
    <Modal isOpen={isOpen}>
      <Flex width="100%" flexDirection="column" padding="24px 20px">
        <Flex color={theme.red} fontWeight="500" fontSize="20px" sx={{ gap: '4px' }} alignItems="center">
          <AlertTriangle size={20} />
          Disclaimer
        </Flex>
        <Text marginTop="20px" fontSize="14px" lineHeight={1.5} marginBottom="20px">
          We have temporarily disabled this operation due to a <b>potential vulnerability</b> with KyberSwap Elastic
          pools. Our team has taken immediate action to address the vulnerability. However, as a precautionary measure,
          we advise all KyberSwap Elastic liquidity providers to withdraw their funds at this time. You can find more
          information <ExternalLink href="">here</ExternalLink>
        </Text>
        <ButtonError onClick={() => (onOk ? onOk() : navigate(-1))} style={{ backgroundColor: theme.red }}>
          I Understand
        </ButtonError>
      </Flex>
    </Modal>
  )
}

export default ElasticDisclaimerModal
