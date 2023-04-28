import { rgba } from 'polished'
import { Info } from 'react-feather'
import { Flex } from 'rebass'
import styled, { useTheme } from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 16px;
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  color: white;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  padding: 12px 16px;
`

type Props = {
  text: React.ReactNode
  className?: string
}
const Note: React.FC<Props> = ({ className, text }) => {
  const theme = useTheme()
  return (
    <Wrapper className={className}>
      <Flex
        sx={{
          alignItems: 'center',
          gap: '8px',
          transition: 'all 150ms linear',
        }}
      >
        <Flex width="16px" height="16px" flex="0 0 16px">
          <Info size={16} color={theme.subText} />
        </Flex>
        <Flex
          flexDirection="column"
          flex="1 1 0"
          color={theme.text}
          sx={{
            gap: '8px',
          }}
        >
          {text}
        </Flex>
      </Flex>
    </Wrapper>
  )
}

export default Note
