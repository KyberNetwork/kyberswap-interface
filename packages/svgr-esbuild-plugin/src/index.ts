import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { transform } from "@svgr/core";
import type { Config } from "@svgr/core";
import type { Plugin } from "esbuild";

const svgrPlugin = (options: Config = {}): Plugin => ({
  name: "svgr",
  setup(build) {
    build.onResolve({ filter: /\.svg$/ }, (args) => {
      switch (args.kind) {
        case "import-statement":
        case "require-call":
        case "dynamic-import":
        case "require-resolve":
          return;
        default:
          return {
            external: true,
          };
      }
    });

    build.onLoad({ filter: /\.svg$/ }, async (args) => {
      const svg = await readFile(args.path, { encoding: "utf8" });

      if (options.plugins && !options.plugins.includes("@svgr/plugin-jsx")) {
        options.plugins.push("@svgr/plugin-jsx");
      } else if (!options.plugins) {
        options.plugins = ["@svgr/plugin-jsx"];
      }

      const contents = await transform(
        svg,
        { ...options },
        { filePath: args.path }
      );

      if (args.suffix === "?url") {
        return {
          contents: readFileSync(args.path),
          loader: "dataurl",
        };
      }

      return {
        contents,
        loader: options.typescript ? "tsx" : "jsx",
      };
    });
  },
});

export { svgrPlugin };
