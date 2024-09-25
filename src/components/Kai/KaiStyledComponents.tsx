import { rgba } from 'polished'
import styled, { css, keyframes } from 'styled-components'

import { ReactComponent as Send } from 'assets/svg/ic_send.svg'

import { Space } from './actions'

export const KaiHeaderWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`

export const SubTextSpan = styled.span`
  color: ${({ theme }) => theme.subText};
`

export const Divider = styled.div`
  background-color: #505050;
  height: 1px;
  width: 100%;
  margin: 10px 0 14px;
`

export const WelcomeText = styled.div`
  margin-bottom: 16px;
`

export const ChatWrapper = styled.div<{ disabled: boolean }>`
  position: relative;
  height: 36px;
  margin-top: 16px;

  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 0.4;
    `}
`

export const ChatInput = styled.input`
  position: absolute;
  display: flex;
  padding: 10px 30px 13px 16px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  border-radius: 8px;
  color: ${({ theme }) => theme.text};
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.buttonBlack};
  background: ${({ theme }) => theme.buttonBlack};
  transition: border 100ms;
  appearance: none;
  -webkit-appearance: none;

  ::placeholder {
    color: ${({ theme }) => theme.border};
    font-size: 13.5px;
    ${({ theme }) => theme.mediaWidth.upToSmall`
      font-size: 12.5px;
    `};
  }

  :focus {
    border: 1px solid ${({ theme }) => theme.primary};
    outline: none;
  }
`

export const SendIcon = styled(Send)`
  position: absolute;
  right: 12px;
  top: 12px;
  color: transparent;
  transition: 0.1s ease-in-out;
  cursor: pointer;

  :hover {
    color: ${({ theme }) => theme.primary};
    border-color: transparent;
  }
`

export const LoadingWrapper = styled.div`
  color: ${({ theme }) => theme.subText};
  display: flex;
  align-items: center;
  gap: 6px;
`

const loadingKeyFrame = keyframes`
  100%{transform: rotate(.5turn)}
`

export const Loader = styled.div`
  width: 16px;
  aspect-ratio: 1;
  --c: ${({ theme }) => `no-repeat radial-gradient(farthest-side, ${theme.subText} 92%, #0000)`};
  background: var(--c) 50% 0, var(--c) 50% 100%, var(--c) 100% 50%, var(--c) 0 50%;
  background-size: 3px 3px;
  animation: ${loadingKeyFrame} 1s infinite;
  position: relative;

  ::before {
    content: '';
    position: absolute;
    inset: 0;
    margin: 1px;
    background: ${({ theme }) => `repeating-conic-gradient(#0000 0 35deg, ${theme.subText} 0 90deg)`};
    mask: radial-gradient(farthest-side, #0000 calc(100% - 1px), #000 0);
    -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 1px), #000 0);
    border-radius: 50%;
  }
`

export const ActionPanel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
`

export const ActionButton = styled.div<{ width: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #fafafa;
  height: 36px;
  background-color: ${({ theme }) => rgba(theme.white, 0.04)};
  transition: 0.1s ease-in-out;
  cursor: pointer;

  :hover {
    background-color: ${({ theme }) => rgba(theme.white, 0.08)};
  }

  ${({ width }) =>
    css`
      width: ${width === Space.FULL_WIDTH ? width + '%' : `calc(${width}% - 6px)`};
    `}
`
