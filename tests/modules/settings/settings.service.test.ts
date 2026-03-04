const mockSettingsRepository = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('@/modules/settings/settings.repository', () => ({
  SettingsRepository: jest.fn(() => mockSettingsRepository),
}));

import { SettingsService } from '@/modules/settings/settings.service';

describe('SettingsService', () => {
  beforeEach(() => {
    mockSettingsRepository.get.mockReset();
    mockSettingsRepository.set.mockReset();
  });

  it('resolves initial library view mode from last mode when available', async () => {
    mockSettingsRepository.get
      .mockResolvedValueOnce('list')
      .mockResolvedValueOnce('grid');

    const service = new SettingsService({} as never);
    const mode = await service.getLibraryInitialViewMode();

    expect(mode).toBe('list');
  });

  it('falls back to default library view mode when no last mode exists', async () => {
    mockSettingsRepository.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('list');

    const service = new SettingsService({} as never);
    const mode = await service.getLibraryInitialViewMode();

    expect(mode).toBe('list');
  });

  it('uses safe defaults for notification preferences when missing', async () => {
    mockSettingsRepository.get.mockResolvedValue(null);

    const service = new SettingsService({} as never);
    const prefs = await service.getNotificationPreferences();

    expect(prefs).toEqual({
      inAppRemindersEnabled: true,
      pushNotificationsEnabled: true,
    });
  });
});
