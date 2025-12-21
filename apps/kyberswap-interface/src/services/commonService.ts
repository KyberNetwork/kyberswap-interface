export interface TokenVolumeResponse {
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  [key: string]: any; // Allow additional properties for flexibility
  logoUrl: string; // Added to match the latest API payload
}