import { LoginFlow, LoginMethod } from '@kybernetwork/oauth2'

import { OAUTH_CLIENT_ID } from 'constants/env'

export const getSupportLoginMethods = (loginFlow: LoginFlow | undefined) => {
  // todo check many case, remove
  if (loginFlow?.oauth_client?.client_id === OAUTH_CLIENT_ID)
    return [LoginMethod.EMAIL, LoginMethod.ETH, LoginMethod.ANONYMOUS]
  return loginFlow?.oauth_client?.metadata?.allowed_login_methods ?? []
}

type MessageParams = {
  domain: string
  uri: string
  address: string
  version: string
  nonce: string
  chainId: number
  issuedAt: string
  statement: string
}

// message follow eip https://eips.ethereum.org/EIPS/eip-4361
export const createSignMessage = ({
  domain,
  uri,
  address,
  version,
  nonce,
  chainId,
  issuedAt,
  statement,
}: MessageParams): string => {
  let prefix = [`${domain} wants you to sign in with your Ethereum account:`, address].join('\n')

  prefix = [prefix, statement].join('\n\n')
  if (statement) {
    prefix += '\n'
  }

  const suffix = [
    `URI: ${uri}`,
    `Version: ${version}`,
    `Chain ID: ` + chainId,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')

  return [prefix, suffix].join('\n')
}
