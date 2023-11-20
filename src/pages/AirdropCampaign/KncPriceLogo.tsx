import { useMemo } from 'react'
import styled from 'styled-components'

import KncLogo from 'assets/images/airdrop/knc_airdrop.png'
import Column from 'components/Column'
import { RowFit } from 'components/Row'
import { KNC } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import KNCLogo from 'pages/KyberDAO/kncLogo'
import { useTokenPrices } from 'state/tokenPrices/hooks'

const Image = styled.img`
  height: 320px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: unset;
    width: 100%;
  `}
`
export default function KNCPriceLogo() {
  const { chainId } = useActiveWeb3React()
  const params = useMemo(() => {
    return [KNC[chainId].address]
  }, [chainId])
  const data = useTokenPrices(params)
  const price = data?.[KNC[chainId].address] || '--'

  return (
    <Column alignItems={'center'} gap="12px">
      <Image src={KncLogo} />
      <RowFit fontSize={'18px'} gap="8px" fontWeight={'500'}>
        <KNCLogo /> KNC = ${price}
      </RowFit>
    </Column>
  )
}
