import { Trans } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { Edit2 } from 'react-feather'

import Avatar from 'components/Avatar'
import FileInput from 'components/FileInput'
import useTheme from 'hooks/useTheme'

export default function AvatarEdit({
  disabled,
  avatar,
  handleFileChange,
  size,
}: {
  disabled?: boolean
  size: string
  avatar: string | undefined
  handleFileChange: (imgUrl: string, file: File) => void
}) {
  const theme = useTheme()
  return (
    <FileInput onImgChange={handleFileChange} image disabled={disabled}>
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-full bg-buttonBlack p-4"
        style={{ width: size, height: size }}
      >
        <Avatar url={avatar} size={parseInt(size) - (isMobile ? 30 : 40)} color={theme.subText} />
        {!disabled && (
          <div
            className="absolute flex justify-center rounded-full bg-buttonBlack-60 pt-2.5"
            style={{ width: size, height: size, top: `calc(${size} - 40px)` }}
          >
            <div className="flex gap-1 text-sm font-medium text-text">
              <Edit2 size={15} />
              <Trans>Edit</Trans>
            </div>
          </div>
        )}
      </div>
    </FileInput>
  )
}
