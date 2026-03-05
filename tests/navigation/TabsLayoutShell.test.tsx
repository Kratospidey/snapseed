import { render } from '@testing-library/react-native';
import React from 'react';

import { TabsLayoutShell } from '@/components/navigation/TabsLayoutShell';

const mockPush = jest.fn();
const mockTabsProps: Array<{ initialRouteName?: string; screenOptions?: unknown }> = [];
const mockScreenNames: string[] = [];

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Tabs = ({ children, ...props }: { children: React.ReactNode; initialRouteName?: string }) => {
    mockTabsProps.push(props);
    return React.createElement(View, { testID: 'tabs' }, children);
  };

  Tabs.Screen = ({ name }: { name: string }) => {
    mockScreenNames.push(name);
    return null;
  };

  return {
    Tabs,
    useRouter: () => ({ push: mockPush }),
  };
});

describe('TabsLayoutShell', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockTabsProps.length = 0;
    mockScreenNames.length = 0;
  });

  it('registers the nested tab index routes Expo Router resolves under the tabs group', () => {
    render(<TabsLayoutShell />);

    expect(mockTabsProps.at(0)?.initialRouteName).toBe('library/index');
    expect(mockScreenNames).toEqual([
      'library/index',
      'search/index',
      'reminders/index',
      'tags/index',
      'settings/index',
    ]);
  });

  it('provides a custom glass tab-bar background renderer', () => {
    render(<TabsLayoutShell />);

    const screenOptions = mockTabsProps.at(0)?.screenOptions;
    expect(typeof screenOptions).toBe('function');

    const resolvedOptions = (screenOptions as (args: { route: { name: string } }) => { tabBarBackground?: unknown })({
      route: { name: 'library/index' },
    });
    expect(typeof resolvedOptions.tabBarBackground).toBe('function');
  });
});
