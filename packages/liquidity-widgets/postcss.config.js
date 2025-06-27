const prefixOverrideList = ['html', 'body', "[role='portal']"];

export default {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},
    tailwindcss: { config: 'tailwind.config.ts' },
    'postcss-prefix-selector': {
      prefix: '.ks-lw-style',
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
