import { Text } from 'rebass'
import styled from 'styled-components'

export const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`
export const OptionsContainer = styled.div`
  display: flex;
  position: absolute;
  bottom: -6px;
  right: 0;
  border-radius: 16px;
  flex-direction: column;
  background: ${({ theme }) => theme.tableHeader};
  overflow: hidden;
  z-index: 9999;
  width: 100%;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  left: 50%;
  transform: translate(-50%, 100%);
  min-width: max-content;

  & > * {
    cursor: pointer;
    padding: 12px;

    &:hover {
      background: ${({ theme }) => theme.background};
    }
  }

  & div {
    min-width: max-content !important;
  }

  .no-hover-effect {
    cursor: default;
    &:hover {
      background: inherit;
    }
  }

  .no-hover-effect-divider {
    &:hover {
      background: ${({ theme }) => theme.border};
    }
  }
`
