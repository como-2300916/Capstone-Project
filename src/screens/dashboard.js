import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeSettingsButton } from '../components/ThemeSettingsButton';
import { supabase } from '../lib/supabase';
import { useTheme, useThemeStyles } from '../theme';
import { GeofenceMap } from './geofence_map';
import { Overview } from './overview';
import { GuestsScreen } from './guests';
import { WristbandsScreen } from './wristbands';
import { AlertsScreen } from './alerts';

const receptionistTabs = [
  { key: 'Home', icon: 'view-dashboard-outline' },
  { key: 'Guests', icon: 'account-group-outline' },
  { key: 'Wristbands', icon: 'watch-variant' },
  { key: 'Geofence', icon: 'map-outline' },
];

const lifeguardTabs = [
  { key: 'Geofence', icon: 'map-outline' },
  { key: 'Alerts', icon: 'bell-alert-outline' },
];

export function Dashboard({ session, profile, onLogout }) {
  const { colors, resolvedMode } = useTheme();
  const styles = useThemeStyles(makeStyles);
  const isLifeguard = profile.role === 'lifeguard';
  const tabs = isLifeguard ? lifeguardTabs : receptionistTabs;
  const [activeTab, setActiveTab] = useState(isLifeguard ? 'Geofence' : 'Home');
  const [openBandAssignment, setOpenBandAssignment] = useState(false);
  const [openGuestRegistration, setOpenGuestRegistration] = useState(false);
  const [guests, setGuests] = useState([]);
  const [bands, setBands] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshError, setRefreshError] = useState('');

  const refreshDashboard = useCallback(async () => {
    const [guestResult, bandResult, alertResult] = await Promise.all([
      supabase.from('guests').select('*').order('created_at', { ascending: false }),
      supabase.from('wristbands').select('*').order('assigned_at', { ascending: false }),
      supabase.from('alerts').select('*').order('created_at', { ascending: false }),
    ]);

    const error = guestResult.error || bandResult.error || alertResult.error;
    if (error) {
      setRefreshError(error.message);
    } else {
      setGuests(guestResult.data || []);
      setBands(bandResult.data || []);
      setAlerts(alertResult.data || []);
      setRefreshError('');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshDashboard();

    const channel = supabase
      .channel('aquaguard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, refreshDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wristbands' }, refreshDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, refreshDashboard)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshDashboard]);

  const guestNames = useMemo(
    () => new Map(guests.map((guest) => [guest.id, guest.full_name])),
    [guests],
  );
  const openWristbandAssignment = useCallback(() => {
    setOpenBandAssignment(true);
    setActiveTab('Wristbands');
  }, []);
  const clearWristbandAssignmentRequest = useCallback(() => {
    setOpenBandAssignment(false);
  }, []);
  const openGuestRegistrationForm = useCallback(() => {
    setOpenGuestRegistration(true);
    setActiveTab('Guests');
  }, []);
  const clearGuestRegistrationRequest = useCallback(() => {
    setOpenGuestRegistration(false);
  }, []);
  async function registerGuest(form) {
    const { error } = await supabase
      .from('guests')
      .insert({ ...form, registered_by: session.user.id });
    if (error) throw error;
    await refreshDashboard();
  }

  async function assignBand(bandId, guestId) {
    const { error } = await supabase.from('wristbands').insert({
      band_id: bandId.trim().toUpperCase(),
      guest_id: guestId || null,
      assigned_by: session.user.id,
    });
    if (error) throw error;
    await refreshDashboard();
  }

  async function acknowledgeAlert(alert) {
    const { error } = await supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: session.user.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alert.id);

    if (error) {
      Alert.alert('Hindi na-update ang alert', error.message);
      return;
    }
    await refreshDashboard();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <View style={styles.dashboardTitle}>
          <Text numberOfLines={1} style={styles.resortName}>Jaylene Beach Resort</Text>
          <Text style={styles.dashboardSubtitle}>
            {isLifeguard ? 'Lifeguard Dashboard' : 'Receptionist Dashboard'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <ThemeSettingsButton />
          <Pressable
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            style={styles.logout}
          >
            <MaterialCommunityIcons name="logout" size={21} color={colors.accent} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <>
            {!!refreshError && <Text style={styles.errorBanner}>Supabase: {refreshError}</Text>}
            {activeTab === 'Home' && (
              <Overview
                guests={guests}
                bands={bands}
                onRegisterGuest={openGuestRegistrationForm}
                onAssignBand={openWristbandAssignment}
                onViewAllGuests={() => setActiveTab('Guests')}
              />
            )}
            {activeTab === 'Guests' && (
              <GuestsScreen
                guests={guests}
                onSaveGuest={registerGuest}
                openRegistration={openGuestRegistration}
                onRegistrationOpened={clearGuestRegistrationRequest}
              />
            )}
            {activeTab === 'Wristbands' && (
              <WristbandsScreen
                bands={bands}
                guests={guestNames}
                onSaveBand={assignBand}
                openAssignment={openBandAssignment}
                onAssignmentOpened={clearWristbandAssignmentRequest}
              />
            )}
            {activeTab === 'Geofence' && <GeofenceMap bands={bands} guests={guests} />}
            {activeTab === 'Alerts' && (
              <AlertsScreen alerts={alerts} onAcknowledge={acknowledgeAlert} />
            )}
          </>
        )}
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={styles.tabItem}
            >
              <View style={[styles.tabIconWrap, selected && styles.tabIconActive]}>
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={22}
                  color={selected ? '#fff' : colors.accent}
                />
              </View>
              <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>
                {tab.key}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      minHeight: 74,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dashboardTitle: { flex: 1, paddingRight: 8 },
    resortName: { color: colors.text, fontSize: 19, fontWeight: '800' },
    dashboardSubtitle: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 5 },
    logout: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorBanner: { backgroundColor: colors.surface, color: colors.danger, padding: 10, fontSize: 12 },
    tabBar: {
      minHeight: 68,
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: 3,
    },
    tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
    tabIconWrap: { minWidth: 45, height: 31, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    tabIconActive: { backgroundColor: colors.teal },
    tabLabel: { color: colors.muted, fontSize: 10, fontWeight: '600' },
    tabLabelActive: { color: colors.accent, fontWeight: '800' },
  });
}
