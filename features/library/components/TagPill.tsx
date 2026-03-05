import { AppChip } from '@/components/primitives/AppChip';

type TagPillProps = {
  label: string;
};

export function TagPill({ label }: TagPillProps) {
  return <AppChip label={`#${label}`} />;
}
