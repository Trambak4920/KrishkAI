import { Stack } from 'expo-router';
import { AuthProvider } from '../utils/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="credit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="marketplace" />
      </Stack>
    </AuthProvider>
  );
}
