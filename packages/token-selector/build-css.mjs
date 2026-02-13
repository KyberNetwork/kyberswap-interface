import fs from 'fs/promises';
import postcss from 'postcss';
import postcssrc from 'postcss-load-config';

async function buildCss() {
  const css = await fs.readFile('src/styles.css', 'utf8');

  // Load the PostCSS config
  const { plugins } = await postcssrc();

  const result = await postcss(plugins).process(css, {
    from: 'src/styles.css',
    to: 'dist/index.css',
  });

  await fs.writeFile('dist/index.css', result.css);
}

buildCss().catch(console.error);
