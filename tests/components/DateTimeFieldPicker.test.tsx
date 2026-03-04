import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { DateTimeFieldPicker } from '@/components/reminders/DateTimeFieldPicker';
import { colors } from '@/theme';

const originalPlatformOs = Platform.OS;

describe('DateTimeFieldPicker', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatformOs,
    });
  });

  it('uses explicit light picker appearance for date mode', () => {
    render(
      <DateTimeFieldPicker
        label="Date"
        mode="date"
        onChangeValue={jest.fn()}
        placeholder="Choose a date"
        testID="date-field"
        value={null}
      />,
    );

    fireEvent.press(screen.getByTestId('date-field'));

    const picker = screen.getByTestId('date-field-picker');

    expect(picker.props.themeVariant).toBe('light');
    expect(picker.props.textColor).toBe(colors.text);
  });

  it('uses explicit light picker appearance for time mode', () => {
    render(
      <DateTimeFieldPicker
        label="Time"
        mode="time"
        onChangeValue={jest.fn()}
        placeholder="Choose a time"
        testID="time-field"
        value={null}
      />,
    );

    fireEvent.press(screen.getByTestId('time-field'));

    const picker = screen.getByTestId('time-field-picker');

    expect(picker.props.themeVariant).toBe('light');
    expect(picker.props.textColor).toBe(colors.text);
  });
});
