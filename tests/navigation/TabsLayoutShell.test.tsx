import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { TabsLayoutShell } from '@/components/navigation/TabsLayoutShell';
import { routes } from '@/constants/routes';

const mockPush = jest.fn();
const mockNativeTabsProps: Array<{
  backgroundColor?: string;
  blurEffect?: string;
  children?: React.ReactNode;
  disableTransparentOnScrollEdge?: boolean;
}> = [];
const mockTriggerNames: string[] = [];

jest.mock('expo-router', () => {
  return {
    useRouter: () => ({ push: mockPush }),
  };
});

jest.mock('expo-router/unstable-native-tabs', () => {
  const React = require('react');
  const { View } = require('react-native');

  const NativeTabs = ({ children, ...props }: { children: React.ReactNode }) => {
    mockNativeTabsProps.push(props);
    return React.createElement(View, { testID: 'native-tabs' }, children);
  };

  NativeTabs.Trigger = ({ name }: { name: string }) => {
    mockTriggerNames.push(name);
    return null;
  };

  return {
    Icon: () => null,
    Label: () => null,
    NativeTabs,
    VectorIcon: () => null,
  };
});

describe('TabsLayoutShell', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockNativeTabsProps.length = 0;
    mockTriggerNames.length = 0;
  });

  it('registers native tab triggers for all tab routes', () => {
    render(<TabsLayoutShell />);

    expect(mockTriggerNames).toEqual([
      'library/index',
      'search/index',
      'reminders/index',
      'tags/index',
      'settings/index',
    ]);
  });

  it('configures native tabs with a glass-capable iOS blur effect', () => {
    render(<TabsLayoutShell />);

    expect(mockNativeTabsProps.at(0)?.blurEffect).toBeDefined();
  });

  it('keeps the native tab bar background transparent on iOS and allows scroll-edge transparency', () => {
    render(<TabsLayoutShell />);

    expect(mockNativeTabsProps.at(0)?.backgroundColor).toBe('transparent');
    expect(mockNativeTabsProps.at(0)?.disableTransparentOnScrollEdge).not.toBe(true);
  });

  it('keeps Add Capture FAB wired to import picker route', () => {
    render(<TabsLayoutShell />);

    fireEvent.press(screen.getByText('Add Capture'));
    expect(mockPush).toHaveBeenCalledWith(routes.importPicker);
  });
});
