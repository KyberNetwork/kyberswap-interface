export const loadCrossChainSwap = () => import('pages/CrossChainSwap')

export const prefetchCrossChainSwap = () => {
  void loadCrossChainSwap().catch(() => undefined)
}
