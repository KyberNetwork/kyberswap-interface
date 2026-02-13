const prefixOverrideList = ["html", "body", "[role='portal']"];

export default {
  plugins: {
    "tailwindcss/nesting": {},
    tailwindcss: { config: "tailwind.config.ts" },
    "postcss-prefix-selector": {
      prefix: ".ks-token-selector",
      transform: function (prefix, selector, prefixedSelector) {
        if (prefixOverrideList.includes(selector)) {
          return prefix;
        } else {
          return selector === "*"
            ? prefixedSelector
            : `${prefixedSelector}, ${prefix}${selector}`;
        }
      },
    },
    autoprefixer: {},
  },
};
