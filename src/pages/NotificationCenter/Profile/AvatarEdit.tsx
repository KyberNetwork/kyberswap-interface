import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { isMobile } from 'react-device-detect'
import { Edit2 } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import Avatar from 'components/Avatar'
import FileInput from 'components/FileInput'
import useTheme from 'hooks/useTheme'

const AvatarWrapper = styled.div<{ size: string }>`
  border-radius: 100%;
  padding: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`

const EditLayer = styled.div<{ size: string }>`
  background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.6)};
  position: absolute;
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 100%;
  top: ${({ size }) => `calc(${size} - 40px)`};
  display: flex;
  justify-content: center;
  padding-top: 10px;
`

export default function AvatarEdit({
  disabled,
  avatar,
  handleFileChange,
  size,
}: {
  disabled: boolean
  size: string
  avatar: string | undefined
  handleFileChange: (imgUrl: string, file: File) => void
}) {
  const theme = useTheme()
  return (
    <FileInput onImgChange={handleFileChange} image disabled={disabled}>
      <AvatarWrapper size={size}>
        <Avatar url={avatar} size={parseInt(size) - (isMobile ? 30 : 40)} color={theme.subText} />
        {!disabled && (
          <EditLayer size={size}>
            <Flex style={{ gap: '4px' }} color={theme.text} fontSize={'14px'} fontWeight={'500'}>
              <Edit2 size={15} />
              <Trans>Edit</Trans>
            </Flex>
          </EditLayer>
        )}
      </AvatarWrapper>
    </FileInput>
  )
}
