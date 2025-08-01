import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (

    <CartProvider>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="(staff)" options={{ headerShown: false }} />
          <Stack.Screen name="adminorders" options={{ headerShown: false }} />
          <Stack.Screen name="staffs" options={{ headerShown: false }} />
          <Stack.Screen name="topups" options={{ headerShown: false }} />
          <Stack.Screen name="topups/[date]" options={{ headerShown: false }} />
          <Stack.Screen name="adminorders/[date]" options={{ headerShown: false }} />
          <Stack.Screen name="kalakarttood" options={{ headerShown: false }} />
          <Stack.Screen name="kalakarttood/[date]" options={{ headerShown: false }} />
          <Stack.Screen name="scanner" options={{ headerShown: false }} />
          <Stack.Screen name="scannertaka" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="confirmorder" options={{ headerShown: false }} />
          <Stack.Screen name="qr" options={{ headerShown: false }} />
          <Stack.Screen name="qrtaka" options={{ headerShown: false }} />
          <Stack.Screen name="qrasync" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </CartProvider>

  );
}
