const mockCopyAsync = jest.fn();
const mockGetInfoAsync = jest.fn();
const mockIsAvailableAsync = jest.fn();
const mockMakeDirectoryAsync = jest.fn();
const mockShareAsync = jest.fn();
const mockWriteAsStringAsync = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
  documentDirectory: 'file:///docs/',
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  makeDirectoryAsync: (...args: unknown[]) => mockMakeDirectoryAsync(...args),
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: (...args: unknown[]) => mockIsAvailableAsync(...args),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '0.1.0',
    },
  },
}));

import { BackupService } from '@/modules/backup/backup.service';

describe('BackupService', () => {
  beforeEach(() => {
    mockCopyAsync.mockReset();
    mockGetInfoAsync.mockReset();
    mockIsAvailableAsync.mockReset();
    mockMakeDirectoryAsync.mockReset();
    mockShareAsync.mockReset();
    mockWriteAsStringAsync.mockReset();
  });

  it('exports metadata backup with honest manifest messaging', async () => {
    mockGetInfoAsync.mockResolvedValue({
      exists: true,
      size: 1024,
    });
    mockIsAvailableAsync.mockResolvedValue(true);

    const service = new BackupService();
    const result = await service.exportMetadataBackup();

    expect(result.databasePath).toContain('snapbrain-metadata-');
    expect(mockCopyAsync).toHaveBeenCalled();
    expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('metadata-first'),
    );
    expect(mockShareAsync).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        dialogTitle: 'Export SnapBrain metadata backup',
      }),
    );
  });
});
