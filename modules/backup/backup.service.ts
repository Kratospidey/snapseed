import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';

import { DATABASE_NAME } from '@/constants/app';

type ExportMetadataResult = {
  databasePath: string;
  exportedAt: number;
  manifestPath: string;
};

export class BackupService {
  async exportMetadataBackup(): Promise<ExportMetadataResult> {
    const documentDirectory = FileSystem.documentDirectory;
    const cacheDirectory = FileSystem.cacheDirectory;

    if (!documentDirectory || !cacheDirectory) {
      throw new Error('Local filesystem paths are not available on this device.');
    }

    const sourceDatabasePath = `${documentDirectory}SQLite/${DATABASE_NAME}`;
    const sourceDatabaseInfo = await FileSystem.getInfoAsync(sourceDatabasePath);

    if (!sourceDatabaseInfo.exists) {
      throw new Error('SnapBrain database file was not found for export.');
    }

    const exportedAt = Date.now();
    const timestamp = new Date(exportedAt).toISOString().replace(/[:.]/g, '-');
    const exportDirectory = `${cacheDirectory}snapbrain-backups`;
    const databasePath = `${exportDirectory}/snapbrain-metadata-${timestamp}.db`;
    const manifestPath = `${exportDirectory}/snapbrain-metadata-${timestamp}.json`;

    await FileSystem.makeDirectoryAsync(exportDirectory, { intermediates: true });
    await FileSystem.copyAsync({
      from: sourceDatabasePath,
      to: databasePath,
    });

    const manifest = {
      appName: 'SnapBrain',
      appVersion: Constants.expoConfig?.version ?? 'unknown',
      databaseName: DATABASE_NAME,
      exportedAt,
      message:
        'SnapBrain backup is metadata-first. Original screenshot image files are not included and may require relinking.',
      schemaVersion: null,
    };

    await FileSystem.writeAsStringAsync(manifestPath, JSON.stringify(manifest, null, 2));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(databasePath, {
        dialogTitle: 'Export SnapBrain metadata backup',
        mimeType: 'application/octet-stream',
        UTI: 'public.database',
      });
    }

    return {
      databasePath,
      exportedAt,
      manifestPath,
    };
  }
}
