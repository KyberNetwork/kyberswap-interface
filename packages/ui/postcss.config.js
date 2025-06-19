const prefixOverrideList = ['html', 'body', "[role='portal']"];

export default {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: { config: 'tailwind.config.ts' },
    'postcss-prefix-selector': {
      prefix: '.ks-ui-style',
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
