import { X } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ModalCenter, ModalProps } from 'components/Modal'
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
  showCloseButton = true,
  ...props
}: ModalProps & { title: string; showCloseButton?: boolean }) => {
  const theme = useTheme()
  const { children, onDismiss } = props
  return (
    <ModalCenter {...props}>
      <Wrapper>
        <RowBetween>
          <Text fontSize={20} fontWeight={400}>
            {title}
          </Text>
          {showCloseButton && <X color={theme.subText} onClick={onDismiss} cursor={'pointer'} />}
        </RowBetween>
        {children}
      </Wrapper>
    </ModalCenter>
  )
}

export default ModalTemplate
