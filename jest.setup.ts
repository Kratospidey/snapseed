import 'react-native-gesture-handler/jestSetup';

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children, ...props }: React.PropsWithChildren<object>) =>
      React.createElement(View, props, children),
  };
});

const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('SafeAreaView has been deprecated')) {
    return;
  }

  originalConsoleWarn(...args);
};

console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
    return;
  }

  originalConsoleError(...args);
};
