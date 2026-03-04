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
  library: '/library',
  reminders: '/reminders',
  search: '/search',
  settings: '/settings',
  tagDetail: (tagId: string) => ({
    params: { tagId },
    pathname: '/tags/[tagId]',
  } as const),
  tags: '/tags',
} as const;
