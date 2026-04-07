import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { apiCall } from '../utils/api';
import { t } from '../utils/translations';

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth, language } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !password) {
      Alert.alert('Error', 'Please fill name, phone and password');
      return;
    }
    setLoading(true);
    try {
      const res = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, phone, password, state, district, language }),
      });
      await setAuth(res.token, res.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={40} color="#2E7D32" />
            </View>
            <Text style={styles.title}>{t('register', language)}</Text>
            <Text style={styles.subtitle}>Join KrishkAI</Text>
          </View>

          <View style={styles.form}>
            <InputRow icon="person-outline" placeholder={t('name', language)} value={name} onChangeText={setName} testID="register-name-input" />
            <InputRow icon="call-outline" placeholder={t('phone', language)} value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="register-phone-input" />
            <InputRow icon="lock-closed-outline" placeholder={t('password', language)} value={password} onChangeText={setPassword} secure testID="register-password-input" />
            <InputRow icon="location-outline" placeholder={t('state', language)} value={state} onChangeText={setState} testID="register-state-input" />
            <InputRow icon="map-outline" placeholder={t('district', language)} value={district} onChangeText={setDistrict} testID="register-district-input" />

            <TouchableOpacity testID="register-submit-btn" style={styles.button} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('register', language)}</Text>}
            </TouchableOpacity>

            <TouchableOpacity testID="goto-login-btn" onPress={() => router.back()} style={styles.linkRow}>
              <Text style={styles.linkText}>{t('have_account', language)} </Text>
              <Text style={styles.linkBold}>{t('login', language)}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputRow({ icon, placeholder, value, onChangeText, keyboardType, secure, testID }: any) {
  return (
    <View style={styles.inputGroup}>
      <Ionicons name={icon} size={22} color="#666" style={styles.inputIcon} />
      <TextInput
        testID={testID}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secure}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#1B5E20' },
  subtitle: { fontSize: 16, color: '#4CAF50', marginTop: 4 },
  form: { gap: 14 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#E0E0E0' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#333' },
  button: { backgroundColor: '#2E7D32', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  linkText: { color: '#666', fontSize: 15 },
  linkBold: { color: '#2E7D32', fontSize: 15, fontWeight: '700' },
});
