import { useDispatch } from 'react-redux'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'
import useTheme from 'hooks/useTheme'
import { useAppSelector } from 'state/hooks'
import { showEarningView, showPositionView } from 'state/myEarnings/actions'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 0 0 260px;
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

const ViewEarningOrPositionButton: React.FC = () => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const shouldShowEarningView = useAppSelector(state => state.myEarnings.shouldShowEarningView)

  return (
    <Wrapper>
      <CustomButton
        onClick={() => {
          if (!shouldShowEarningView) {
            dispatch(showEarningView())
          }
        }}
        data-active={shouldShowEarningView}
      >
        View Earning
      </CustomButton>

      <CustomButton
        onClick={() => {
          if (shouldShowEarningView) {
            dispatch(showPositionView())
          }
        }}
        data-active={!shouldShowEarningView}
      >
        View Position
      </CustomButton>
    </Wrapper>
  )
}

export default ViewEarningOrPositionButton
