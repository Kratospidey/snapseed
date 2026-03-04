const mockReminderRepository = {
  deleteByCaptureId: jest.fn(),
  getByCaptureId: jest.fn(),
  listFeedSections: jest.fn(),
  listPending: jest.fn(),
  upsert: jest.fn(),
};

const mockReminderScheduler = {
  cancelNotification: jest.fn(),
  getPermissions: jest.fn(),
  openSystemNotificationSettings: jest.fn(),
  scheduleReminderNotification: jest.fn(),
};

jest.mock('@/modules/reminders/reminder.repository', () => ({
  ReminderRepository: jest.fn(() => mockReminderRepository),
}));

jest.mock('@/modules/reminders/reminder.scheduler', () => ({
  ReminderScheduler: jest.fn(() => mockReminderScheduler),
}));

jest.mock('@/utils/ids', () => ({
  createId: jest.fn(() => 'reminder-fixed-id'),
}));

import { ReminderService } from '@/modules/reminders/reminder.service';

function createReminderRecord(overrides = {}) {
  return {
    autoSnoozeCount: 0,
    captureId: 'capture-1',
    completedAt: null,
    createdAt: 1_710_000_000_000,
    dueAt: Date.now() + 60 * 60 * 1000,
    id: 'reminder-1',
    lastInteractionAt: null,
    lastNotifiedAt: null,
    localDate: '2026-03-06',
    localTime: '09:30',
    notificationId: null,
    status: 'pending',
    timezone: 'UTC',
    updatedAt: 1_710_000_000_000,
    ...overrides,
  } as const;
}

describe('ReminderService', () => {
  beforeEach(() => {
    for (const mockFn of Object.values(mockReminderRepository)) {
      mockFn.mockReset();
    }

    for (const mockFn of Object.values(mockReminderScheduler)) {
      mockFn.mockReset();
    }
  });

  it('persists reminder data and stores notification id when scheduling succeeds', async () => {
    mockReminderRepository.getByCaptureId.mockResolvedValue(null);
    mockReminderScheduler.scheduleReminderNotification.mockResolvedValue({
      notificationId: 'notif-1',
      scheduled: true,
    });

    const service = new ReminderService({} as never);
    const result = await service.upsertReminder({
      captureId: 'capture-1',
      dueAt: Date.now() + 60 * 60 * 1000,
      localDate: '2026-03-06',
      localTime: '09:30',
      timezone: 'UTC',
    });

    expect(mockReminderRepository.upsert).toHaveBeenCalledTimes(2);
    expect(mockReminderRepository.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        captureId: 'capture-1',
        notificationId: 'notif-1',
        status: 'pending',
      }),
    );
    expect(result).toEqual({
      notificationId: 'notif-1',
      scheduled: true,
    });
  });

  it('keeps reminder persisted when scheduling fails due to denied permission', async () => {
    mockReminderRepository.getByCaptureId.mockResolvedValue(null);
    mockReminderScheduler.scheduleReminderNotification.mockResolvedValue({
      reason: 'permission-denied',
      scheduled: false,
    });

    const service = new ReminderService({} as never);
    const result = await service.upsertReminder({
      captureId: 'capture-1',
      dueAt: Date.now() + 60 * 60 * 1000,
      localDate: '2026-03-06',
      localTime: '09:30',
      timezone: 'UTC',
    });

    expect(mockReminderRepository.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        captureId: 'capture-1',
        notificationId: null,
      }),
    );
    expect(result).toEqual({
      reason: 'permission-denied',
      scheduled: false,
    });
  });

  it('marks a reminder done and cancels its existing notification', async () => {
    const reminder = createReminderRecord({
      notificationId: 'notif-1',
      status: 'pending',
    });
    mockReminderRepository.getByCaptureId.mockResolvedValue(reminder);

    const service = new ReminderService({} as never);
    await service.markDone(reminder.captureId);

    expect(mockReminderScheduler.cancelNotification).toHaveBeenCalledWith('notif-1');
    expect(mockReminderRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        captureId: reminder.captureId,
        notificationId: null,
        status: 'done',
      }),
    );
  });

  it('auto-snoozes overdue pending reminders to the next day at the same local time', async () => {
    const now = new Date('2026-03-06T10:00:00').getTime();
    const overdueReminder = createReminderRecord({
      dueAt: new Date('2026-03-05T09:30:00').getTime(),
      localDate: '2026-03-05',
      localTime: '09:30',
      notificationId: 'notif-overdue',
    });
    mockReminderRepository.listPending.mockResolvedValue([overdueReminder]);
    mockReminderScheduler.scheduleReminderNotification.mockResolvedValue({
      notificationId: 'notif-next',
      scheduled: true,
    });

    const service = new ReminderService({} as never);
    await service.reconcile(now);

    expect(mockReminderScheduler.cancelNotification).toHaveBeenCalledWith('notif-overdue');
    expect(mockReminderRepository.upsert).toHaveBeenCalled();
    const finalUpsert = mockReminderRepository.upsert.mock.calls.at(-1)?.[0];

    expect(finalUpsert).toEqual(
      expect.objectContaining({
        autoSnoozeCount: overdueReminder.autoSnoozeCount + 1,
        localTime: '09:30',
        notificationId: 'notif-next',
        status: 'pending',
      }),
    );
    expect(finalUpsert.dueAt).toBeGreaterThan(now);
  });
});
