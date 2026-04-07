import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../utils/AuthContext';

export default function Index() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [token]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>KrishkAI</Text>
      <Text style={styles.tagline}>Your Smart Farming Companion</Text>
      <ActivityIndicator size="large" color="#F9A825" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#C8E6C9',
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
});
