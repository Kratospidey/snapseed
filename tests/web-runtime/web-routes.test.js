const { readFileSync } = require('node:fs');
const path = require('node:path');
const { getMockConfig, getMockContext } = require('expo-router/testing-library');

const repoFile = (relativePath) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('web route runtime', () => {
  it('builds the web route graph from the real app directory without throwing', () => {
    expect(() => getMockConfig('./app')).not.toThrow();
  });

  it('registers root and grouped web-safe routes in the route graph', () => {
    const config = getMockConfig('./app');
    const serialized = JSON.stringify(config);

    expect(serialized).toContain('"index"');
    expect(serialized).toContain('"library"');
    expect(serialized).toContain('"search"');
    expect(serialized).toContain('"modals/import/picker"');
  });

  it('sees both the root index route and the library route in the discovered app context', () => {
    const routeKeys = getMockContext('./app').keys();

    expect(routeKeys).toContain('./index.tsx');
    expect(routeKeys).toContain('./(tabs)/library/index.tsx');
  });

  it('keeps unsupported modal recovery pointed at the root web route', () => {
    const importPickerRoute = repoFile('app/modals/import/picker.web.tsx');

    expect(importPickerRoute).toContain('ctaHref={routes.home}');
    expect(importPickerRoute).toContain('Back to Home');
  });

  it('keeps the web tabs layout free of the broken initialRouteName pattern', () => {
    const webTabsLayout = repoFile('app/(tabs)/_layout.web.tsx');

    expect(webTabsLayout).toContain('Slot');
    expect(webTabsLayout).not.toContain('initialRouteName');
  });
});
