import { ReactNode, useState } from 'react'
import { PoolDetail } from 'services/zapEarn'

import { HStack, Stack } from 'components/Stack'
import AddLiquidityRoutePreview, {
  AddLiquidityRoutePreviewProps,
} from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityRoutePreview'

import AddLiquidityWidget from './components/AddLiquidityWidget'

interface AddLiquidityProps {
  children?: ReactNode
  pool?: PoolDetail
  route?: {
    exchange?: string
    poolAddress?: string
    chainId?: number
    positionId?: string
    tickLower?: string | null
    tickUpper?: string | null
  }
}

const AddLiquidity = ({ children, route }: AddLiquidityProps) => {
  const [routePreviewData, setRoutePreviewData] = useState<AddLiquidityRoutePreviewProps | null>(null)

  return (
    <HStack align="flex-start" gap={24} wrap="wrap" width="100%">
      <Stack flex="1 1 480px" width="100%" maxWidth="480px" minWidth={0}>
        <AddLiquidityWidget
          chainId={route?.chainId}
          exchange={route?.exchange}
          poolAddress={route?.poolAddress}
          positionId={route?.positionId}
          tickLower={route?.tickLower}
          tickUpper={route?.tickUpper}
          onRoutePreviewDataChange={setRoutePreviewData}
        />
      </Stack>
      <Stack flex="1 1 320px" gap={24} minWidth={0}>
        <AddLiquidityRoutePreview
          pool={routePreviewData?.pool}
          reviewData={routePreviewData?.reviewData}
          inputTokens={routePreviewData?.inputTokens}
        />
        {children}
      </Stack>
    </HStack>
  )
}

export default AddLiquidity
