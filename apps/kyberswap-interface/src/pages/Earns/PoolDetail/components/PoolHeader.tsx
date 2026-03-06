import React from 'react'

import { HStack } from 'components/Stack'

import { PoolHeaderContainer, PoolHeaderMeta, PoolHeaderTitle } from '../styled'

interface PoolHeaderProps {
  title?: string
  meta?: React.ReactNode
}

const PoolHeader = ({ title = 'Pool Detail', meta }: PoolHeaderProps) => {
  return (
    <PoolHeaderContainer>
      <PoolHeaderTitle>{title}</PoolHeaderTitle>
      <HStack gap="12px" align="center">
        <PoolHeaderMeta>{meta || 'Overview'}</PoolHeaderMeta>
      </HStack>
    </PoolHeaderContainer>
  )
}

export default PoolHeader
