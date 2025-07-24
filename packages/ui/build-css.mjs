import { execSync } from 'child_process';
import fs from 'fs/promises';
import postcss from 'postcss';
import postcssrc from 'postcss-load-config';

async function buildCss() {
  // First copy fonts to dist
  try {
    execSync('cp -r src/assets/fonts dist/', { stdio: 'inherit' });
  } catch (err) {
    console.log('Fonts directory might already exist or copy failed');
  }

  const css = await fs.readFile('src/styles.css', 'utf8');

  // Load the PostCSS config
  const { plugins } = await postcssrc();

  const result = await postcss(plugins).process(css, {
    from: 'src/styles.css',
    to: 'dist/index.css',
  });

  // Add font-face declarations at the beginning of the CSS
  const fontFaceDeclarations = `@font-face {
  font-family: 'Cera Pro';
  src: url('./fonts/cera-regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Cera Pro';
  src: url('./fonts/cera-bold.ttf') format('truetype');
  font-weight: 600;
  font-style: normal;
}

`;

  const finalCss = fontFaceDeclarations + result.css;

  await fs.writeFile('dist/index.css', finalCss);
}

buildCss().catch(console.error);
