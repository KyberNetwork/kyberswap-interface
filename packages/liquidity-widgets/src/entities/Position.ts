import { Position as PancakePosition } from "@pancakeswap/v3-sdk";
import { Position as UniPosition } from "@uniswap/v3-sdk";

interface IPosition {
  amount0: string;
  amount1: string;
  tickLower: number;
  tickUpper: number;
}

// Define the adapter class
export class PositionAdaper implements IPosition {
  private position: UniPosition | PancakePosition;
  public owner: string;

  constructor(position: UniPosition | PancakePosition, owner: string) {
    this.position = position;
    this.owner = owner;
  }

  get amount0(): string {
    return this.position.amount0.toExact();
  }

  get amount1(): string {
    return this.position.amount1.toExact();
  }

  get tickLower() {
    return this.position.tickLower;
  }

  get tickUpper() {
    return this.position.tickUpper;
  }
}
