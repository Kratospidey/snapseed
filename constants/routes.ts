export const routes = {
  captureDetail: (captureId: string) => `/capture/${captureId}`,
  capturePreview: (captureId: string) => `/capture/${captureId}/preview`,
  importPicker: '/modals/import/picker',
  importReview: '/modals/import/review',
  library: '/library',
  reminders: '/reminders',
  search: '/search',
  settings: '/settings',
  tags: '/tags',
} as const;
