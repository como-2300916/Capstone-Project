import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemeStyles } from '../theme';
import { Card, Metric, pageStyles } from '../components/shared_ui';

export function Overview({ guests, bands, onRegisterGuest, onAssignBand, onViewAllGuests }) {
  const { resolvedMode } = useTheme();
  const styles = useThemeStyles((colors) => makeStyles(colors, resolvedMode));
  const assignedGuestIds = new Set(bands.map((band) => band.guest_id).filter(Boolean));
  const guestsWithoutBand = guests.filter((guest) => !assignedGuestIds.has(guest.id));
  const recentGuests = [...guests]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metrics}>
          <Metric label="Total Registered Guests" value={guests.length} />
          <Metric label="Assigned Wristbands" value={bands.length} />
        </View>
        <Card>
          <View style={styles.needsRow}>
            <Text style={styles.needsTitle}>Needs Wristband</Text>
            <Text style={styles.pendingCount}>{guestsWithoutBand.length}</Text>
          </View>
        </Card>
      </View>

      <View style={styles.actions}>
        <QuickAction
          label="Register Guest"
          onPress={onRegisterGuest}
          primary
          styles={styles}
        />
        <QuickAction
          label="Assign Wristband"
          onPress={onAssignBand}
          styles={styles}
        />
      </View>

      <View style={styles.recentSection}>
        <View style={styles.recentHeading}>
          <Text style={styles.sectionTitle}>Recently Registered</Text>
          {!!onViewAllGuests && (
            <Pressable
              accessibilityRole="button"
              onPress={onViewAllGuests}
              hitSlop={8}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          )}
        </View>
        {recentGuests.length === 0 ? (
          <Text style={styles.empty}>No guests registered yet.</Text>
        ) : recentGuests.map((guest) => {
          const assignedBand = bands.find((band) => band.guest_id === guest.id);
          return (
            <Card key={guest.id} style={styles.recentCard}>
              <View style={styles.guestRow}>
                <View style={styles.guestDetails}>
                  <Text style={styles.guestName}>{guest.full_name}</Text>
                  {!!guest.created_at && (
                    <Text style={styles.body}>Registered {new Date(guest.created_at).toLocaleDateString()}</Text>
                  )}
                </View>
                <Text style={[styles.assignmentStatus, assignedBand ? styles.assigned : styles.unassigned]}>
                  {assignedBand ? `Assigned: ${assignedBand.band_id}` : 'Needs wristband'}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

function QuickAction({ label, onPress, primary = false, styles }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        primary ? styles.actionPrimary : styles.actionSecondary,
        pressed && styles.actionPressed,
      ]}
    >
      <Text style={[styles.actionText, primary ? styles.actionTextPrimary : styles.actionTextSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}

function makeStyles(colors, resolvedMode) {
  const secondaryBackground = resolvedMode === 'dark' ? '#22363D' : '#E6EEF1';
  return StyleSheet.create({
    scrollContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, gap: 22 },
    section: { gap: 10 },
    sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '700' },
    metrics: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    actions: { flexDirection: 'row', gap: 11 },
    actionButton: {
      height: 58,
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 6,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionPrimary: { backgroundColor: colors.teal, borderWidth: 1, borderColor: colors.accent },
    actionSecondary: { backgroundColor: secondaryBackground, borderWidth: 1, borderColor: colors.border },
    actionPressed: { opacity: 0.86 },
    actionText: { fontSize: 15, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
    actionTextPrimary: { color: '#FFFFFF' },
    actionTextSecondary: { color: colors.text },
    needsRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    needsTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    pendingCount: { color: colors.caution, fontSize: 27, fontWeight: '800' },
    body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
    recentSection: { gap: 2 },
    recentHeading: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    viewAllButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, marginRight: 2 },
    viewAll: { color: colors.accent, fontSize: 15, fontWeight: '700' },
    recentCard: { padding: 12, gap: 3, marginBottom: 8 },
    guestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    guestDetails: { flex: 1, gap: 2 },
    guestName: { color: colors.text, fontSize: 16, fontWeight: '700' },
    assignmentStatus: { maxWidth: '44%', fontSize: 12, fontWeight: '700', textAlign: 'right' },
    assigned: { color: colors.safe },
    unassigned: { color: colors.caution },
    empty: { color: colors.muted, paddingVertical: 14, fontSize: 14 },
  });
}
