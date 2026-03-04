const mockCaptureRepository = {
  deleteById: jest.fn(),
  getDetailById: jest.fn(),
  getSmartCounts: jest.fn(),
  insertMany: jest.fn(),
  listByTagId: jest.fn(),
  listLibraryFeed: jest.fn(),
  touchLastViewed: jest.fn(),
  updateNote: jest.fn(),
};

const mockReminderService = {
  clearReminder: jest.fn(),
  markDone: jest.fn(),
  snoozeByMinutes: jest.fn(),
  snoozeToTomorrowSameTime: jest.fn(),
  upsertReminder: jest.fn(),
};

const mockSearchService = {
  reindexCapture: jest.fn(),
};

const mockTagService = {
  replaceCaptureTags: jest.fn(),
};

jest.mock('@/modules/captures/capture.repository', () => ({
  CaptureRepository: jest.fn(() => mockCaptureRepository),
}));

jest.mock('@/modules/reminders/reminder.service', () => ({
  ReminderService: jest.fn(() => mockReminderService),
}));

jest.mock('@/modules/search/search.service', () => ({
  SearchService: jest.fn(() => mockSearchService),
}));

jest.mock('@/modules/tags/tag.service', () => ({
  TagService: jest.fn(() => mockTagService),
}));

import { CaptureService } from '@/modules/captures/capture.service';

describe('CaptureService', () => {
  beforeEach(() => {
    for (const mockFn of Object.values(mockCaptureRepository)) {
      mockFn.mockReset();
    }

    for (const mockFn of Object.values(mockReminderService)) {
      mockFn.mockReset();
    }

    for (const mockFn of Object.values(mockSearchService)) {
      mockFn.mockReset();
    }

    for (const mockFn of Object.values(mockTagService)) {
      mockFn.mockReset();
    }
  });

  it('clears reminders before deleting Capture metadata and reindexing search', async () => {
    const service = new CaptureService({} as never);
    await service.deleteCaptureMetadata('capture-1');

    expect(mockReminderService.clearReminder).toHaveBeenCalledWith('capture-1');
    expect(mockCaptureRepository.deleteById).toHaveBeenCalledWith('capture-1');
    expect(mockSearchService.reindexCapture).toHaveBeenCalledWith('capture-1');

    const clearReminderOrder = mockReminderService.clearReminder.mock.invocationCallOrder[0];
    const deleteOrder = mockCaptureRepository.deleteById.mock.invocationCallOrder[0];
    const reindexOrder = mockSearchService.reindexCapture.mock.invocationCallOrder[0];

    expect(clearReminderOrder).toBeLessThan(deleteOrder);
    expect(deleteOrder).toBeLessThan(reindexOrder);
  });
});
