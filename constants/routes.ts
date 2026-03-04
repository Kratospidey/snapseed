import type { Href } from 'expo-router';

export const routes = {
  captureDetail: (captureId: string) => ({
    params: { captureId },
    pathname: '/capture/[captureId]',
  } as const),
  capturePreview: (captureId: string) => ({
    params: { captureId },
    pathname: '/capture/[captureId]/preview',
  } as const),
  importPicker: '/modals/import/picker',
  importReview: '/modals/import/review',
  relinkCapture: (captureId: string) => ({
    params: { captureId },
    pathname: '/modals/relink',
  } as const),
  home: '/' as Href,
  library: '/library',
  reminders: '/reminders',
  search: '/search',
  settings: '/settings',
  settingsAbout: '/settings/about',
  settingsBackup: '/settings/backup',
  settingsNotifications: '/settings/notifications',
  settingsOnboarding: '/settings/onboarding',
  settingsStorage: '/settings/storage',
  tagDetail: (tagId: string) => ({
    params: { tagId },
    pathname: '/tags/[tagId]',
  } as const),
  tags: '/tags',
} as const;
