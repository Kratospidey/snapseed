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

  it('keeps the tags route pointed at a web-safe wrapper instead of the SQLite-backed screen', () => {
    const routeEntry = repoFile('app/(tabs)/tags/index.tsx');
    const webWrapper = repoFile('features/tags/screens/TagsRouteScreen.web.tsx');

    expect(routeEntry).toContain("TagsRouteScreen");
    expect(routeEntry).not.toContain("TagsScreen");
    expect(webWrapper).toContain("UnsupportedPlatformScreen");
    expect(webWrapper).not.toContain("expo-sqlite");
  });
});
