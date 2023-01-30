import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: stretch;
  > * {
    width: calc(33.33% - 24px * 2 / 3);
  }

  @media only screen and (max-width: 768px) {
    gap: 16px;
    > * {
      width: calc(50% - 16px * 1 / 2);
    }
  }
  @media only screen and (max-width: 450px) {
    > * {
      width: 100%;
    }
  } ;
`

const ArticleWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
`
const ArticleImage = styled.div`
  background-color: ${({ theme }) => theme.background2};
  border-radius: 8px;
  height: 160px;
`
export default function News() {
  const theme = useTheme()
  return (
    <Wrapper>
      <ArticleWrapper>
        <ArticleImage />
        <div style={{ padding: '16px' }}>
          <Text fontSize={12} lineHeight="16px" color={theme.subText} style={{ textTransform: 'uppercase' }}>
            COINTELEGRAPH
          </Text>
          <Text fontSize={14} lineHeight="20px" color={theme.text} marginTop="8px" marginBottom="16px">
            USDC whale holdings percentage lowest in almost two years
          </Text>
          <Text fontSize={12} lineHeight="16px" color={theme.border}>
            08/22/2022, 4:35PM
          </Text>
        </div>
      </ArticleWrapper>
      <ArticleWrapper>
        <ArticleImage />
        <div style={{ padding: '16px' }}>
          <Text fontSize={12} lineHeight="16px" color={theme.subText} style={{ textTransform: 'uppercase' }}>
            COINTELEGRAPH
          </Text>
          <Text fontSize={14} lineHeight="20px" color={theme.text} marginTop="8px" marginBottom="16px">
            USDC whale holdings percentage lowest in almost two years
          </Text>
          <Text fontSize={12} lineHeight="16px" color={theme.border}>
            08/22/2022, 4:35PM
          </Text>
        </div>
      </ArticleWrapper>
      <ArticleWrapper>
        <ArticleImage />
        <div style={{ padding: '16px' }}>
          <Text fontSize={12} lineHeight="16px" color={theme.subText} style={{ textTransform: 'uppercase' }}>
            COINTELEGRAPH
          </Text>
          <Text fontSize={14} lineHeight="20px" color={theme.text} marginTop="8px" marginBottom="16px">
            USDC whale holdings percentage lowest in almost two years
          </Text>
          <Text fontSize={12} lineHeight="16px" color={theme.border}>
            08/22/2022, 4:35PM
          </Text>
        </div>
      </ArticleWrapper>
      <ArticleWrapper>
        <ArticleImage />
        <div style={{ padding: '16px' }}>
          <Text fontSize={12} lineHeight="16px" color={theme.subText} style={{ textTransform: 'uppercase' }}>
            COINTELEGRAPH
          </Text>
          <Text fontSize={14} lineHeight="20px" color={theme.text} marginTop="8px" marginBottom="16px">
            USDC whale holdings percentage lowest in almost two years
          </Text>
          <Text fontSize={12} lineHeight="16px" color={theme.border}>
            08/22/2022, 4:35PM
          </Text>
        </div>
      </ArticleWrapper>
      <ArticleWrapper>
        <ArticleImage />
        <div style={{ padding: '16px' }}>
          <Text fontSize={12} lineHeight="16px" color={theme.subText} style={{ textTransform: 'uppercase' }}>
            COINTELEGRAPH
          </Text>
          <Text fontSize={14} lineHeight="20px" color={theme.text} marginTop="8px" marginBottom="16px">
            USDC whale holdings percentage lowest in almost two years
          </Text>
          <Text fontSize={12} lineHeight="16px" color={theme.border}>
            08/22/2022, 4:35PM
          </Text>
        </div>
      </ArticleWrapper>
      <ArticleWrapper>
        <ArticleImage />
        <div style={{ padding: '16px' }}>
          <Text fontSize={12} lineHeight="16px" color={theme.subText} style={{ textTransform: 'uppercase' }}>
            COINTELEGRAPH
          </Text>
          <Text fontSize={14} lineHeight="20px" color={theme.text} marginTop="8px" marginBottom="16px">
            USDC whale holdings percentage lowest in almost two years
          </Text>
          <Text fontSize={12} lineHeight="16px" color={theme.border}>
            08/22/2022, 4:35PM
          </Text>
        </div>
      </ArticleWrapper>
      <ArticleWrapper>
        <ArticleImage />
        <div style={{ padding: '16px' }}>
          <Text fontSize={12} lineHeight="16px" color={theme.subText} style={{ textTransform: 'uppercase' }}>
            COINTELEGRAPH
          </Text>
          <Text fontSize={14} lineHeight="20px" color={theme.text} marginTop="8px" marginBottom="16px">
            USDC whale holdings percentage lowest in almost two years
          </Text>
          <Text fontSize={12} lineHeight="16px" color={theme.border}>
            08/22/2022, 4:35PM
          </Text>
        </div>
      </ArticleWrapper>
      <ArticleWrapper>
        <ArticleImage />
        <div style={{ padding: '16px' }}>
          <Text fontSize={12} lineHeight="16px" color={theme.subText} style={{ textTransform: 'uppercase' }}>
            COINTELEGRAPH
          </Text>
          <Text fontSize={14} lineHeight="20px" color={theme.text} marginTop="8px" marginBottom="16px">
            USDC whale holdings percentage lowest in almost two years
          </Text>
          <Text fontSize={12} lineHeight="16px" color={theme.border}>
            08/22/2022, 4:35PM
          </Text>
        </div>
      </ArticleWrapper>
      <ArticleWrapper>
        <ArticleImage />
        <div style={{ padding: '16px' }}>
          <Text fontSize={12} lineHeight="16px" color={theme.subText} style={{ textTransform: 'uppercase' }}>
            COINTELEGRAPH
          </Text>
          <Text fontSize={14} lineHeight="20px" color={theme.text} marginTop="8px" marginBottom="16px">
            USDC whale holdings percentage lowest in almost two years
          </Text>
          <Text fontSize={12} lineHeight="16px" color={theme.border}>
            08/22/2022, 4:35PM
          </Text>
        </div>
      </ArticleWrapper>
      <ArticleWrapper>
        <ArticleImage />
        <div style={{ padding: '16px' }}>
          <Text fontSize={12} lineHeight="16px" color={theme.subText} style={{ textTransform: 'uppercase' }}>
            COINTELEGRAPH
          </Text>
          <Text fontSize={14} lineHeight="20px" color={theme.text} marginTop="8px" marginBottom="16px">
            USDC whale holdings percentage lowest in almost two years
          </Text>
          <Text fontSize={12} lineHeight="16px" color={theme.border}>
            08/22/2022, 4:35PM
          </Text>
        </div>
      </ArticleWrapper>
    </Wrapper>
  )
}
