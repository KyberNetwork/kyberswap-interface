import { t } from '@lingui/macro'
import { FormEvent } from 'react'

import { StyledInput } from 'pages/NotificationCenter/CreateAlert/styleds'

export default function InputNote({ onChangeInput }: { onChangeInput: (v: string) => void }) {
  function autoGrow(e: FormEvent<HTMLTextAreaElement>) {
    const element = e.currentTarget
    element.style.height = Math.max(36, element.scrollHeight < 48 ? 36 : element.scrollHeight) + 'px'
  }
  return (
    <StyledInput
      contentEditable
      placeholder={t`Add a note`}
      maxLength={32}
      onInput={autoGrow}
      onChange={e => {
        onChangeInput(e.target.value)
      }}
      onKeyDown={e => (e.key === 'Enter' ? e.preventDefault() : undefined)}
    />
  )
}
