import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoFile = (relativePath: string) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('web route guards', () => {
  it('keeps the root layout behind a platform-specific wrapper instead of importing expo-sqlite directly', () => {
    const appLayout = repoFile('app/_layout.tsx');
    const webShell = repoFile('components/navigation/RootLayoutShell.web.tsx');

    expect(appLayout).toContain("RootLayoutShell");
    expect(appLayout).not.toContain("expo-sqlite");
    expect(webShell).not.toContain("expo-sqlite");
  });

  it('keeps the web tabs layout slot-based instead of depending on a native tab initialRouteName', () => {
    const webTabsLayout = repoFile('app/(tabs)/_layout.web.tsx');

    expect(webTabsLayout).toContain('Slot');
    expect(webTabsLayout).not.toContain('initialRouteName');
    expect(webTabsLayout).not.toContain('<Tabs');
  });

  it('keeps not-found recovery pointed at the web home route', () => {
    const notFoundRoute = repoFile('app/+not-found.tsx');

    expect(notFoundRoute).toContain('href={routes.home}');
    expect(notFoundRoute).toContain('Return to SnapBrain web home');
  });

  it('keeps the tags route pointed at a web-safe wrapper instead of the SQLite-backed screen', () => {
    const routeEntry = repoFile('app/(tabs)/tags/index.tsx');
    const webWrapper = repoFile('features/tags/screens/TagsRouteScreen.web.tsx');

    expect(routeEntry).toContain("TagsRouteScreen");
    expect(routeEntry).not.toContain("TagsScreen");
    expect(webWrapper).toContain("UnsupportedPlatformScreen");
    expect(webWrapper).not.toContain("expo-sqlite");
  });

  it('keeps the search route pointed at a web-safe wrapper instead of the SQLite-backed hook screen', () => {
    const routeEntry = repoFile('app/(tabs)/search/index.tsx');
    const webWrapper = repoFile('features/search/screens/SearchRouteScreen.web.tsx');

    expect(routeEntry).toContain("SearchRouteScreen");
    expect(routeEntry).not.toContain("SearchScreen");
    expect(webWrapper).toContain("UnsupportedPlatformScreen");
    expect(webWrapper).not.toContain("expo-sqlite");
  });
});
