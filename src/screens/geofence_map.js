import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { useTheme, useThemeStyles } from '../theme';

const boundary = [
  { latitude: 13.61570173034934, longitude: 121.2469190901352 },
  { latitude: 13.61533649828517, longitude: 121.2456535540859 },
  { latitude: 13.61512125020767, longitude: 121.2456984854865 },
  { latitude: 13.61497847948591, longitude: 121.2457911570467 },
  { latitude: 13.61480330019476, longitude: 121.2459243993422 },
  { latitude: 13.61516993052304, longitude: 121.246389601577 },
  { latitude: 13.61543265778718, longitude: 121.2469656517425 },
  { latitude: 13.6156268945482, longitude: 121.2470429752354 },
];

function statusColor(status, colors) {
  if (status === 'safe') return colors.safe;
  if (status === 'caution') return colors.caution;
  if (status === 'restricted') return colors.danger;
  return '#667985';
}

export function GeofenceMap({ bands, guests }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(makeStyles);
  const [selectedBand, setSelectedBand] = useState(null);
  const guestNames = useMemo(() => new Map(guests.map((guest) => [guest.id, guest.full_name])), [guests]);
  const locatedBands = bands.filter((band) => typeof band.latitude === 'number' && typeof band.longitude === 'number');

  return (
    <View style={styles.root}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: 13.61530, longitude: 121.24632, latitudeDelta: 0.0022, longitudeDelta: 0.0022 }}
        mapType="standard"
        showsCompass
        showsScale
      >
        <Polygon coordinates={boundary} strokeColor={colors.amber} strokeWidth={4} fillColor={colors.amberFill} />
        {locatedBands.map((band) => (
          <Marker
            key={band.band_id}
            coordinate={{ latitude: band.latitude, longitude: band.longitude }}
            onPress={() => setSelectedBand(band)}
            title={guestNames.get(band.guest_id) || `Band ${band.band_id}`}
            description={`Status: ${band.status || 'unknown'}`}
            pinColor={statusColor(band.status, colors)}
          />
        ))}
      </MapView>

      <View style={styles.heading}>
        <Text style={styles.headingTitle}>Beach geofence</Text>
        <Text style={styles.headingSubtitle}>Jaylene Beach Resort · boundary draft</Text>
        <Text style={styles.boundaryText}>⬡  8 points · ~6,376 m²</Text>
      </View>

      {selectedBand && (
        <View style={styles.details}>
          <View style={styles.detailHeader}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(selectedBand.status, colors) }]} />
            <Text style={styles.name}>{guestNames.get(selectedBand.guest_id) || `Band ${selectedBand.band_id}`}</Text>
            <Pressable onPress={() => setSelectedBand(null)} hitSlop={10}><Text style={styles.close}>×</Text></Pressable>
          </View>
          <Text style={styles.secondary}>Wristband {selectedBand.band_id}</Text>
          <View style={styles.divider} />
          <Detail label="Status" value={(selectedBand.status || 'unknown').toUpperCase()} color={statusColor(selectedBand.status, colors)} />
          <Detail label="Zone" value={(selectedBand.zone || 'unknown').toUpperCase()} />
          {selectedBand.pulse_bpm != null && <Detail label="Pulse" value={`${selectedBand.pulse_bpm} BPM`} />}
          {selectedBand.battery_percent != null && <Detail label="Battery" value={`${selectedBand.battery_percent}%`} />}
          <Detail label="Coordinates" value={`${selectedBand.latitude.toFixed(5)}° N, ${selectedBand.longitude.toFixed(5)}° E`} />
          {!!selectedBand.last_seen && <Detail label="Last seen" value={new Date(selectedBand.last_seen).toLocaleString()} />}
        </View>
      )}

    </View>
  );
}

function Detail({ label, value, color }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(makeStyles);
  return <View style={styles.detailRow}><Text style={styles.secondary}>{label}</Text><Text style={[styles.detailValue, { color: color || colors.text }]}>{value}</Text></View>;
}

function makeStyles(colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    heading: { position: 'absolute', top: 12, left: 12, padding: 13, borderRadius: 15, backgroundColor: 'rgba(16,43,64,0.94)', maxWidth: '84%' },
    headingTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
    headingSubtitle: { color: '#E2EDF3', fontSize: 11, marginTop: 3 },
    boundaryText: { color: colors.amber, fontWeight: '800', fontSize: 11, marginTop: 7 },
    details: { position: 'absolute', bottom: 16, left: 12, right: 12, padding: 16, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, elevation: 8 },
    detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    statusDot: { width: 13, height: 13, borderRadius: 7 },
    name: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 17 },
    close: { color: colors.muted, fontSize: 27, lineHeight: 30, paddingHorizontal: 5 },
    secondary: { color: colors.muted, fontSize: 12 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 3 },
    detailValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  });
}
