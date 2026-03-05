import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AppChip } from '@/components/primitives/AppChip';
import { colors } from '@/theme';

describe('AppChip contrast', () => {
  it('uses explicit readable colors for selected state', () => {
    expect(colors.chipSelectedText).not.toBe(colors.chipSelectedBackground);

    render(<AppChip label="Grid" selected testID="chip-selected" />);

    const chip = screen.getByTestId('chip-selected');
    const chipStyle = StyleSheet.flatten(
      typeof chip.props.style === 'function' ? chip.props.style({ pressed: false }) : chip.props.style,
    );
    expect(chipStyle.backgroundColor).toBe(colors.chipSelectedBackground);
    expect(chipStyle.borderColor).toBe(colors.chipSelectedBorder);

    const label = screen.getByText('Grid');
    const labelStyle = StyleSheet.flatten(label.props.style);
    expect(labelStyle.color).toBe(colors.chipSelectedText);
  });
});
