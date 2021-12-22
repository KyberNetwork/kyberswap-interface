import React from 'react'
import { IconButton } from './styleds'
import OpenChartIcon from 'components/Icons/OpenChartIcon'

export default function OpenChartButton({ onClick, isOpened }: { onClick?: () => void; isOpened?: boolean }) {
  return (
    <IconButton onClick={onClick}>
      <OpenChartIcon isOpened={isOpened} />
    </IconButton>
  )
}
