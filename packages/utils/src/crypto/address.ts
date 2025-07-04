import { keccak256 } from 'js-sha3';

/**
 * Checks if the given string is a valid Ethereum address.
 *
 * @function isAddress
 * @param {string} address - The given HEX address to check.
 * @returns {boolean} `true` if the address is valid, otherwise `false`.
 */
export const isAddress = (address: string): boolean => {
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address) && !/^(0x)?[0-9a-f]{64}$/i.test(address)) {
    // check if it has the basic requirements of an address
    return false;
  } else if (
    /^(0x)?[0-9a-f]{40}$/.test(address) ||
    /^(0x)?[0-9A-F]{40}$/.test(address) ||
    /^(0x)?[0-9a-f]{64}$/.test(address) ||
    /^(0x)?[0-9A-F]{64}$/.test(address)
  ) {
    // If it's all small caps or all all caps, return true
    return true;
  } else {
    // Otherwise check each case
    return isChecksumAddress(address);
  }
};

/**
 * Checks if the given string is a checksummed address
 *
 * @method isChecksumAddress
 * @param {string} addr the given HEX adress
 * @return {boolean}
 */
export const isChecksumAddress = (addr: string): boolean => {
  // Check each case
  const address = addr.replace('0x', '');
  const addressHash = keccak256(address.toLowerCase());
  for (let i = 0; i < 40; i++) {
    // the nth letter should be uppercase if the nth digit of casemap is 1
    if (
      (parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) ||
      (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])
    ) {
      return false;
    }
  }
  return true;
};
