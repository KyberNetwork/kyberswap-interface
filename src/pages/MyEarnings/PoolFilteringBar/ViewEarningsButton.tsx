import { useDispatch } from 'react-redux'

import { ButtonOutlined } from 'components/Button'
import { showEarningView } from 'state/myEarnings/actions'

const ViewEarningsButton = () => {
  const dispatch = useDispatch()

  const handleClick = () => {
    dispatch(showEarningView())
  }

  return (
    <ButtonOutlined
      style={{
        height: '36px',
        flex: '0 0 fit-content',
      }}
      onClick={handleClick}
    >
      View Earnings
    </ButtonOutlined>
  )
}

export default ViewEarningsButton
