import { X as Xsvg } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { LIMIT_TEXT_STYLES } from 'pages/Earns/constants'
import { formatDisplayNumber } from 'utils/numbers'

export const Wrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`

export const ModalHeader = styled.div`
  display: flex;
  justify-content: center;
  position: relative;
  width: 100%;
`

export const X = styled(Xsvg)`
  position: absolute;
  right: 0;
  top: 0;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    color: ${({ theme }) => theme.text};
  }
`

export const ClaimInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`

export const ClaimInfo = styled.div`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: #0f0f0f;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const ClaimInfoRow = ({
  tokenImage,
  dexImage,
  tokenAmount,
  tokenSymbol,
  tokenUsdValue,
}: {
  tokenImage: string
  dexImage: string
  tokenAmount: string | number
  tokenSymbol: string
  tokenUsdValue: number
}) => {
  const theme = useTheme()

  return (
    <Flex alignItems={'center'} sx={{ gap: '6px' }}>
      <Flex alignItems={'flex-end'}>
        <TokenLogo src={tokenImage} alt="tokenImage" />
        <TokenLogo src={dexImage} size={14} alt="dexImage" />
      </Flex>
      <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '100px' }}>
        {formatDisplayNumber(tokenAmount, {
          significantDigits: 4,
        })}
      </Text>
      <Text>{tokenSymbol}</Text>
      <Text color={theme.subText} sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '80px' }}>
        {formatDisplayNumber(tokenUsdValue, {
          style: 'currency',
          significantDigits: 4,
        })}
      </Text>
    </Flex>
  )
}
