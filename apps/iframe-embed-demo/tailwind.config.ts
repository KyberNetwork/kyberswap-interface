import type { Config } from "tailwindcss";
import sharedConfig from "@kyber/tailwind-config";

const config: Pick<Config, "presets" | "content"> = {
  content: ["./src/**/*.{ts,tsx}", "./index.html"],
  presets: [sharedConfig],
};

export default config;
