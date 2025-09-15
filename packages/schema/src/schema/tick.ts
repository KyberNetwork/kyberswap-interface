import { z } from 'zod';

export const tick = z.object({
  index: z.number(),
  liquidityGross: z.union([z.string(), z.number()]),
  liquidityNet: z.union([z.string(), z.number()]),
});

export type Tick = z.infer<typeof tick>;
