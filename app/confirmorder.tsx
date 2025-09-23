import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Restaurant {
    _id: string;
    name: string;
    location: string;
    institute: string;
    banner: string;
    logo: string;
    openingHours: any;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}

export default function ConfirmOrderPage() {
    const { cart, clearCart, restaurantId } = useCart();
    const { user, token, logout } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const cardBg = Colors[colorScheme].background;
    const textColor = Colors[colorScheme].text;
    const primary = Colors[colorScheme].tint;
    const secondaryBg = colorScheme === 'dark' ? '#222' : '#f7f7f7';
    const secondaryText = colorScheme === 'dark' ? '#ccc' : '#888';
    const router = useRouter();

    const [collectionTime, setCollectionTime] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [orderUserId, setOrderUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [isOpenToday, setIsOpenToday] = useState(false);
    const [timeValidationError, setTimeValidationError] = useState<string>('');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const screenWidth = Dimensions.get('window').width;

    // Calculate minimum date based on restaurant opening status
    const getMinimumDate = () => {
        const today = new Date();
        if (isOpenToday) {
            return today;
        } else {
            // If restaurant is closed today, set minimum date to tomorrow
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
        }
    };

    // Validate if selected time is within restaurant opening hours
    const validateSelectedTime = (selectedDateTime: Date) => {
        if (!restaurant) return true;

        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const selectedDay = days[selectedDateTime.getDay()];
        const dayHours = restaurant.openingHours[selectedDay];

        // If restaurant is closed on selected day
        if (!dayHours || !dayHours.open) {
            setTimeValidationError(`Restaurant is closed on ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}`);
            return false;
        }

        // Check if selected time is within opening hours
        const selectedHour = selectedDateTime.getHours();
        const selectedMinute = selectedDateTime.getMinutes();
        const selectedTimeInMinutes = selectedHour * 60 + selectedMinute;

        const startHour = parseInt(dayHours.start || '0');
        const endHour = parseInt(dayHours.end || '0');
        const startTimeInMinutes = startHour * 60;
        const endTimeInMinutes = endHour * 60;

        if (selectedTimeInMinutes < startTimeInMinutes || selectedTimeInMinutes > endTimeInMinutes) {
            const formatTime = (hour: number) => {
                const suffix = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                return `${hour12}:00 ${suffix}`;
            };
            
            setTimeValidationError(
                `Restaurant is closed at this time. Open: ${formatTime(startHour)} - ${formatTime(endHour)}`
            );
            return false;
        }

        setTimeValidationError('');
        return true;
    };

    // Fetch restaurant data to check opening hours
    useEffect(() => {
        const fetchRestaurantData = async () => {
            if (!restaurantId || !token) return;

            try {
                const response = await axios.get(`https://ourcanteennbackend.vercel.app/api/user/res/${restaurantId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRestaurant(response.data.restaurant);
            } catch (error: any) {
                if (error.response?.status === 403) {
                    logout();
                    router.push("/(auth)/signin");
                }
                console.log('Error fetching restaurant data:', error);
            }
        };

        fetchRestaurantData();
    }, [restaurantId, token]);

    // Check if restaurant is open today
    useEffect(() => {
        if (!restaurant) return;

        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const today = new Date();
        const dayName = days[today.getDay()];

        let dayJson = restaurant.openingHours[dayName];
        if (dayJson && dayJson.open) {
            const now = today.getHours();
            // Allow today as minimum if now is before opening or within opening hours
            if ((Number(dayJson.start) <= now && Number(dayJson.end) >= now) || (now < Number(dayJson.start))) {
                setIsOpenToday(true);
            }
        }
    }, [restaurant]);

    // Update collection time when restaurant data is loaded and opening status is determined
    useEffect(() => {
        if (restaurant) {
            const minDate = getMinimumDate();
            setCollectionTime(minDate);
            // Validate the initial time
            validateSelectedTime(minDate);
        }
    }, [restaurant, isOpenToday]);

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newDateTime = new Date(collectionTime);
            newDateTime.setFullYear(selectedDate.getFullYear());
            newDateTime.setMonth(selectedDate.getMonth());
            newDateTime.setDate(selectedDate.getDate());
            
            // Validate the new date/time combination
            validateSelectedTime(newDateTime);
            setCollectionTime(newDateTime);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            const newDateTime = new Date(collectionTime);
            newDateTime.setHours(selectedTime.getHours());
            newDateTime.setMinutes(selectedTime.getMinutes());
            newDateTime.setSeconds(0); // Set seconds to 0
            newDateTime.setMilliseconds(0); // Set milliseconds to 0
            
            // Validate the new date/time combination
            validateSelectedTime(newDateTime);
            setCollectionTime(newDateTime);
        }
    };

    const handleOrderSubmit = async () => {

        if (!cart || cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        // Validate collection time before submitting
        if (!validateSelectedTime(collectionTime)) {
            alert(`Cannot place order: ${timeValidationError}`);
            return;
        }

        setLoading(true);

        console.log("cart", cart);

        try {
            const response = await axios.post('https://ourcanteennbackend.vercel.app/api/user/order', 
                { cart, collectionTime: collectionTime.toISOString() },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            clearCart();
            setOrderId(response.data.orderId);
            setOrderUserId(response.data.order.userId);
            setModalVisible(true);
        } catch (err: any) {
            if (err.response?.status === 403) {
                logout();
                router.push("/(auth)/signin");
            } else {
                alert(err.response?.data?.message || err.message || 'Order failed');
            }
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

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
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
                        scrollEnabled={false}
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
                    <Text style={[styles.sectionTitle, { color: primary }]}>Collection Date & Time</Text>
                    
                    {/* Date Picker */}
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.pickerButton, { backgroundColor: primary, marginBottom: 8 }]}>
                        <Text style={{ color: colorScheme === 'dark' ? '#222' : '#fff', fontWeight: 'bold' }}>
                            📅 {collectionTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                    </TouchableOpacity>
                    
                    {/* Time Picker */}
                    <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.pickerButton, { backgroundColor: secondaryBg, borderWidth: 1, borderColor: primary }]}>
                        <Text style={{ color: primary, fontWeight: 'bold' }}>
                            🕐 {collectionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                    
                    {showDatePicker && (
                        <DateTimePicker
                            value={collectionTime}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            minimumDate={getMinimumDate()}
                            maximumDate={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}
                        />
                    )}
                    
                    {showTimePicker && (
                        <DateTimePicker
                            value={collectionTime}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onTimeChange}
                            minuteInterval={1}
                        />
                    )}

                    {/* Time Validation Error */}
                    {timeValidationError && (
                        <View style={{ 
                            backgroundColor: '#ffebee', 
                            borderRadius: 8, 
                            padding: 12, 
                            marginTop: 8,
                            borderWidth: 1,
                            borderColor: '#ffcdd2'
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="warning" size={18} color="#d32f2f" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#d32f2f', fontSize: 14, fontWeight: '600', flex: 1 }}>
                                    {timeValidationError}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {restaurant && (
                    <View style={styles.section}>
                        {(() => {
                            // Get today's opening hours for the message
                            let message = '';
                            let iconColor = '#4caf50'; // green
                            let iconName: 'check-circle' | 'info' | 'error' = 'check-circle';
                            
                            if (restaurant) {
                                const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                                const today = new Date();
                                const dayName = days[today.getDay()];
                                const dayJson = restaurant.openingHours[dayName];
                                
                                if (dayJson && dayJson.open) {
                                    const now = today.getHours();
                                    const startHour = Number(dayJson.start);
                                    const endHour = Number(dayJson.end);
                                    
                                    if (now >= startHour && now <= endHour) {
                                        // Canteen is currently open
                                        message = 'Canteen is open now.';
                                        iconColor = '#4caf50'; // green
                                        iconName = 'check-circle';
                                    } else if (now < startHour) {
                                        // Canteen hasn't opened yet today
                                        const date = new Date();
                                        date.setHours(startHour, 0, 0, 0);
                                        const openingTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        message = `Canteen is closed now. Will open at ${openingTime}. You can order now & collect at opening time.`;
                                        iconColor = '#ffb300'; // yellow
                                        iconName = 'info';
                                    } else {
                                        // Canteen is closed for today (after closing time)
                                        message = 'Canteen is closed for today. You can preorder for later.';
                                        iconColor = '#f00'; // red
                                        iconName = 'error';
                                    }
                                } else {
                                    // Restaurant is closed today
                                    message = 'Canteen is closed for today. You can preorder for later.';
                                    iconColor = '#f00'; // red
                                    iconName = 'error';
                                }
                            }
                            
                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4 }}>
                                    <MaterialIcons name={iconName} size={28} color={iconColor} />
                                    <Text style={{ fontSize: 15, paddingHorizontal: 5, fontWeight: '600', color: iconColor, opacity: 0.85 }}>
                                        {message}
                                    </Text>
                                </View>
                            );
                        })()}
                        <View style={[styles.restaurantDetails, { backgroundColor: secondaryBg }]}>
                            <View style={styles.restaurantHeader}>
                                <Image source={{ uri: restaurant.logo }} style={styles.restaurantLogo} />
                                <View style={styles.restaurantInfo}>
                                    <Text style={[styles.restaurantName, { color: textColor }]}>{restaurant.name}</Text>
                                    <Text style={[styles.restaurantInstitute, { color: secondaryText }]}>{restaurant.institute}</Text>
                                </View>
                            </View>
                            {/* <Text style={[styles.restaurantDetail, { color: textColor }]}><Text style={[styles.restaurantLabel, { color: colorScheme === 'dark' ? '#aaa' : '#555' }]}>Location:</Text> {restaurant.location}</Text> */}
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.total, { color: primary }]}>Total: ৳{total.toFixed(2)}</Text>
                </View>
            </ScrollView>

            <TouchableOpacity
                style={[
                    styles.submitButton,
                    {
                        backgroundColor: (restaurant && !timeValidationError) ? primary : '#ccc',
                        opacity: (restaurant && !timeValidationError) ? 1 : 0.6
                    }
                ]}
                onPress={handleOrderSubmit}
                activeOpacity={0.8}
                disabled={!restaurant || loading || !!timeValidationError}
            >
                <Text style={{
                    color: (restaurant && !timeValidationError) ? (colorScheme === 'dark' ? '#222' : '#fff') : '#666',
                    fontWeight: 'bold',
                    fontSize: 16
                }}>
                    {!restaurant ? 'Loading...' : timeValidationError ? 'Invalid Time Selected' : 'Submit Order'}
                </Text>
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
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 18,
        textAlign: 'center',
    },
    section: {
        marginBottom: 12,
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
    restaurantDetails: {
        borderRadius: 10,
        padding: 12,
    },
    restaurantDetail: {
        fontSize: 15,
        marginBottom: 4,
    },
    restaurantLabel: {
        fontWeight: '700',
    },
    restaurantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    restaurantLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    restaurantInfo: {
        flex: 1,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    restaurantInstitute: {
        fontSize: 14,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 16,
    },
});