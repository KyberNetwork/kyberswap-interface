import { transparentize } from 'polished'
import { useState } from 'react'
import { Text } from 'rebass'
import styled, { CSSProperties, DefaultTheme, css, keyframes } from 'styled-components'

import { ReactComponent as Alert } from 'assets/images/alert.svg'
import { AutoColumn } from 'components/Column'
import Modal, { ModalProps } from 'components/Modal'
import { Z_INDEXS } from 'constants/styles'
import useTheme from 'hooks/useTheme'
import { friendlyError } from 'utils/errorMessage'

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 24px 36px 0;
  gap: 24px;
  width: 100%;
  max-width: 1464px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    height: unset;
`}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 16px;
    padding: 20px 16px;
`};
`

export const Container = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  max-width: 1392px;
  gap: 48px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 24px;
    flex-direction: column;
    align-items: center;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 16px;
  `}
`

export const Wrapper = styled.div`
  position: relative;
  z-index: 1;
  background: ${({ theme }) => theme.background};
`

export const BottomGrouping = styled.div``

export const StyledBalanceMaxMini = styled.button<{ hover?: boolean }>`
  height: 22px;
  width: 22px;
  background-color: transparent;
  border: none;
  border-radius: 50%;
  padding: 0.2rem;
  font-size: 0.875rem;
  font-weight: 400;
  cursor: pointer;
  color: ${({ theme }) => theme.text2};
  display: flex;
  justify-content: center;
  align-items: center;
  float: right;
  ${({ hover }) =>
    hover &&
    css`
      :hover {
        background-color: ${({ theme }) => theme.bg3};
      }
      :focus {
        background-color: ${({ theme }) => theme.bg3};
        outline: none;
      }
    `}
`

export const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 24px;
  font-weight: 500;
`

// styles
export const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
`

const SwapCallbackErrorInner = styled.div`
  background-color: ${({ theme }) => transparentize(0.9, theme.red1)};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  font-size: 0.825rem;
  width: 100%;
  margin-top: 36px;
  padding: 8px 20px 8px 8px;
  background-color: ${({ theme }) => `${theme.buttonBlack}66`};
  z-index: -1;
  p {
    padding: 0;
    margin: 0;
    font-weight: 500;
  }
`

export function SwapCallbackError({ error, style = {} }: { error: string; style?: CSSProperties }) {
  const theme = useTheme()
  const [showDetail, setShowDetail] = useState<boolean>(false)
  return (
    <SwapCallbackErrorInner style={style}>
      <Alert style={{ marginBottom: 'auto' }} />
      <AutoColumn style={{ flexBasis: '100%', margin: '10px 0 auto 8px' }}>
        <Text fontSize="16px" fontWeight="500" color={theme.red} lineHeight={'24px'}>
          {friendlyError(error)}
        </Text>
        {error !== friendlyError(error) && (
          <Text
            color={theme.primary}
            fontSize="12px"
            sx={{ cursor: `pointer` }}
            onClick={() => setShowDetail(!showDetail)}
          >
            Show more details
          </Text>
        )}
        {showDetail && (
          <Text
            color={theme.text}
            fontSize="10px"
            margin="10px 0 4px 0"
            lineHeight="16px"
            sx={{ wordBreak: 'break-word' }}
          >
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </Text>
        )}
      </AutoColumn>
    </SwapCallbackErrorInner>
  )
}

export const GroupButtonReturnTypes = styled.div`
  display: flex;
  border-radius: 999px;
  background: ${({ theme }) => theme.tabBackground};
  padding: 2px;
`

export const ButtonReturnType = styled.div<{ active?: boolean }>`
  border-radius: 999px;
  flex: 1;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.tabActive : theme.tabBackground)};
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color 300ms;
`

export const SwapFormWrapper = styled.div<{ isShowTutorial?: boolean }>`
  width: 425px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 16px;
  @media only screen and (min-width: 1100px) {
    position: ${({ isShowTutorial }) => (isShowTutorial ? 'unset' : 'sticky')};
    /**
      When tutorial appear, there is no need sticky form. 
      Besides, it is also easy for us control position of tutorial popup when scroll page. 
    */
    top: 16px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`

export const InfoComponentsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: calc(100% - 472px);

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `};
`

export const KyberAIBannerWrapper = styled.div`
  width: 100%;
  max-height: 84px;
  margin-bottom: 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-height: 132px;
  `}
`

export const LiveChartWrapper = styled.div`
  width: 100%;
  height: 510px;
  margin-bottom: 30px;
`

export const RoutesWrapper = styled(LiveChartWrapper)<{ isOpenChart: boolean }>`
  height: auto;
  margin-top: 4px;
`

export const TokenInfoWrapper = styled(LiveChartWrapper)`
  display: flex;
  flex-direction: column;
  row-gap: 16px;

  @media screen and (min-width: 1100px) {
    display: flex;
  }

  height: auto;
  border-bottom: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`

export const MobileModalWrapper = styled((props: ModalProps) => <Modal {...props} zindex={Z_INDEXS.MODAL} />)<{
  height?: string
}>`
  &[data-reach-dialog-content] {
    width: 100vw;
    max-width: 100vw;
    ${({ height }) => height && `height: ${height};`}
    min-height: 70vh;
  }
`

export const StyledActionButtonSwapForm = styled.button<{ active?: boolean; hoverBg?: string }>`
  position: relative;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 36px;
  width: 36px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme, hoverBg }) => hoverBg || theme.background};
  }

  ${({ active }) =>
    active
      ? css`
          cursor: pointer;
          outline: none;
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
`

export const IconButton = styled(StyledActionButtonSwapForm)<{ enableClickToRefresh: boolean }>`
  transition: background 0.2s;

  // off click
  &:hover {
    cursor: default;
    background-color: transparent;
  }
`

export const highlight = (theme: DefaultTheme) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${theme.primary};
  }

  70% {
    box-shadow: 0 0 0 2px ${theme.primary};
  }

  100% {
    box-shadow: 0 0 0 0 ${theme.primary};
  }
`
