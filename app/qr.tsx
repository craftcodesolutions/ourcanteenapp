// app/order/qr.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QRPage() {
    const { data } = useLocalSearchParams();
    const router = useRouter();

    let jsonData = {};
    try {
        jsonData = data ? JSON.parse(decodeURIComponent(data as string)) : {};
    } catch {
        jsonData = { error: "Invalid QR Data" };
    }

    // Extract orderId and userId from jsonData
    type QRData = { orderId?: string; userId?: string; [key: string]: any };
    const typedJsonData = jsonData as QRData;
    const orderId = typedJsonData.orderId;
    const userId = typedJsonData.userId;

    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Polling function
    const pollOrderStatus = async () => {
        if (!orderId || !userId) return;
        setIsPolling(true);
        try {
            const response = await fetch('https://ourcanteennbackend.vercel.app/api/user/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId, userId }),
            });
            const result = await response.json();
            if (result.orderStatus) {
                setOrderStatus(result.orderStatus);
                if (result.orderStatus === 'SUCCESS') {
                    setShowSuccessModal(true);
                    setIsPolling(false);
                    return;
                }
            }
        } catch (error: any) {
            console.log(error.message);
            // Optionally handle error
        }
        // Only poll again if not SUCCESS
        if (!showSuccessModal) {
            pollingRef.current = setTimeout(pollOrderStatus, 2000); // poll every 2s
        }
    };

    useEffect(() => {
        if (orderId && userId && !showSuccessModal && !isPolling) {
            pollOrderStatus();
        }
        return () => {
            if (pollingRef.current) clearTimeout(pollingRef.current);
        };
    }, [orderId, userId, showSuccessModal]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            const onBackPress = () => {
                router.replace('/orders');
                return true;
            };
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }
    }, [router]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/orders")}
                accessibilityLabel="Go to Home"
                accessibilityRole="button"
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={26} color="#8e24aa" />
            </TouchableOpacity>
            <View style={styles.container}>
                <Text style={styles.title}>Show this QR to the Provider</Text>
                <View style={styles.qrCard}>
                    <QRCode value={JSON.stringify(jsonData)} size={220} />
                </View>
                <Text style={styles.subtitle}>The provider will scan this code to confirm your order.</Text>
                {orderStatus && orderStatus !== 'SUCCESS' && (
                    <View style={{ marginTop: 16, alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#8e24aa" />
                        <Text style={{ color: '#8e24aa', marginTop: 8 }}>Order Status: {orderStatus}</Text>
                    </View>
                )}
            </View>
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => {}}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons name="checkmark-circle" size={64} color="#4caf50" style={{ marginBottom: 16 }} />
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#4caf50', marginBottom: 12 }}>Order Complete!</Text>
                        <Text style={{ fontSize: 16, color: '#333', marginBottom: 24, textAlign: 'center' }}>
                            Your order has been successfully completed.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setShowSuccessModal(false);
                                router.replace('/');
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Go to Home</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f5fc',
    },
    backButton: {
        position: 'absolute',
        top: 48,
        left: 24,
        zIndex: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
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
        color: '#8e24aa',
        marginBottom: 28,
        marginTop: 32,
        textAlign: 'center',
    },
    qrCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 24,
    },
    subtitle: {
        fontSize: 15,
        color: '#6d6d6d',
        textAlign: 'center',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        minWidth: 280,
    },
    modalButton: {
        backgroundColor: '#8e24aa',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 32,
        marginTop: 8,
    },
});