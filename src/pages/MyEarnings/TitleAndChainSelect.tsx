import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import CurrentChainButton from 'pages/MyEarnings/CurrentChainButton'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'

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

const TitleAndChainSelect = () => {
  return (
    <Wrapper>
      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '24px',
          lineHeight: '28px',
          whiteSpace: 'nowrap',
        }}
      >
        My Earnings
      </Text>

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

export default TitleAndChainSelect
