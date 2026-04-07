import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { apiCall } from '../utils/api';
import { t } from '../utils/translations';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth, language } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
      await setAuth(res.token, res.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
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
              <Ionicons name="leaf" size={48} color="#2E7D32" />
            </View>
            <Text style={styles.title}>KrishkAI</Text>
            <Text style={styles.subtitle}>{t('login', language)}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Ionicons name="call-outline" size={22} color="#666" style={styles.inputIcon} />
              <TextInput
                testID="login-phone-input"
                style={styles.input}
                placeholder={t('phone', language)}
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.inputIcon} />
              <TextInput
                testID="login-password-input"
                style={styles.input}
                placeholder={t('password', language)}
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity testID="login-submit-btn" style={styles.button} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('login', language)}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity testID="goto-register-btn" onPress={() => router.push('/register')} style={styles.linkRow}>
              <Text style={styles.linkText}>{t('no_account', language)} </Text>
              <Text style={styles.linkBold}>{t('register', language)}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 36, fontWeight: '800', color: '#1B5E20', letterSpacing: 1 },
  subtitle: { fontSize: 18, color: '#4CAF50', marginTop: 4, fontWeight: '600' },
  form: { gap: 16 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#E0E0E0' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 17, color: '#333' },
  eyeBtn: { padding: 8 },
  button: { backgroundColor: '#2E7D32', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText: { color: '#666', fontSize: 15 },
  linkBold: { color: '#2E7D32', fontSize: 15, fontWeight: '700' },
});
