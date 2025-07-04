// app/order/qr.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
    const [isChecking, setIsChecking] = useState(false);

    // Manual status check function
    const checkOrderStatus = async () => {
        if (!orderId || !userId) return;
        setIsChecking(true);
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
                }
            }
        } catch (error: any) {
            console.log(error.message);
            // Optionally handle error
        } finally {
            setIsChecking(false);
        }
    };

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
                
                {/* Manual Status Check Button */}
                <TouchableOpacity
                    style={[styles.checkStatusButton, isChecking && styles.checkStatusButtonDisabled]}
                    onPress={checkOrderStatus}
                    disabled={isChecking}
                    activeOpacity={0.8}
                >
                    {isChecking ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.checkStatusButtonText}>
                        {isChecking ? 'Checking...' : 'Check Order Status'}
                    </Text>
                </TouchableOpacity>

                {/* Display current status */}
                {orderStatus && orderStatus !== 'SUCCESS' && (
                    <View style={styles.statusContainer}>
                        <Text style={styles.statusText}>Order Status: {orderStatus}</Text>
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
        marginBottom: 32,
    },
    checkStatusButton: {
        backgroundColor: '#8e24aa',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 200,
    },
    checkStatusButtonDisabled: {
        backgroundColor: '#b39ddb',
    },
    checkStatusButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    statusContainer: {
        marginTop: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statusText: {
        color: '#8e24aa',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
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