const mockUseRemindersScreen = jest.fn();

jest.mock('@/features/reminders/hooks/useRemindersScreen', () => ({
  useRemindersScreen: () => mockUseRemindersScreen(),
}));

import { fireEvent, render, screen } from '@testing-library/react-native';

import { RemindersScreen } from '@/features/reminders/screens/RemindersScreen';

function createReminderFeedItem(overrides = {}) {
  return {
    autoSnoozeCount: 0,
    capture: {
      capturedAt: null,
      id: 'capture-1',
      importedAt: 1_710_000_000_000,
      isMissing: false,
      mediaAssetId: null,
      note: 'Review this reminder',
      sourceFilename: 'IMG_1234.PNG',
      sourceScheme: 'file',
      sourceUri: 'file:///capture.png',
      tagLabels: ['study'],
    },
    captureId: 'capture-1',
    completedAt: null,
    createdAt: 1_710_000_000_000,
    dueAt: 1_710_000_200_000,
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
  };
}

describe('RemindersScreen', () => {
  beforeEach(() => {
    mockUseRemindersScreen.mockReset();
  });

  it('renders reminder sections and invokes quick actions', () => {
    const overdueItem = createReminderFeedItem({ id: 'reminder-overdue' });
    const upcomingItem = createReminderFeedItem({ id: 'reminder-upcoming', captureId: 'capture-2', capture: {
      ...createReminderFeedItem().capture,
      id: 'capture-2',
      sourceFilename: 'IMG_9876.PNG',
    } });
    const doneItem = createReminderFeedItem({
      id: 'reminder-done',
      captureId: 'capture-3',
      completedAt: 1_710_000_300_000,
      status: 'done',
    });

    const markDone = jest.fn();
    const snoozeByHour = jest.fn();
    const snoozeToTomorrow = jest.fn();
    const setDoneExpanded = jest.fn();

    mockUseRemindersScreen.mockReturnValue({
      doneExpanded: false,
      feed: {
        done: [doneItem],
        overdue: [overdueItem],
        upcoming: [upcomingItem],
      },
      isLoading: false,
      markDone,
      openCapture: jest.fn(),
      openNotificationSettings: jest.fn(),
      pendingActionKey: null,
      permissionState: 'granted',
      refresh: jest.fn(),
      reschedule: jest.fn(),
      setDoneExpanded,
      snoozeByHour,
      snoozeToTomorrow,
    });

    render(<RemindersScreen />);

    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Upcoming').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Done').length).toBeGreaterThan(0);

    fireEvent.press(screen.getAllByText('Mark done')[0]);
    expect(markDone).toHaveBeenCalledWith(overdueItem.captureId);

    fireEvent.press(screen.getAllByText('+1h')[0]);
    expect(snoozeByHour).toHaveBeenCalledWith(overdueItem.captureId);

    fireEvent.press(screen.getAllByText('Tomorrow')[0]);
    expect(snoozeToTomorrow).toHaveBeenCalledWith(overdueItem.captureId);

    fireEvent.press(screen.getByText('Show done'));
    expect(setDoneExpanded).toHaveBeenCalledWith(true);
  });

  it('shows permission-denied messaging when notifications are disabled', () => {
    const openNotificationSettings = jest.fn();

    mockUseRemindersScreen.mockReturnValue({
      doneExpanded: false,
      feed: {
        done: [],
        overdue: [],
        upcoming: [],
      },
      isLoading: false,
      markDone: jest.fn(),
      openCapture: jest.fn(),
      openNotificationSettings,
      pendingActionKey: null,
      permissionState: 'denied',
      refresh: jest.fn(),
      reschedule: jest.fn(),
      setDoneExpanded: jest.fn(),
      snoozeByHour: jest.fn(),
      snoozeToTomorrow: jest.fn(),
    });

    render(<RemindersScreen />);

    expect(screen.getByText('Notifications are disabled')).toBeTruthy();
    fireEvent.press(screen.getByText('Enable notifications'));
    expect(openNotificationSettings).toHaveBeenCalled();
  });
});
