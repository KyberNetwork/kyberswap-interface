import { getFunctionSelector } from '@kyber/utils/crypto';

const encodeBytes = (data: string) => {
  const length = data.length / 2; // Hex string length divided by 2 for bytes
  const lengthEncoded = length.toString(16).padStart(64, '0');
  const paddedData = data.padEnd(Math.ceil(data.length / 64) * 64, '0');

  return lengthEncoded + paddedData;
};

// Helper to manually encode ABI data
export const encodeMulticallInput = (
  requireSuccess: boolean,
  calls: { target: string; callData: string }[],
): string => {
  const functionSelector = getFunctionSelector('tryBlockAndAggregate(bool,(address,bytes)[])');

  // Encode `requireSuccess` as a 32-byte boolean
  const requireSuccessEncoded = requireSuccess ? '01'.padStart(64, '0') : '00'.padStart(64, '0');

  // `callsOffset` is fixed at 64 bytes (0x40 in hex)
  const offset = '40'.padStart(64, '0');

  const callsLength = calls.length.toString(16).padStart(64, '0');

  const encodedCalls = calls.map(call => {
    const encodedTarget = call.target.toLowerCase().replace('0x', '').padStart(64, '0');

    const encodedCallData = encodeBytes(call.callData.replace(/^0x/, ''));

    return encodedTarget + offset + encodedCallData;
  });

  const staticPart = `${functionSelector}${requireSuccessEncoded}${offset}${callsLength}`;

  const dynamicDataLocaitons: number[] = [];
  dynamicDataLocaitons.push(calls.length * 32);
  encodedCalls.forEach((call, index) => {
    if (index === encodedCalls.length - 1) return;
    dynamicDataLocaitons.push(call.length / 2 + dynamicDataLocaitons[index]);
  });

  const encodedDynamicDataLocaitons = dynamicDataLocaitons.map(location => location.toString(16).padStart(64, '0'));

  const dynamicData = encodedDynamicDataLocaitons.join('') + encodedCalls.join('');

  return `0x${staticPart}${dynamicData}`;
};

// Decode the results from the Multicall response
export const decodeMulticallOutput = (result: string | undefined): bigint[] => {
  if (!result) return [];
  const res = result.startsWith('0x') ? result.slice(2) : result;
  let offset = 0;

  // Decode blockNumber (first 32 bytes, uint256)
  //const blockNumber = BigInt("0x" + res.slice(offset, offset + 64));
  offset += 64;

  // Decode blockHash (next 32 bytes, bytes32)
  //const blockHash = "0x" + res.slice(offset, offset + 64);
  offset += 64;

  // Decode returnData array offset (not used directly)
  //const returnDataOffset = parseInt(res.slice(offset, offset + 64), 16);
  offset += 64;

  // Decode returnData array length (next 32 bytes, uint256)
  const returnDataLength = parseInt(res.slice(offset, offset + 64), 16);
  offset += 64;

  const dynamicData = res.slice(offset);

  const offsetsOfEachData = [];
  for (let i = 0; i < returnDataLength; i++) {
    const returnDataOffset = parseInt(res.slice(offset, offset + 64), 16);
    offsetsOfEachData.push(returnDataOffset);
    offset += 64;
  }

  const returnData: { success: boolean; returnData: string }[] = [];

  for (let i = 0; i < returnDataLength; i++) {
    const currentData = dynamicData.slice(offsetsOfEachData[i] * 2);

    let currentOffset = 0;
    // Decode success (bool, first 32 bytes of each tuple)
    const success = currentData.slice(currentOffset, 64).endsWith('1');
    currentOffset += 64;

    // Decode returnData offset (relative to the start of the tuple array)
    //const innerReturnDataOffset = currentData.slice(currentOffset , currentOffset + 64);
    currentOffset += 64;

    // Decode returnData length from the specified offset
    const currentDataLength = parseInt(currentData.slice(currentOffset, currentOffset + 64), 16);
    currentOffset += 64;

    const returnDataHex = '0x' + (currentData.slice(currentOffset, currentOffset + currentDataLength * 2) || '0');

    returnData.push({ success, returnData: returnDataHex });
  }

  return returnData.map(item => {
    if (item.success) return BigInt(item.returnData);
    return BigInt(0);
  });
};
