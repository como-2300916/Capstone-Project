import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeStyles } from '../theme';
import { Card, Empty, FormInput, FormModal, PageHeading, pageStyles, } from '../components/shared_ui';

export function WristbandsScreen({ bands, guests, onSaveBand, openAssignment = false, onAssignmentOpened }) {
  const styles = useThemeStyles(makeStyles);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    if (!openAssignment) return;
    setFormVisible(true);
    onAssignmentOpened?.();
  }, [openAssignment, onAssignmentOpened]);

  async function saveBand(bandId, guestId) {
    await onSaveBand(bandId, guestId);
    setFormVisible(false);
  }

  return (
    <View style={pageStyles.page}>
      <PageHeading
        title="Wristbands"
        subtitle="Assignments and latest status"
        action="Assign band"
        onPress={() => setFormVisible(true)}
      />
      <FlatList
        data={bands}
        keyExtractor={(band) => band.band_id}
        contentContainerStyle={pageStyles.listContent}
        ListEmptyComponent={<Empty text="No wristbands assigned" />}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.cardTitle}>{item.band_id}</Text>
            <Text style={styles.body}>
              {guests.get(item.guest_id) || 'No guest assigned'} · {(item.zone || 'unknown').toUpperCase()}
            </Text>
            <Text style={styles.battery}>
              Battery: {item.battery_percent ?? '—'}%
            </Text>
            {item.latitude != null && item.longitude != null && (
              <Text style={styles.body}>{item.latitude}, {item.longitude}</Text>
            )}
          </Card>
        )}
      />
      <BandForm
        visible={formVisible}
        guests={guests}
        onClose={() => setFormVisible(false)}
        onSave={saveBand}
      />
    </View>
  );
}

function BandForm({ visible, guests, onClose, onSave }) {
  const styles = useThemeStyles(makeStyles);
  const [bandId, setBandId] = useState('');
  const [guestId, setGuestId] = useState('');
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);

  async function submit() {
    if (!bandId.trim()) throw new Error('Ilagay ang wristband ID.');
    if (!guestId || !guests.has(guestId)) throw new Error('Pumili ng valid na guest.');
    await onSave(bandId, guestId);
    setBandId('');
    setGuestId('');
    setGuestDropdownOpen(false);
  }

  return (
    <FormModal
      visible={visible}
      title="Assign wristband"
      onClose={onClose}
      onSave={submit}
      saveLabel="Assign band"
    >
      <FormInput label="Wristband ID" value={bandId} onChangeText={setBandId} />
      <Text style={styles.inputLabel}>Guest</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select guest"
        accessibilityState={{ expanded: guestDropdownOpen }}
        onPress={() => setGuestDropdownOpen((open) => !open)}
        style={styles.dropdownField}
      >
        <Text style={[styles.dropdownText, !guestId && styles.dropdownPlaceholder]}>
          {guestId ? guests.get(guestId) : 'Select guest'}
        </Text>
      </Pressable>
      {guestDropdownOpen && (
        <ScrollView style={styles.guestChoices} nestedScrollEnabled>
          {Array.from(guests.entries()).map(([guestIdOption, guestName]) => {
            const selected = guestId === guestIdOption;
            return (
              <Pressable
                key={guestIdOption}
                accessibilityRole="button"
                onPress={() => {
                  setGuestId(guestIdOption);
                  setGuestDropdownOpen(false);
                }}
                style={[styles.guestChoice, selected && styles.guestChoiceActive]}
              >
                <Text style={[styles.guestChoiceText, selected && styles.guestChoiceTextActive]}>
                  {guestName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </FormModal>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    body: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    battery: { color: colors.muted, fontSize: 14, lineHeight: 19, fontWeight: '600' },
    inputLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
    dropdownField: { minHeight: 46, justifyContent: 'center', borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 11, paddingHorizontal: 12, backgroundColor: colors.inputBackground },
    dropdownText: { color: colors.text, fontSize: 15 },
    dropdownPlaceholder: { color: colors.muted },
    guestChoices: { maxHeight: 140, borderWidth: 1, borderColor: colors.border, borderRadius: 11, backgroundColor: colors.surface },
    guestChoice: {
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    guestChoiceActive: { backgroundColor: colors.border },
    guestChoiceText: { color: colors.text },
    guestChoiceTextActive: { color: colors.accent, fontWeight: '800' },
  });
}
