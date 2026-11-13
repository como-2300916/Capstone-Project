import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme, useThemeStyles } from '../theme';

export function Card({ children, style }) {
  const styles = useThemeStyles(makeStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PageHeading({ title, subtitle, action, onPress }) {
  const styles = useThemeStyles(makeStyles);
  return (
    <View style={styles.pageHeading}>
      <View style={styles.headingText}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {!!action && <Button label={action} small onPress={onPress} />}
    </View>
  );
}

export function Metric({ label, value, color }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(makeStyles);
  return (
    <View style={styles.metric}>
      <View style={styles.metricLabelWrap}>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <View style={styles.metricValueWrap}>
        <Text style={[styles.metricValue, { color: color || colors.accent }]}>{value}</Text>
      </View>
    </View>
  );
}

export function Empty({ text }) {
  const styles = useThemeStyles(makeStyles);
  return <Text style={styles.empty}>{text}</Text>;
}

export function RowBetween({ children }) {
  const styles = useThemeStyles(makeStyles);
  return <View style={styles.rowBetween}>{children}</View>;
}

export function StatusPill({ status }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(makeStyles);
  const color = status === 'safe'
    ? colors.safe
    : status === 'caution'
      ? colors.caution
      : status === 'restricted' || status === 'open'
        ? colors.danger
        : colors.muted;

  return (
    <View style={[styles.pill, { backgroundColor: `${color}1A` }]}>
      <Text style={[styles.pillText, { color }]}>{status || 'unknown'}</Text>
    </View>
  );
}

export function Button({ label, onPress, small = false, disabled = false }) {
  const styles = useThemeStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, small && styles.buttonTextSmall]}>{label}</Text>
    </Pressable>
  );
}

export function FormModal({ visible, title, onClose, onSave, saveLabel, children }) {
  const styles = useThemeStyles(makeStyles);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    try {
      await onSave();
    } catch (saveError) {
      setError(saveError.message || 'May error sa pag-save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalShade}>
        <ScrollView
          contentContainerStyle={styles.modalScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalCard}>
            <RowBetween>
              <Text style={styles.cardTitle}>{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Isara"
                onPress={onClose}
              >
                <Text style={styles.closeModal}>×</Text>
              </Pressable>
            </RowBetween>
            {children}
            {!!error && <Text style={styles.formError}>{error}</Text>}
            <Button
              label={busy ? 'Saving...' : saveLabel}
              onPress={save}
              disabled={busy}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export function FormInput({ label, value, onChangeText, keyboardType, multiline }) {
  const styles = useThemeStyles(makeStyles);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

export const pageStyles = StyleSheet.create({
  scrollContent: { padding: 18, gap: 14 },
  page: { flex: 1, paddingTop: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 },
});

function makeStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 15,
      marginBottom: 10,
      gap: 5,
    },
    cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800', flex: 1 },
    title: { color: colors.text, fontSize: 23, fontWeight: '800' },
    subtitle: { color: colors.muted, fontSize: 13, marginTop: 3 },
    pageHeading: {
      paddingHorizontal: 18,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    headingText: { flex: 1 },
    metric: {
      width: '48%',
      minHeight: 100,
      padding: 12,
      borderRadius: 17,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricLabelWrap: { height: 36, justifyContent: 'flex-start' },
    metricValueWrap: { height: 33, justifyContent: 'center' },
    metricLabel: { color: colors.muted, fontSize: 14, lineHeight: 18, fontWeight: '700', letterSpacing: 0.1 },
    metricValue: { fontSize: 27, fontWeight: '800' },
    empty: { color: colors.muted, textAlign: 'center', marginTop: 38, fontSize: 14 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    pill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    pillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    button: {
      minHeight: 49,
      borderRadius: 13,
      paddingHorizontal: 14,
      backgroundColor: colors.teal,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 7,
    },
    buttonSmall: { minHeight: 38, paddingHorizontal: 12, marginTop: 4 },
    buttonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    buttonTextSmall: { fontSize: 12 },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.55 },
    modalShade: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,30,40,0.45)' },
    modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 22,
      paddingBottom: 30,
      gap: 10,
      maxHeight: '92%',
    },
    closeModal: { color: colors.muted, fontSize: 28, paddingHorizontal: 6 },
    inputGroup: { gap: 5 },
    inputLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
    input: {
      minHeight: 46,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 11,
      paddingHorizontal: 12,
      color: colors.text,
      backgroundColor: colors.inputBackground,
    },
    multiline: { minHeight: 72, textAlignVertical: 'top', paddingTop: 10 },
    formError: { color: colors.danger, fontWeight: '700' },
  });
}
