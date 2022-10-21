import { ChainId } from '@namgold/ks-sdk-core'
import { Program } from '@project-serum/anchor'
import { useMemo } from 'react'

import { IDL } from 'constants/idl/solana_aggregator_programs'
import { NETWORKS_INFO } from 'constants/networks'

import useProvider from './useProvider'

const useSolanaAggregatorProgram = () => {
  const provider = useProvider()

  const program = useMemo(
    () => (provider ? new Program(IDL, NETWORKS_INFO[ChainId.SOLANA].aggregatorProgramAddress, provider) : null),
    [provider],
  )
  return program
}

export default useSolanaAggregatorProgram
