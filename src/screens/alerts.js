import { FlatList, Text, View } from 'react-native';
import { Card, Button, PageHeading, RowBetween, StatusPill, pageStyles } from '../components/shared_ui';
import { useThemeStyles } from '../theme';

export function AlertsScreen({ alerts, onAcknowledge }) {
  const styles = useThemeStyles(makeStyles);
  return (
    <View style={pageStyles.page}>
      <PageHeading title="Alerts" />
      <FlatList
        data={alerts}
        keyExtractor={(alert) => alert.id}
        contentContainerStyle={pageStyles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No alerts at the moment.</Text>}
        renderItem={({ item }) => (
          <Card>
            <RowBetween>
              <Text style={styles.cardTitle}>{item.alert_type.replace('_', ' ').toUpperCase()}</Text>
              <StatusPill status={item.status} />
            </RowBetween>
            <Text style={styles.body}>Band {item.band_id}</Text>
            <Text style={styles.body}>{item.message}</Text>
            {item.status === 'open' && (
              <Button label="Acknowledge" small onPress={() => onAcknowledge(item)} />
            )}
          </Card>
        )}
      />
    </View>
  );
}

function makeStyles(colors) {
  return {
    cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800', flex: 1 },
    body: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    empty: { color: colors.muted, textAlign: 'center', alignSelf: 'stretch', paddingHorizontal: 16, paddingTop: 30, fontSize: 14, lineHeight: 20 },
  };
}
