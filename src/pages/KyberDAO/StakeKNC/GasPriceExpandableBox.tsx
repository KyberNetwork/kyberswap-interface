import { Trans } from '@lingui/macro'
import React from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ColumnCenter } from 'components/Column'
import ExpandableBox from 'components/ExpandableBox'
import { GasStation } from 'components/Icons'
import { AutoRow, RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'

const VerticalDivider = styled.div`
  width: 1px;
  background-color: ${({ theme }) => theme.border};
  height: 70px;
`
export default function GasPriceExpandableBox() {
  const theme = useTheme()
  return (
    <ExpandableBox
      border={'none'}
      backgroundColor={theme.buttonBlack}
      borderRadius={'16px'}
      headerContent={
        <RowBetween>
          <AutoRow gap="3px" color={theme.subText}>
            <GasStation />
            <Text fontSize={12}>
              <Trans>Gas Price Tracker</Trans>
            </Text>
          </AutoRow>
          <AutoRow fontSize={12} justify="flex-end">
            <Text color={theme.text} marginRight="4px">
              36 gwei |
            </Text>
            <Text color={theme.subText}>{` $0.01`}</Text>
          </AutoRow>
        </RowBetween>
      }
      style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))' }}
      expandContent={
        <AutoRow justify="space-around" fontSize={12}>
          <ColumnCenter gap="8px">
            <AutoRow justify="center" color={theme.primary} gap="2px">
              <GasStation size={12} />
              <Text>Low</Text>
            </AutoRow>
            <Text color={theme.primary}>19 gwei</Text>
            <Text color={theme.subText}>$6.46</Text>
          </ColumnCenter>
          <VerticalDivider />
          <ColumnCenter gap="8px">
            <AutoRow justify="center" color={theme.text} gap="2px">
              <GasStation size={12} />
              <Text>Average</Text>
            </AutoRow>
            <Text>19 gwei</Text>
            <Text color={theme.subText}>$6.46</Text>
          </ColumnCenter>
          <VerticalDivider />
          <ColumnCenter gap="8px">
            <AutoRow justify="center" color={theme.red} gap="2px">
              <GasStation size={12} />
              <Text>High</Text>
            </AutoRow>
            <Text color={theme.red}>19 gwei</Text>
            <Text color={theme.subText}>$6.46</Text>
          </ColumnCenter>
        </AutoRow>
      }
    />
  )
}
