const prefixOverrideList = ["html", "body", "[role='portal']"];

export default {
  plugins: {
    "tailwindcss/nesting": {},
    tailwindcss: { config: "tailwind.config.ts" },
    "postcss-prefix-selector": {
      prefix: ".ks-token-selector",
      transform: function (prefix, selector, prefixedSelector) {
        if (selector === ":is(.ks-token-selector, kyber-portal.ks-ui-style)")
          return selector;
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
