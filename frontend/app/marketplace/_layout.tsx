import { Stack } from 'expo-router';

export default function MarketplaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="create" />
      <Stack.Screen name="listing" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="order" />
      <Stack.Screen name="payment" />
    </Stack>
  );
}
