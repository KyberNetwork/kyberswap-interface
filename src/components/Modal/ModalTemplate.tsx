import { X } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import Modal, { ModalProps } from 'components/Modal'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  margin: 0;
  padding: 24px 24px;
  width: 100%;
  display: flex;
  gap: 24px;
  flex-direction: column;
`

// modal with close, title
const ModalTemplate = ({
  title,
  closeButton = true,
  ...props
}: ModalProps & { title: string; closeButton?: boolean }) => {
  const theme = useTheme()
  const { children, onDismiss } = props
  return (
    <Modal {...props}>
      <Wrapper>
        <RowBetween>
          <Text fontSize={20} fontWeight={400}>
            {title}
          </Text>
          {closeButton && <X color={theme.subText} onClick={onDismiss} cursor={'pointer'} />}
        </RowBetween>
        {children}
      </Wrapper>
    </Modal>
  )
}

export default ModalTemplate
