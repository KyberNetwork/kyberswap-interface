import { rgba } from 'polished'
import { Share2 } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RefreshIcon } from 'assets/svg/refresh.svg'
import useTheme from 'hooks/useTheme'
import CurrentChainButton from 'pages/MyEarnings/CurrentChainButton'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'

const formatValue = (value: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'standard',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(value)
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
    gap: 24px;
    align-items: initial;
    justify-content: initial;

    ${MultipleChainSelect} {
      flex: 1;
    }
  `}
`

type Props = {
  totalEarnings: number
}
const TotalEarningsAndChainSelect: React.FC<Props> = ({ totalEarnings }) => {
  const theme = useTheme()

  return (
    <Wrapper>
      <Flex
        sx={{
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Text
          as="span"
          sx={{
            fontWeight: 500,
            fontSize: '36px',
            lineHeight: '44px',
            whiteSpace: 'nowrap',
            flex: '0 0 max-content',
          }}
        >
          {formatValue(totalEarnings)}
        </Text>

        <Flex
          sx={{
            flex: '0 0 max-content',
            alignItems: 'center',
            justifyContent: 'center',
            height: '36px',
            padding: '0 12px',
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '20px',
            color: theme.primary,
            background: rgba(theme.primary, 0.3),
            borderRadius: '999px',
          }}
        >
          12.23%
        </Flex>

        <Flex
          sx={{
            flex: '0 0 36px',
            alignItems: 'center',
            justifyContent: 'center',
            height: '36px',
            borderRadius: '999px',
            color: theme.subText,
            background: theme.background,
          }}
        >
          <Share2 size="16px" />
        </Flex>

        <Flex
          sx={{
            flex: '0 0 36px',
            alignItems: 'center',
            justifyContent: 'center',
            height: '36px',
            borderRadius: '999px',
            color: theme.subText,
            background: theme.background,
          }}
        >
          <RefreshIcon width="17px" height="17px" />
        </Flex>
      </Flex>

      <Flex
        alignItems="center"
        sx={{
          gap: '16px',
        }}
      >
        <CurrentChainButton />
        <MultipleChainSelect />
      </Flex>
    </Wrapper>
  )
}

export default TotalEarningsAndChainSelect
