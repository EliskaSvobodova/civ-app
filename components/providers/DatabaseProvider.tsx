import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from 'react-native-paper';

import { initDatabase, type AppDatabase } from '@/database';
import migrations from '@/database/migrations/migrations';
import { useAppStore } from '@/store';

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [db, setDb] = useState<AppDatabase | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    initDatabase()
      .then(setDb)
      .catch((error: unknown) => {
        setInitError(error instanceof Error ? error : new Error(String(error)));
      });
  }, []);

  if (initError) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text variant="titleMedium">Database initialization failed</Text>
        <Text variant="bodyMedium" className="mt-2 text-center">
          {initError.message}
        </Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <MigratedDatabaseProvider db={db}>{children}</MigratedDatabaseProvider>;
}

function MigratedDatabaseProvider({
  db,
  children,
}: PropsWithChildren<{ db: AppDatabase }>) {
  const { success, error } = useMigrations(db, migrations);
  const setDatabaseReady = useAppStore((state) => state.setDatabaseReady);

  useEffect(() => {
    if (success) {
      setDatabaseReady(true);
    }
  }, [success, setDatabaseReady]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text variant="titleMedium">Database migration failed</Text>
        <Text variant="bodyMedium" className="mt-2 text-center">
          {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return children;
}
