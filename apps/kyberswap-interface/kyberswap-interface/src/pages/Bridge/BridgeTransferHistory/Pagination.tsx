import { rgba } from 'polished'
import { ChevronLeft, ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { TransferHistoryResponse } from 'pages/Bridge/BridgeTransferHistory/useTransferHistory'

export const PaginationButton = styled.button`
  flex: 0 0 36px;
  height: 36px;
  padding: 0px;
  margin: 0px;
  border: none;

  display: flex;
  justify-content: center;
  align-items: center;

  cursor: pointer;
  border-radius: 999px;
  color: ${({ theme }) => theme.subText};
  background: ${({ theme }) => theme.buttonGray};
  transition: color 150ms;

  &:active {
    color: ${({ theme }) => theme.text};
  }

  @media (hover: hover) {
    &:hover {
      color: ${({ theme }) => theme.text};
    }
  }

  &:disabled {
    color: ${({ theme }) => rgba(theme.subText, 0.4)};
    cursor: not-allowed;
  }
`
const Pagination = ({
  canGoPrevious,
  onClickPrevious,
  isThisPageEmpty,
  canGoNext,
  range,
  onClickNext,
}: TransferHistoryResponse) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 0',
        gap: '12px',
        borderTop: `1px solid ${theme.border}`,
      }}
    >
      <PaginationButton disabled={!canGoPrevious} onClick={onClickPrevious}>
        <ChevronLeft width={18} />
      </PaginationButton>

      <Flex
        sx={{
          width: '120px',
          fontSize: '12px',
          color: theme.subText,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isThisPageEmpty ? '-' : `${range[0]} - ${range[1]}`}
      </Flex>

      <PaginationButton disabled={!canGoNext} onClick={onClickNext}>
        <ChevronRight width={18} />
      </PaginationButton>
    </Flex>
  )
}
export default Pagination
