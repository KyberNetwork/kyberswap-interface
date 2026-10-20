import CrossChainSwapSources from 'pages/CrossChainSwap/components/CrossChainSwapSources'

const UnifiedCrossChainSwapSources = ({ onBack }: { onBack?: () => void }) => (
  <CrossChainSwapSources onBack={onBack} quoteMode="stream" />
)

export default UnifiedCrossChainSwapSources
