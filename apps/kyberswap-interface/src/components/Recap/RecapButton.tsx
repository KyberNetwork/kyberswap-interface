import { rgba } from 'polished'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import { ReactComponent as RecapIcon } from 'assets/recap/2025.svg'
import { isRecapAvailable } from 'components/Recap/utils'
import { useRecapModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
  color: ${({ theme }) => theme.primary};
  padding: 10px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
  transition: background-color 0.2s ease-out;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => rgba(theme.primary, 0.25)};
  }

  @media screen and (max-width: 1515px) {
    padding: 2px;
    border-radius: 50%;
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 10px 16px;
    border-radius: 20px;
  `}

  @media screen and (max-width: 820px) {
    padding: 2px;
    border-radius: 50%;
  }
`

export default function RecapButton() {
  const toggleRecapModal = useRecapModalToggle()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upTo1515 = useMedia('(max-width: 1515px)')
  const upTo820 = useMedia('(max-width: 820px)')

  if (!isRecapAvailable()) return null

  const btnText = !upTo1515 ? (
    '✨ 2025 Journey ✨'
  ) : !upToLarge ? (
    <RecapIcon width={36} height={36} />
  ) : !upTo820 ? (
    '✨ 2025 Journey ✨'
  ) : (
    <RecapIcon width={36} height={36} />
  )

  return <StyledButton onClick={toggleRecapModal}>{btnText}</StyledButton>
}
