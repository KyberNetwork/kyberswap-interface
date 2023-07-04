import styled from 'styled-components'

import { ButtonLight } from 'components/Button'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 0 0 280px;
  gap: 4px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
  padding: 2px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex: 1 1 100%;
  `}
`

const CustomButton = styled(ButtonLight)`
  background-color: unset;
  color: ${({ theme }) => theme.subText};
  height: 32px;
  flex: 1 1 50%;

  &:hover {
    filter: unset;
    background-color: unset;
    color: ${({ theme }) => theme.text};
  }
  &:active {
    filter: unset;
    box-shadow: unset;
    background-color: unset;
    color: ${({ theme }) => theme.text};
  }

  &[data-active='true'] {
    background-color: ${({ theme }) => theme.tableHeader};
    color: ${({ theme }) => theme.text};

    &:hover {
      filter: unset;
      background-color: ${({ theme }) => theme.tableHeader};
    }
    &:active {
      filter: unset;
      box-shadow: unset;
      background-color: ${({ theme }) => theme.tableHeader};
    }
  }
`

type Props = {
  isViewEarnings: boolean
  setViewEarnings: (value: boolean) => void
}
const ViewEarningOrPositionButton: React.FC<Props> = ({ isViewEarnings, setViewEarnings }) => {
  return (
    <Wrapper>
      <CustomButton
        onClick={() => {
          if (isViewEarnings) {
            setViewEarnings(false)
          }
        }}
        data-active={!isViewEarnings}
      >
        View Positions
      </CustomButton>

      <CustomButton
        onClick={() => {
          if (!isViewEarnings) {
            setViewEarnings(true)
          }
        }}
        data-active={isViewEarnings}
      >
        View Earnings
      </CustomButton>
    </Wrapper>
  )
}

export default ViewEarningOrPositionButton
