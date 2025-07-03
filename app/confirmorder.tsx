import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConfirmOrderPage() {
    const { cart, clearCart } = useCart();
    const { user, token } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const cardBg = Colors[colorScheme].background;
    const textColor = Colors[colorScheme].text;
    const primary = Colors[colorScheme].tint;
    const secondaryBg = colorScheme === 'dark' ? '#222' : '#f7f7f7';
    const secondaryText = colorScheme === 'dark' ? '#ccc' : '#888';
    const router = useRouter();

    const [collectionTime, setCollectionTime] = useState<Date>(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [orderUserId, setOrderUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const screenWidth = Dimensions.get('window').width;

    const onChange = (event: any, selectedDate?: Date) => {
        setShowPicker(Platform.OS === 'ios');
        if (selectedDate) setCollectionTime(selectedDate);
    };

    const handleOrderSubmit = async () => {

        if (!cart || cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }
        setLoading(true);

        console.log("cart", cart);

        try {
            const response = await fetch('https://ourcanteennbackend.vercel.app/api/user/order', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cart, collectionTime: collectionTime.toISOString() }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Order failed');
            }
            const data = await response.json();
            
            clearCart();
            setOrderId(data.orderId);
            setOrderUserId(data.order.userId);
            setModalVisible(true);
        } catch (err: any) {
            alert(err.message || 'Order failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]} edges={['top', 'left', 'right']}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={26} color={primary} />
            </TouchableOpacity>
            <Text style={[styles.header, { color: textColor }]}>Order Confirmation</Text>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: primary }]}>Your Cart</Text>
                <FlatList
                    data={cart}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                        <View style={[styles.itemRow, { backgroundColor: secondaryBg }]}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                            <View style={styles.itemInfo}>
                                <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
                                <Text style={[styles.itemQty, { color: secondaryText }]}>Qty: {item.quantity}</Text>
                                <Text style={[styles.itemPrice, { color: secondaryText }]}>৳{item.price.toFixed(2)}</Text>
                            </View>
                            <Text style={[styles.itemSubtotal, { color: secondaryText }]}>৳{(item.price * item.quantity).toFixed(2)}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={{ color: textColor, textAlign: 'center', marginTop: 20 }}>Your cart is empty.</Text>}
                />
            </View>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: primary }]}>User Details</Text>
                {user ? (
                    <View style={[styles.userDetails, { backgroundColor: secondaryBg }]}>
                        <Text style={[styles.userDetail, { color: textColor }]}><Text style={[styles.userLabel, { color: colorScheme === 'dark' ? '#aaa' : '#555' }]}>Name:</Text> {user.name}</Text>
                        <Text style={[styles.userDetail, { color: textColor }]}><Text style={[styles.userLabel, { color: colorScheme === 'dark' ? '#aaa' : '#555' }]}>Email:</Text> {user.email}</Text>
                        <Text style={[styles.userDetail, { color: textColor }]}><Text style={[styles.userLabel, { color: colorScheme === 'dark' ? '#aaa' : '#555' }]}>Phone:</Text> {user.phoneNumber}</Text>
                        <Text style={[styles.userDetail, { color: textColor }]}><Text style={[styles.userLabel, { color: colorScheme === 'dark' ? '#aaa' : '#555' }]}>Student ID:</Text> {user.studentId}</Text>
                    </View>
                ) : (
                    <Text style={{ color: textColor }}>User not logged in.</Text>
                )}
            </View>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: primary }]}>Collection Date</Text>
                <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.pickerButton, { backgroundColor: primary }]}>
                    <Text style={{ color: colorScheme === 'dark' ? '#222' : '#fff', fontWeight: 'bold' }}>{collectionTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                </TouchableOpacity>
                {showPicker && (
                    <DateTimePicker
                        value={collectionTime}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onChange}
                        minimumDate={new Date()}
                        maximumDate={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}
                    />
                )}
            </View>
            <View style={styles.section}>
                <Text style={[styles.total, { color: primary }]}>Total: ৳{total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: primary }]}
                onPress={handleOrderSubmit}
                activeOpacity={0.8}
            >
                <Text style={{ color: colorScheme === 'dark' ? '#222' : '#fff', fontWeight: 'bold', fontSize: 16 }}>Submit Order</Text>
            </TouchableOpacity>
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
                    <View style={{
                        backgroundColor: cardBg,
                        borderRadius: 20,
                        width: screenWidth < 400 ? screenWidth * 0.92 : 360,
                        maxWidth: 420,
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                        elevation: 8,
                        padding: 24,
                    }}>
                        <Ionicons name="checkmark-circle" size={56} color={primary} style={{ marginBottom: 12 }} />
                        <Text style={{ color: textColor, fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Order Placed!</Text>
                        <Text style={{ color: textColor, fontSize: 15, marginBottom: 20, textAlign: 'center' }}>
                            Show the QR code to the Canteen Manager to scan to complete the order.
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                            <TouchableOpacity onPress={() => { setModalVisible(false); router.replace('/'); }} style={{ flex: 1, backgroundColor: primary, borderRadius: 8, paddingVertical: 10, marginRight: 8, alignItems: 'center' }}>
                                <Text style={{ color: colorScheme === 'dark' ? '#222' : '#fff', fontWeight: 'bold', fontSize: 16 }}>Go to Home</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 8, borderWidth: 1.5, borderColor: primary, paddingVertical: 10, marginLeft: 8, alignItems: 'center' }}
                                onPress={() => {
                                    const data = {
                                        orderId: orderId,
                                        userId: orderUserId,
                                    };

                                    const encodedData = encodeURIComponent(JSON.stringify(data));

                                    setModalVisible(false);
                                    router.push({
                                        pathname: "/qr",
                                        params: { data: encodedData },
                                    });
                                }}
                            >
                                <Text style={{ color: primary, fontWeight: 'bold', fontSize: 16 }}>Show QR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {loading && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0005', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <ActivityIndicator size="large" color={primary} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 18,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderRadius: 10,
        padding: 8,
    },
    itemImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemQty: {
        fontSize: 13,
    },
    itemPrice: {
        fontSize: 13,
    },
    itemSubtotal: {
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    userDetails: {
        borderRadius: 10,
        padding: 12,
    },
    userDetail: {
        fontSize: 15,
        marginBottom: 4,
    },
    pickerButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    total: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 12,
    },
    backButton: {
        marginTop: 30,
        position: 'absolute',
        top: 24,
        left: 16,
        zIndex: 10,
        backgroundColor: '#fff8',
        borderRadius: 20,
        padding: 4,
    },
    userLabel: {
        fontWeight: '700',
    },
    submitButton: {
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
