import { Trans } from '@lingui/macro'
import { MouseEventHandler } from 'react'
import { Flex } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import useTheme from 'hooks/useTheme'

type ApplyButtonProps = {
  disabled: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
  numOfChains: number
}

export const ApplyButton: React.FC<ApplyButtonProps> = ({ disabled, onClick, numOfChains }) => {
  const theme = useTheme()
  return (
    <ButtonPrimary
      disabled={disabled}
      style={{
        height: '40px',
        padding: '0 12px',
      }}
      onClick={onClick}
    >
      <Flex
        as="span"
        sx={{
          width: '100%',
          display: 'inline-flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Trans>View Selected Chains</Trans>
        <Flex
          as="span"
          sx={{
            width: '22px',
            height: '22px',
            borderRadius: '999px',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: disabled ? undefined : theme.darkText,
            color: disabled ? theme.border : theme.primary,
          }}
        >
          {numOfChains ? String(numOfChains).padStart(2, '0') : 0}
        </Flex>
      </Flex>
    </ButtonPrimary>
  )
}
