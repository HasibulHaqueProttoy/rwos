import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderThemeCss, renderTokensCss, resolveTokens } from '../src/tokens/build';
import { renderLogoModule } from '../src/tokens/logo-source';

// `pnpm --filter @rwos/ui tokens:build`: regenerates the token CSS and the logo paths.
const model = resolveTokens();
const out = (path: string) => fileURLToPath(new URL(path, import.meta.url));

writeFileSync(out('../src/styles/tokens.css'), renderTokensCss(model));
writeFileSync(out('../src/styles/theme.css'), renderThemeCss(model));
writeFileSync(out('../src/components/logo-paths.ts'), renderLogoModule());
console.info('[tokens] wrote tokens.css, theme.css and logo-paths.ts');
