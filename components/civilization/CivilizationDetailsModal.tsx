import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Dialog, Divider, Portal, Text } from 'react-native-paper';

import { CivilizationLeaderHeader } from '@/components/civilization/CivilizationLeaderHeader';
import type {
  Civilization,
  UniqueBuilding,
  UniqueUnit,
  UniqueWonder,
} from '@/types';

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text variant="labelMedium" className="font-bold uppercase tracking-wide text-primary">
        {title}
      </Text>
      {children}
    </View>
  );
}

function DetailBody({ children }: { children: ReactNode }) {
  return (
    <Text variant="bodyMedium" className="text-on-surface-variant">
      {children}
    </Text>
  );
}

function UniqueUnitDetails({ unit }: { unit: UniqueUnit }) {
  return (
    <View className="gap-2 rounded-md border border-outline bg-surface p-3">
      <Text variant="titleSmall" className="font-serif text-primary">
        {unit.name}
      </Text>
      {unit.replaces ? (
        <DetailBody>Replaces {unit.replaces.name}</DetailBody>
      ) : null}
      {unit.promotions && unit.promotions.length > 0 ? (
        <View className="gap-1">
          <Text variant="labelSmall" className="font-bold uppercase tracking-wide text-primary">
            Promotions
          </Text>
          {unit.promotions.map((promotion) => (
            <Text key={promotion} variant="bodySmall" className="text-on-surface-variant">
              • {promotion}
            </Text>
          ))}
        </View>
      ) : null}
      {unit.strategy ? (
        <View className="gap-1">
          <Text variant="labelSmall" className="font-bold uppercase tracking-wide text-primary">
            Strategy
          </Text>
          <Text variant="bodySmall" className="text-on-surface-variant">
            {unit.strategy}
          </Text>
        </View>
      ) : null}
      {unit.flavor ? (
        <Text variant="bodySmall" className="italic text-on-surface-variant">
          {unit.flavor}
        </Text>
      ) : null}
    </View>
  );
}

function buildingKindLabel(kind: UniqueBuilding['kind']): string | null {
  if (kind === 'nationalWonder') return 'National wonder';
  if (kind === 'uniqueBuilding') return 'Unique building';
  return null;
}

function UniqueBuildingDetails({ building }: { building: UniqueBuilding }) {
  const kindLabel = buildingKindLabel(building.kind);

  return (
    <View className="gap-2 rounded-md border border-outline bg-surface p-3">
      <Text variant="titleSmall" className="font-serif text-primary">
        {building.name}
      </Text>
      {kindLabel ? (
        <Text variant="labelSmall" className="uppercase tracking-wide text-secondary">
          {kindLabel}
        </Text>
      ) : null}
      {building.replaces ? (
        <DetailBody>Replaces {building.replaces.name}</DetailBody>
      ) : null}
      {building.description ? <DetailBody>{building.description}</DetailBody> : null}
      {building.strategy ? (
        <View className="gap-1">
          <Text variant="labelSmall" className="font-bold uppercase tracking-wide text-primary">
            Strategy
          </Text>
          <Text variant="bodySmall" className="text-on-surface-variant">
            {building.strategy}
          </Text>
        </View>
      ) : null}
      {building.flavor ? (
        <Text variant="bodySmall" className="italic text-on-surface-variant">
          {building.flavor}
        </Text>
      ) : null}
    </View>
  );
}

function wonderFocusLabel(focus: UniqueWonder['focus']): string | null {
  if (!focus) return null;
  return focus.charAt(0).toUpperCase() + focus.slice(1);
}

function resolveBuildingName(
  buildings: UniqueBuilding[],
  buildingId: string,
): string | null {
  return buildings.find((building) => building.id === buildingId)?.name ?? null;
}

function UniqueWonderDetails({
  wonder,
  buildings,
}: {
  wonder: UniqueWonder;
  buildings: UniqueBuilding[];
}) {
  const focusLabel = wonderFocusLabel(wonder.focus);
  const requiresName = wonder.requires
    ? resolveBuildingName(buildings, wonder.requires)
    : null;

  return (
    <View className="gap-2 rounded-md border border-outline bg-surface p-3">
      <Text variant="titleSmall" className="font-serif text-primary">
        {wonder.name}
      </Text>
      {focusLabel ? (
        <Text variant="labelSmall" className="uppercase tracking-wide text-secondary">
          Focus: {focusLabel}
        </Text>
      ) : null}
      {requiresName ? <DetailBody>Requires {requiresName}</DetailBody> : null}
      {wonder.exclusiveGroup ? (
        <DetailBody>Mutually exclusive with other branch wonders</DetailBody>
      ) : null}
      {wonder.strategy ? (
        <View className="gap-1">
          <Text variant="labelSmall" className="font-bold uppercase tracking-wide text-primary">
            Strategy
          </Text>
          <Text variant="bodySmall" className="text-on-surface-variant">
            {wonder.strategy}
          </Text>
        </View>
      ) : null}
      {wonder.flavor ? (
        <Text variant="bodySmall" className="italic text-on-surface-variant">
          {wonder.flavor}
        </Text>
      ) : null}
    </View>
  );
}

export function CivilizationDetailsModal({
  civilization,
  visible,
  onDismiss,
}: {
  civilization: Civilization | null;
  visible: boolean;
  onDismiss: () => void;
}) {
  if (!civilization) {
    return null;
  }

  const buildings = civilization.uniqueBuildings ?? [];
  const wonders = civilization.uniqueWonders ?? [];

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ maxHeight: '90%' }}>
        <Dialog.Title>{civilization.name}</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="gap-4 px-6 pb-2">
              <CivilizationLeaderHeader civilization={civilization} />

              <Divider className="bg-outline" />

              <DetailSection title={civilization.uniqueAbility.name}>
                <DetailBody>{civilization.uniqueAbility.description}</DetailBody>
              </DetailSection>

              {civilization.uniqueUnits.length > 0 ? (
                <DetailSection title="Unique units">
                  <View className="gap-3">
                    {civilization.uniqueUnits.map((unit) => (
                      <UniqueUnitDetails key={unit.id} unit={unit} />
                    ))}
                  </View>
                </DetailSection>
              ) : null}

              {buildings.length > 0 ? (
                <DetailSection title="Unique buildings">
                  <View className="gap-3">
                    {buildings.map((building) => (
                      <UniqueBuildingDetails key={building.id} building={building} />
                    ))}
                  </View>
                </DetailSection>
              ) : null}

              {wonders.length > 0 ? (
                <DetailSection title="Unique wonders">
                  <View className="gap-3">
                    {wonders.map((wonder) => (
                      <UniqueWonderDetails
                        key={wonder.id}
                        wonder={wonder}
                        buildings={buildings}
                      />
                    ))}
                  </View>
                </DetailSection>
              ) : null}
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
