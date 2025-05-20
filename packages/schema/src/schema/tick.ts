import { z } from "zod";

export const tick = z.object({
  index: z.number(),
  liquidityGross: z.number(),
  liquidityNet: z.number(),
});

export type Tick = z.infer<typeof tick>;
