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
          // Create both descendant and same-element selectors for maximum compatibility
          // This allows both .ks-ui-style .class and .ks-ui-style.class to work
          return selector === '*' ? prefixedSelector : `${prefixedSelector}, ${prefix}${selector}`;
        }
      },
    },
    autoprefixer: {},
  },
};
