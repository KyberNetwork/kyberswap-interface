import { Interface } from "ethers/lib/utils";
import erc20ABI from "./erc20.json";

export { default as multicallABI } from "./multicall.json";

export const erc20Interface = new Interface(erc20ABI);
