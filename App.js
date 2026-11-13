import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Brand } from './src/components/Brand';
import { Dashboard } from './src/screens/dashboard';
import { Login } from './src/screens/login';
import { ThemeProvider, useTheme, useThemeStyles } from './src/theme';
import { hasSupabaseConfig, supabase } from './src/lib/supabase';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) {
        setSession(data.session);
        setAuthLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
      setAuthLoading(false);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setProfileError('');
      return;
    }
    let alive = true;
    setProfileLoading(true);
    supabase
      .from('profiles')
      .select('full_name, role')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data: row, error }) => {
        if (!alive) return;
        setProfile(row);
        setProfileError(error?.message || (!row ? 'Walang staff profile ang account na ito.' : ''));
        setProfileLoading(false);
      });
    return () => { alive = false; };
  }, [session]);

  if (!hasSupabaseConfig) {
    return <SetupScreen />;
  }
  if (authLoading || (session && profileLoading)) {
    return <LoadingScreen />;
  }
  if (!session) {
    return <Login />;
  }
  if (profileError || !profile) {
    return <ProfileError message={profileError || 'Hindi makita ang staff profile.'} onLogout={() => supabase.auth.signOut()} />;
  }
  return <Dashboard session={session} profile={profile} onLogout={() => supabase.auth.signOut()} />;
}

function LoadingScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(makeStyles);
  return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></SafeAreaView>;
}

function SetupScreen() {
  const { colors, resolvedMode } = useTheme();
  const styles = useThemeStyles(makeStyles);
  return (
    <SafeAreaView style={styles.centerPage}>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.setupCard}>
        <Brand />
        <Text style={styles.title}>Ikonekta ang Supabase</Text>
        <Text style={styles.body}>Gumawa ng .env file sa aquaguard_mobile folder at ilagay ang Supabase project URL at publishable key.</Text>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co</Text>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...</Text>
        <Text style={styles.note}>Huwag ilagay ang service_role key sa mobile app.</Text>
      </View>
    </SafeAreaView>
  );
}

function ProfileError({ message, onLogout }) {
  const { resolvedMode } = useTheme();
  const styles = useThemeStyles(makeStyles);
  return (
    <SafeAreaView style={styles.centerPage}>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.setupCard}>
        <Brand />
        <Text style={styles.title}>Hindi ma-load ang staff profile</Text>
        <Text style={styles.body}>{message}</Text>
        <Text onPress={onLogout} style={styles.link}>Mag-log out</Text>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    centerPage: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: colors.background },
    setupCard: { padding: 24, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 14 },
    title: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 12 },
    body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
    code: { color: colors.text, backgroundColor: colors.background, borderRadius: 8, padding: 10, fontSize: 12 },
    note: { color: colors.accent, fontWeight: '700' },
    link: { color: colors.accent, fontWeight: '800', fontSize: 16, paddingVertical: 8 },
  });
}
