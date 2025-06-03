import { z } from "zod";

export const token = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  logo: z.string().optional(),
  price: z.number().optional(),
  isStable: z.boolean().optional(),
});

export const defaultToken = {
  address: '',
  symbol: '',
  name: '',
  decimals: NaN,
  logo: '',
  price: NaN,
  isStable: false,
}

export type Token = z.infer<typeof token>;
