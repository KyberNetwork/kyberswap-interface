import { useCallback, useMemo, useState } from 'react';

import { getFunctionSelector } from '@kyber/utils/crypto';

type HexString = `0x${string}`;

function encodeUint256(value: number | bigint | string): string {
  const v = typeof value === 'bigint' ? value : typeof value === 'number' ? BigInt(value) : BigInt(value);
  let hex = v.toString(16);

  if (hex.length > 64) {
    throw new Error('uint256 overflow');
  }

  if (hex === '0') {
    hex = '0';
  }

  return hex.padStart(64, '0');
}

function encodeUint8(value: number): string {
  if (value < 0 || value > 255) {
    throw new Error('uint8 out of range');
  }

  const hex = value.toString(16);
  return hex.padStart(64, '0');
}

function encodeBytes32(value: HexString): string {
  const hex = value.startsWith('0x') ? value.slice(2) : value;

  if (hex.length !== 64) {
    throw new Error('bytes32 must be exactly 32 bytes');
  }

  return hex;
}

function encodeBytes(value: HexString): string {
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  const length = hex.length / 2;
  const lengthHex = encodeUint256(length);
  const padded = hex.padEnd(Math.ceil(hex.length / 64) * 64, '0');

  return lengthHex + padded;
}

function splitSignature(signature: HexString): { v: number; r: HexString; s: HexString } {
  const hex = signature.startsWith('0x') ? signature.slice(2) : signature;

  if (hex.length !== 130) {
    throw new Error('Invalid signature length');
  }

  const r = `0x${hex.slice(0, 64)}` as HexString;
  const s = `0x${hex.slice(64, 128)}` as HexString;
  const v = parseInt(hex.slice(128, 130), 16);

  if (Number.isNaN(v)) {
    throw new Error('Invalid v value in signature');
  }

  return { v, r, s };
}

export enum PermitNftState {
  NOT_APPLICABLE = 'not_applicable',
  READY_TO_SIGN = 'ready_to_sign',
  SIGNING = 'signing',
  SIGNED = 'signed',
  ERROR = 'error',
}

export interface PermitNftParams {
  nftManagerContract?: string;
  tokenId?: string;
  spender?: string;
  account?: string | null;
  chainId?: number | null;
  rpcUrl?: string;
  version?: 'v3' | 'v4' | 'auto';
  /**
   * Function to sign EIP-712 typed data using eth_signTypedData_v4.
   * Example: (account, data) => library.send('eth_signTypedData_v4', [account.toLowerCase(), data])
   */
  signTypedData?: (account: string, typedDataJson: string) => Promise<string>;
}

export interface PermitNftResult {
  deadline: number;
  nonce: bigint;
  signature: string;
  permitData: string;
}

export interface UsePermitNftReturn {
  permitState: PermitNftState;
  /**
   * Execute the signing flow. Returns the latest permit payload on success.
   */
  signPermitNft: (deadline: number) => Promise<PermitNftResult | null>;
  /**
   * Latest signed permit payload.
   */
  permitData: PermitNftResult | null;
  /**
   * Whether hook has enough data to attempt signing.
   */
  isReady: boolean;
  /**
   * Resolved permit version. Null if not yet determined.
   */
  version: 'v3' | 'v4' | null;
  /**
   * Whether a signing request is currently in progress.
   */
  isSigning: boolean;
  /**
   * Last error during signing, if any.
   */
  error: Error | null;
}

// NFT Position Manager ABI for permit functionality.
export const NFT_PERMIT_ABI = [
  'function name() view returns (string)',
  'function nonces(address owner, uint256 word) view returns (uint256 bitmap)', // V4 unordered nonces
  'function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)', // V3 ordered nonces
  'function DOMAIN_SEPARATOR() view returns (bytes32)', // V3 domain separator
  'function PERMIT_TYPEHASH() view returns (bytes32)', // V3 permit typehash
  'function permit(address spender, uint256 tokenId, uint256 deadline, uint256 nonce, bytes signature) payable',
] as const;

