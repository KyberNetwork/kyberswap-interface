import { useRef, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Box } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as NotificationIcon2 } from 'assets/svg/slim_notification_icon.svg'
import Modal from 'components/Modal'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { MEDIA_WIDTHS } from 'theme'

const CloseButton = styled.div`
  position: absolute;
  right: 20px;
  top: 17px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const StyledMenuIcon = styled(NotificationIcon2)`
  height: 22px;
  width: 22px;

  > * {
    stroke: ${({ theme }) => theme.text};
  }
`

const StyledButton = styled.button<{ active?: boolean }>`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text};

  border-radius: 999px;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }

  ${({ active }) =>
    active
      ? css`
          cursor: pointer;
          outline: none;
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
`

const StyledIframe = styled.iframe`
  position: absolute;
  top: calc(100% + 16px);
  right: 0;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 100%;
  `}
`

const StyledMobileIframe = styled.iframe`
  width: 100%;
  overflow: hidden;
  border: none;
  outline: none;
`

const ChangeLog = () => {
  const [isOpen, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  useOnClickOutside(ref, () => {
    setOpen(false)
  })

  return (
    <Box
      sx={{
        position: 'relative',
      }}
      ref={ref}
    >
      <StyledButton onClick={() => setOpen(o => !o)}>
        <StyledMenuIcon data-badge-changelog />
      </StyledButton>

      {upToExtraSmall ? (
        <Modal isOpen={isOpen} onDismiss={() => setOpen(false)}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
            }}
          >
            <StyledMobileIframe
              title="changelog"
              style={{
                display: isOpen ? 'block' : 'none',
              }}
              width="400"
              height="800"
              src="https://embed-316782075.sleekplan.app/#/changelog"
            />
            <CloseButton onClick={() => setOpen(false)}>
              <X color="white" />
            </CloseButton>
          </Box>
        </Modal>
      ) : (
        <StyledIframe
          title="changelog"
          style={{
            display: isOpen ? 'block' : 'none',
          }}
          width="400"
          height="600"
          src="https://embed-316782075.sleekplan.app/#/changelog"
        />
      )}
    </Box>
  )
}

export default ChangeLog
