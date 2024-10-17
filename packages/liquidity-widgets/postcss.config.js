const prefixOverrideList = ["html", "body"];

export default {
  plugins: {
    "postcss-import": {},
    "tailwindcss/nesting": {},
    tailwindcss: { config: "tailwind.config.js" },
    "postcss-prefix-selector": {
      prefix: ".ks-lw-style",
      transform: function (prefix, selector, prefixedSelector) {
        if (prefixOverrideList.includes(selector)) {
          return prefix;
        } else {
          return prefixedSelector;
        }
      },
    },
    autoprefixer: {},
  },
};
