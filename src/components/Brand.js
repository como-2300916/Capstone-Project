import { StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemeStyles } from '../theme';

export function Brand({ small = false, showLogo = true }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(makeStyles);
  return (
    <View style={styles.row}>
      {showLogo && !small && (
        <View style={styles.logo}>
          <View style={styles.logoCenter} />
        </View>
      )}
      <Text style={[styles.name, small && styles.nameSmall]}>AquaGuard</Text>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    logo: { width: 40, height: 40, borderWidth: 2, borderColor: colors.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    logoCenter: { width: 12, height: 12, borderRadius: 3, backgroundColor: colors.accent },
    name: { color: colors.text, fontSize: 24, fontWeight: '800' },
    nameSmall: { fontSize: 19 },
  });
}
