import { Trans } from '@lingui/macro'
import styled from 'styled-components'

import { ReactComponent as NftIcon } from 'assets/svg/nft_icon.svg'
import { MoneyFill } from 'components/Icons'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 999px;
  padding: 1px;
  background: ${({ theme }) => theme.buttonBlack};
`

const CustomButton = styled.div<{ isActive: boolean }>`
  background: ${({ theme, isActive }) => (isActive ? theme.tableHeader : 'transparent')};
  color: ${({ theme, isActive }) => (isActive ? theme.text : theme.subText)};
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 2px;
`

type Props = {
  className?: string
  isViewEarnings: boolean
  setViewEarnings: (value: boolean) => void
}
const ViewEarningOrPositionButton: React.FC<Props> = ({ isViewEarnings, setViewEarnings, className }) => {
  return (
    <Wrapper className={className}>
      <CustomButton onClick={() => setViewEarnings(false)} isActive={!isViewEarnings} role="button">
        <NftIcon />
        <Trans>View Positions</Trans>
      </CustomButton>

      <CustomButton onClick={() => setViewEarnings(true)} isActive={isViewEarnings} role="button">
        <MoneyFill size={16} />
        <Trans>View Earnings</Trans>
      </CustomButton>
    </Wrapper>
  )
}

export default ViewEarningOrPositionButton
