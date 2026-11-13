import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useThemeStyles } from '../theme';
import {
  Card,
  Empty,
  FormInput,
  FormModal,
  PageHeading,
  pageStyles,
} from '../components/shared_ui';

export function GuestsScreen({ guests, onSaveGuest, openRegistration = false, onRegistrationOpened }) {
  const styles = useThemeStyles(makeStyles);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    if (!openRegistration) return;
    setFormVisible(true);
    onRegistrationOpened?.();
  }, [openRegistration, onRegistrationOpened]);

  async function saveGuest(guest) {
    await onSaveGuest(guest);
    setFormVisible(false);
  }

  return (
    <View style={pageStyles.page}>
      <PageHeading
        title="Guests"
        subtitle="Registered resort guests"
        action="Register guest"
        onPress={() => setFormVisible(true)}
      />
      <FlatList
        data={guests}
        keyExtractor={(guest) => guest.id}
        contentContainerStyle={pageStyles.listContent}
        ListEmptyComponent={<Empty text="Wala pang registered guest." />}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.cardTitle}>{item.full_name}</Text>
            <Text style={styles.body}>
              {item.age ? `${item.age} years old` : 'Age not provided'}
              {item.contact ? ` · ${item.contact}` : ''}
            </Text>
            {!!item.notes && <Text style={styles.body}>{item.notes}</Text>}
          </Card>
        )}
      />
      <GuestForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSave={saveGuest}
      />
    </View>
  );
}

function GuestForm({ visible, onClose, onSave }) {
  const styles = useThemeStyles(makeStyles);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');

  async function submit() {
    if (!name.trim()) throw new Error('Ilagay ang pangalan ng guest.');
    await onSave({
      full_name: name.trim(),
      age: age ? Number(age) : null,
      contact,
      notes,
    });
    setName('');
    setAge('');
    setContact('');
    setNotes('');
  }

  return (
    <FormModal
      visible={visible}
      title="Register guest"
      onClose={onClose}
      onSave={submit}
      saveLabel="Save guest"
    >
      <FormInput label="Full name" value={name} onChangeText={setName} />
      <FormInput label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
      <FormInput label="Contact" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
      <FormInput label="Notes" value={notes} onChangeText={setNotes} multiline />
    </FormModal>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    body: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  });
}