export const usePermitNft = ({
  nftManagerContract,
  tokenId,
  spender,
  account,
  chainId,
  rpcUrl,
  version = 'auto',
  signTypedData,
}: PermitNftParams): UsePermitNftReturn => {
  const [isSigning, setIsSigning] = useState(false);
  const [permitData, setPermitData] = useState<PermitNftResult | null>(null);
  const [detectedVersion, setDetectedVersion] = useState<'v3' | 'v4' | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const hasBasicParams =
    !!account &&
    !!chainId &&
    !!nftManagerContract &&
    !!tokenId &&
    !!spender &&
    !!rpcUrl &&
    typeof signTypedData === 'function';

  const actualVersion = useMemo<'v3' | 'v4' | null>(() => {
    if (version !== 'auto') return version;
    return detectedVersion;
  }, [version, detectedVersion]);

  const permitState = useMemo(() => {
    if (!hasBasicParams) return PermitNftState.NOT_APPLICABLE;
    if (error) return PermitNftState.ERROR;
    if (isSigning) return PermitNftState.SIGNING;
    if (permitData) return PermitNftState.SIGNED;
    return PermitNftState.READY_TO_SIGN;
  }, [error, hasBasicParams, isSigning, permitData]);

  const resolveVersion = useCallback(async (): Promise<'v3' | 'v4'> => {
    if (version === 'v3' || version === 'v4') return version;
    if (detectedVersion) return detectedVersion;

    let nextVersion: 'v3' | 'v4' = 'v4';

    if (rpcUrl && nftManagerContract && tokenId != null) {
      try {
        const methodSignature = getFunctionSelector('positions(uint256)');
        const encodedTokenId = encodeUint256(tokenId);
        const data = `0x${methodSignature}${encodedTokenId}` as HexString;

        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [
              {
                to: nftManagerContract,
                data,
              },
              'latest',
            ],
          }),
        });

        const json = await res.json();
        if (json?.result) {
          nextVersion = 'v3';
        }
      } catch {
        nextVersion = 'v4';
      }
    }

    setDetectedVersion(nextVersion);
    return nextVersion;
  }, [nftManagerContract, detectedVersion, rpcUrl, tokenId, version]);

  const getNonce = useCallback(
    async (resolvedVersion: 'v3' | 'v4'): Promise<bigint> => {
      if (resolvedVersion === 'v3') {
        if (!rpcUrl || !nftManagerContract || tokenId == null) {
          throw new Error('Missing RPC configuration for V3 permit');
        }

        const methodSignature = getFunctionSelector('positions(uint256)');
        const encodedTokenId = encodeUint256(tokenId);
        const data = `0x${methodSignature}${encodedTokenId}` as HexString;

        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [
              {
                to: nftManagerContract,
                data,
              },
              'latest',
            ],
          }),
        });

        const json = await res.json();
        const raw: string | undefined = json?.result;

        if (!raw || typeof raw !== 'string' || raw === '0x') {
          throw new Error('Failed to fetch V3 nonce from positions()');
        }

        const body = raw.slice(2);
        const nonceHex = body.slice(0, 64);
        return BigInt(`0x${nonceHex}`);
      }

      // V4: use timestamp-based nonce (matches app implementation).
      return BigInt(Math.floor(Date.now() / 1000));
    },
    [nftManagerContract, rpcUrl, tokenId],
  );

  const signPermitNft = useCallback(
    async (deadline: number): Promise<PermitNftResult | null> => {
      if (!hasBasicParams || !deadline) {
        setError(new Error('Missing required parameters for NFT permit'));
        return null;
      }

      if (permitState !== PermitNftState.READY_TO_SIGN && permitState !== PermitNftState.ERROR) {
        return null;
      }

      setIsSigning(true);
      setError(null);

      try {
        const resolvedVersion = await resolveVersion();

        if (!rpcUrl) {
          throw new Error('RPC URL is required to resolve contract name');
        }

        const methodSignature = getFunctionSelector('name()');
        const data = `0x${methodSignature}` as HexString;

        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [
              {
                to: nftManagerContract,
                data,
              },
              'latest',
            ],
          }),
        });

        const json = await res.json();
        const raw: string | undefined = json?.result;

        if (!raw || typeof raw !== 'string' || raw === '0x') {
          throw new Error('Failed to fetch NFT contract name');
        }

        const body = raw.slice(2);
        const lengthHex = body.slice(64, 128);
        const length = Number(BigInt(`0x${lengthHex}`));
        const stringHex = body.slice(128, 128 + length * 2);

        let contractName = '';
        for (let i = 0; i < stringHex.length; i += 2) {
          const code = Number.parseInt(stringHex.slice(i, i + 2), 16);
          if (code === 0) break;
          contractName += String.fromCharCode(code);
        }

        if (!contractName) {
          throw new Error('Failed to fetch NFT contract name');
        }

        const nonce = await getNonce(resolvedVersion);

        const message = {
          spender,
          tokenId,
          nonce: nonce.toString(),
          deadline,
        };

        const domain =
          resolvedVersion === 'v3'
            ? {
                name: contractName,
                version: '1',
                chainId,
                verifyingContract: nftManagerContract,
              }
            : {
                name: contractName,
                chainId,
                verifyingContract: nftManagerContract,
              };

        const types = {
          Permit: [
            { name: 'spender', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        };

        const eip712DomainFields =
          resolvedVersion === 'v3'
            ? [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
              ]
            : [
                { name: 'name', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
              ];

        const typedData = JSON.stringify({
          types: {
            EIP712Domain: eip712DomainFields,
            ...types,
          },
          domain,
          primaryType: 'Permit',
          message,
        });

        const flatSig = (await signTypedData(account.toLowerCase(), typedData)) as HexString;

        let signature: string;
        let encodedPermitData: string;

        if (resolvedVersion === 'v3') {
          const sig = splitSignature(flatSig);

          // V3 permit data: encode(deadline, v, r, s).
          const encodedDeadline = encodeUint256(deadline);
          const encodedV = encodeUint8(sig.v);
          const encodedR = encodeBytes32(sig.r);
          const encodedS = encodeBytes32(sig.s);

          encodedPermitData = `0x${encodedDeadline}${encodedV}${encodedR}${encodedS}`;
          signature = flatSig;
        } else {
          signature = flatSig;

          // V4 permit data: encode(deadline, nonce, signature).
          const encodedDeadline = encodeUint256(deadline);
          const encodedNonce = encodeUint256(nonce);
          const encodedOffset = encodeUint256(32 * 3);
          const encodedSignature = encodeBytes(signature as HexString);

          encodedPermitData = `0x${encodedDeadline}${encodedNonce}${encodedOffset}${encodedSignature}`;
        }

        const result: PermitNftResult = {
          deadline,
          nonce,
          signature,
          permitData: encodedPermitData,
        };

        setPermitData(result);
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        // eslint-disable-next-line no-console
        console.error('NFT Permit error:', err);
        setError(err);
        return null;
      } finally {
        setIsSigning(false);
      }
    },
    [
      account,
      chainId,
      nftManagerContract,
      getNonce,
      hasBasicParams,
      permitState,
      resolveVersion,
      rpcUrl,
      signTypedData,
      spender,
      tokenId,
    ],
  );

  const isReady = useMemo(
    () =>
      permitState === PermitNftState.READY_TO_SIGN &&
      !!account &&
      !!nftManagerContract &&
      !!tokenId &&
      !!spender &&
      typeof signTypedData === 'function',
    [account, nftManagerContract, permitState, signTypedData, spender, tokenId],
  );

  return {
    permitState,
    signPermitNft,
    permitData,
    isReady,
    version: actualVersion,
    isSigning,
    error,
  };
};
