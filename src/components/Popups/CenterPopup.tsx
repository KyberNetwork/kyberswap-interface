import { X } from 'react-feather'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

const Wrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 20px;
    padding: 20px;
  `}
`
const Title = styled.div`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;
`
export default function CenterPopup() {
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  return (
    <Modal
      isOpen={true}
      onDismiss={() => {
        //
      }}
      maxWidth={isMobile ? undefined : '800px'}
    >
      <Wrapper>
        <RowBetween align="flex-end">
          <Title>Important Announcement!</Title>
          <X cursor={'pointer'} color={theme.subText} />
        </RowBetween>
        <div>
          We recently discovered an issue in our Elastic farming contract where you might not be able to harvest your
          rewards or withdraw your liquidity positions like you normally would Dont worry, your funds are 100% safe. And
          you are still earning farming rewards If you still wish to withdraw your liquidity positions, you can use the
          Force Withdraw button as an emergency option. (Note: If you do this, your farming rewards will not be
          automatically harvested but we can manually transfer your farming rewards to you)
        </div>
        <Row justify="center">
          <ButtonPrimary width={'220px'} height={'36px'}>
            CTA
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
