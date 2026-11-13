import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeSettingsButton } from '../components/ThemeSettingsButton';
import { supabase } from '../lib/supabase';
import { useTheme, useThemeStyles } from '../theme';

export function Login() {
  const { colors, resolvedMode } = useTheme();
  const styles = useThemeStyles(makeStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signIn() {
    if (!email.trim() || !password) {
      setError('Ilagay ang email at password.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) setError(signInError.message);
    setBusy(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.brandRow}>
              <Text style={styles.resortName}>Jaylene Beach Resort</Text>
              <View style={styles.themeButton}><ThemeSettingsButton /></View>
            </View>
            <Text style={styles.subtitle}>Staff login</Text>
            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Enter your email" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" returnKeyType="next" />
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput value={password} onChangeText={setPassword} style={styles.passwordInput} placeholder="Enter your password" placeholderTextColor={colors.muted} secureTextEntry={!showPassword} autoComplete="password" returnKeyType="done" onSubmitEditing={signIn} />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Itago ang password' : 'Ipakita ang password'}
                  hitSlop={10}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]} onPress={signIn} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 26, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22 },
  brandRow: { position: 'relative', alignItems: 'stretch', justifyContent: 'center' },
  resortName: { width: '100%', paddingHorizontal: 24, color: colors.text, fontSize: 21, lineHeight: 27, fontWeight: '800', textAlign: 'center', flexShrink: 1 },
  themeButton: { position: 'absolute', right: -14, top: -14 },
  subtitle: { color: colors.muted, textAlign: 'center', fontSize: 13, marginTop: 9 },
  form: { marginTop: 30, gap: 9 },
  label: { color: colors.muted, fontSize: 14, fontWeight: '600', marginTop: 5 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, color: colors.text, backgroundColor: colors.inputBackground, fontSize: 16 },
  passwordWrap: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 12, backgroundColor: colors.inputBackground },
  passwordInput: { flex: 1, height: 50, color: colors.text, fontSize: 16 },
  button: { height: 54, borderRadius: 14, marginTop: 15, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.65 },
  error: { color: colors.danger, fontWeight: '600' },
  });
}
