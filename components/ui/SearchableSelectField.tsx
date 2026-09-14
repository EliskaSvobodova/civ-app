import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Dialog, Divider, Portal, Text, TextInput } from 'react-native-paper';

export type SelectOption = {
  id: string;
  name: string;
};

type SearchableSelectFieldProps = {
  label: string;
  value: string | null;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  onChange: (id: string) => void;
};

export function SearchableSelectField({
  label,
  value,
  options,
  placeholder = 'Select…',
  disabled = false,
  searchable = true,
  onChange,
}: SearchableSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = useMemo(() => {
    if (!value) return null;
    return options.find((option) => option.id === value)?.name ?? value;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.name.toLowerCase().includes(normalized));
  }, [options, query]);

  const handleOpen = () => {
    setQuery('');
    setOpen(true);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <View className="gap-2">
      <Text variant="labelMedium" className="uppercase tracking-wide text-primary">
        {label}
      </Text>
      <Button
        mode="outlined"
        icon="chevron-down"
        onPress={handleOpen}
        disabled={disabled}
        contentStyle={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}
        style={{ justifyContent: 'flex-start' }}
        labelStyle={{ flex: 1, textAlign: 'left' }}>
        {selectedLabel ?? placeholder}
      </Button>

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{ maxHeight: '80%' }}>
          <Dialog.Title>{label}</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0, maxHeight: 420 }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View className="gap-2 px-6 py-2">
                {searchable ? (
                  <TextInput
                    label={`Search ${label.toLowerCase()}`}
                    value={query}
                    onChangeText={setQuery}
                    mode="outlined"
                  />
                ) : null}
                {filteredOptions.length === 0 ? (
                  <Text variant="bodyMedium" className="text-on-surface-variant">
                    No matches.
                  </Text>
                ) : (
                  filteredOptions.map((option, index) => (
                    <View key={option.id}>
                      {index > 0 ? <Divider className="bg-outline" /> : null}
                      <Button
                        mode={value === option.id ? 'contained-tonal' : 'text'}
                        onPress={() => handleSelect(option.id)}
                        contentStyle={{ justifyContent: 'flex-start' }}
                        labelStyle={{ textAlign: 'left' }}
                        compact>
                        {option.name}
                      </Button>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
