// import { Context } from '@namgold/dmm-solana-sdk'
// import { ChainId } from '@namgold/ks-sdk-core'
// import { useMemo } from 'react'

// import { NETWORKS_INFO } from 'constants/networks'

// import useProvider from './useProvider'

// const useContext = () => {
//   const provider = useProvider()

//   const context = useMemo(
//     () =>
//       provider
//         ? new Context(
//             provider,
//             NETWORKS_INFO[ChainId.SOLANA].classic.factory,
//             NETWORKS_INFO[ChainId.SOLANA].classic.pool,
//             NETWORKS_INFO[ChainId.SOLANA].classic.router,
//           )
//         : null,
//     [provider],
//   )
//   return context
// }

// export default useContext
export {}
