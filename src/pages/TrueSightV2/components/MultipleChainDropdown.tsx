import React from 'react'
import styled from 'styled-components'

import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'

import SimpleTooltip from './SimpleTooltip'

const MenuDropdown = styled(RowFit)`
  position: absolute;
  top: 42px;
  right: 0;
  transform: translateY(-10px);
  transition: transform 0.1s ease, visibility 0.1s ease, opacity 0.1s ease;
  visibility: hidden;
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 8px;
  opacity: 0;
  border-radius: 4px;
  z-index: 100;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.32);
  &.show {
    transform: translateY(0);
    visibility: visible;
    opacity: 1;
  }
`

const StyledChainIcon = styled.div`
  border-radius: 50%;
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 6px;
  :hover {
    filter: brightness(1.2);
  }
`
const ChainIcon = ({ id, name, onClick }: { id: string; name: string; onClick: () => void }) => {
  return (
    <SimpleTooltip text={name}>
      <StyledChainIcon onClick={onClick}>
        <Icon id={id} size={20} />
      </StyledChainIcon>
    </SimpleTooltip>
  )
}

const MultipleChainDropdown = React.forwardRef(
  (
    props: {
      show: boolean
      menuLeft?: number
      tokens?: Array<{ address: string; logo: string; chain: string }>
      onChainClick: (chain: string, address: string) => void
    },
    ref,
  ) => {
    const { show, menuLeft, tokens, onChainClick } = props
    const theme = useTheme()
    return (
      <MenuDropdown
        className={show ? 'show' : ''}
        gap="8px"
        color={theme.text}
        style={{ left: menuLeft !== undefined ? `${menuLeft}px` : undefined }}
        ref={ref}
      >
        {tokens?.map((item: { address: string; logo: string; chain: string }) => {
          if (item.chain === 'ethereum')
            return <ChainIcon id="eth-mono" name="Ethereum" onClick={() => onChainClick('ethereum', item.address)} />
          if (item.chain === 'bsc')
            return <ChainIcon id="bnb-mono" name="Binance" onClick={() => onChainClick('bsc', item.address)} />
          if (item.chain === 'avalanche')
            return <ChainIcon id="ava-mono" name="Avalanche" onClick={() => onChainClick('avalanche', item.address)} />
          if (item.chain === 'polygon')
            return <ChainIcon id="matic-mono" name="Polygon" onClick={() => onChainClick('polygon', item.address)} />
          if (item.chain === 'arbitrum')
            return (
              <ChainIcon id="arbitrum-mono" name="Arbitrum" onClick={() => onChainClick('arbitrum', item.address)} />
            )
          if (item.chain === 'fantom')
            return <ChainIcon id="fantom-mono" name="Fantom" onClick={() => onChainClick('fantom', item.address)} />
          if (item.chain === 'optimism')
            return (
              <ChainIcon id="optimism-mono" name="Optimism" onClick={() => onChainClick('optimism', item.address)} />
            )
          return <></>
        })}
      </MenuDropdown>
    )
  },
)

MultipleChainDropdown.displayName = 'MultipleChainDropdown'

export default MultipleChainDropdown
