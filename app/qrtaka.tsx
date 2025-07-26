// app/qrtaka.tsx
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QRTakaPage() {
    const { data } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';

    // Theme-aware colors
    const primary = Colors[colorScheme].tint;
    const safeAreaBg = colorScheme === 'light' ? '#f8f5fc' : '#0a0a0a';
    const qrCardBg = '#fff';
    const qrCardShadow = colorScheme === 'light' ? '#000' : '#000';
    const subtitleColor = colorScheme === 'light' ? '#6d6d6d' : '#9ba1a6';
    const backButtonBg = colorScheme === 'light' ? '#fff' : '#1a1a1a';
    const backButtonShadow = colorScheme === 'light' ? '#000' : '#000';

    let jsonData = {};
    try {
        jsonData = data ? JSON.parse(decodeURIComponent(data as string)) : {};
    } catch {
        jsonData = { error: "Invalid QR Data" };
    }

    useEffect(() => {
        if (Platform.OS === 'android') {
            const onBackPress = () => {
                router.replace('/');
                return true;
            };
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }
    }, [router]);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: safeAreaBg }]}>
            <TouchableOpacity
                style={[styles.backButton, {
                    backgroundColor: backButtonBg,
                    shadowColor: backButtonShadow,
                }]}
                onPress={() => router.replace("/")}
                accessibilityLabel="Go to Home"
                accessibilityRole="button"
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={26} color={primary} />
            </TouchableOpacity>
            <View style={styles.container}>
                <Text style={[styles.title, { color: primary }]}>Show this QR to the Provider</Text>
                <View style={[styles.qrCard, {
                    backgroundColor: qrCardBg,
                    shadowColor: qrCardShadow,
                }]}>
                    <QRCode value={JSON.stringify(jsonData)} size={220} />
                </View>
                <Text style={[styles.subtitle, { color: subtitleColor }]}>The provider will scan this code to process your topup request.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 48,
        left: 24,
        zIndex: 10,
        borderRadius: 16,
        padding: 8,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 28,
        marginTop: 32,
        textAlign: 'center',
    },
    qrCard: {
        borderRadius: 24,
        padding: 24,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 24,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 8,
    },
});