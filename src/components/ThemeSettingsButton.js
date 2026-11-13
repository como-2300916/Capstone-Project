import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '../theme';

export function ThemeSettingsButton() {
  const { resolvedMode, setMode, colors } = useTheme();
  const styles = useThemeStyles(makeStyles);
  const isDark = resolvedMode === 'dark';

  return (
    <Pressable
      onPress={() => setMode(isDark ? 'light' : 'dark')}
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: isDark }}
      style={styles.button}
    >
      <MaterialCommunityIcons
        name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
        size={21}
        color={colors.accent}
      />
    </Pressable>
  );
}

function makeStyles() {
  return StyleSheet.create({
    button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  });
}
