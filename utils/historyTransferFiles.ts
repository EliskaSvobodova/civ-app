import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { validateHistoryDocument } from '@/services/historyTransferService';
import type { HistoryTransferDocument } from '@/types';

export type HistorySaveResult = {
  fileName: string;
  /** Short description of where the file was saved (for alerts). */
  locationLabel: string;
};

function historyFileName(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `civ-history-${yyyy}-${mm}-${dd}.json`;
}

function historyFileBaseName(date = new Date()): string {
  return historyFileName(date).replace(/\.json$/i, '');
}

function documentJson(document: HistoryTransferDocument): string {
  return JSON.stringify(document, null, 2);
}

async function writeTempHistoryJson(document: HistoryTransferDocument): Promise<{
  uri: string;
  fileName: string;
}> {
  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) {
    throw new Error('File cache is unavailable on this platform');
  }

  const fileName = historyFileName();
  const uri = `${cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, documentJson(document), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return { uri, fileName };
}

export async function shareHistoryJson(document: HistoryTransferDocument): Promise<void> {
  const { uri } = await writeTempHistoryJson(document);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export match history',
    UTI: 'public.json',
  });
}

/**
 * Saves the history JSON to a user-accessible location.
 * - Android: Storage Access Framework (prefers Downloads)
 * - iOS: app Documents directory
 * - Web: browser download
 * Returns null if the user cancels the directory picker.
 */
export async function saveHistoryJsonToDownloads(
  document: HistoryTransferDocument,
): Promise<HistorySaveResult | null> {
  const fileName = historyFileName();
  const contents = documentJson(document);

  if (Platform.OS === 'web') {
    const blob = new Blob([contents], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = globalThis.document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    return { fileName, locationLabel: 'Downloads' };
  }

  if (Platform.OS === 'android') {
    const { StorageAccessFramework } = FileSystem;
    const downloadsUri = StorageAccessFramework.getUriForDirectoryInRoot('Download');
    const permissions =
      await StorageAccessFramework.requestDirectoryPermissionsAsync(downloadsUri);

    if (!permissions.granted) {
      return null;
    }

    const fileUri = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      historyFileBaseName(),
      'application/json',
    );
    await FileSystem.writeAsStringAsync(fileUri, contents, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return { fileName, locationLabel: 'Downloads (selected folder)' };
  }

  const documentDirectory = FileSystem.documentDirectory;
  if (!documentDirectory) {
    throw new Error('Documents storage is unavailable on this device');
  }

  const uri = `${documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return { fileName, locationLabel: 'App documents folder' };
}

export async function pickHistoryJson(): Promise<HistoryTransferDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'public.json'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const contents = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error('Selected file is not valid JSON');
  }

  return validateHistoryDocument(parsed);
}
