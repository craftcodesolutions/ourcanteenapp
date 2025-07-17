import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const typeOptions = [
    { label: 'User ID', value: 'userId' },
    { label: 'Phone Number', value: 'phoneNumber' },
    { label: 'Email', value: 'email' },
];

export default function TopupsPage() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { token, user, logout } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams();

    // If coming from scanner, params: userId, type (type is 'uid' in scanner, map to 'userId')
    const scannerUserId = params.userId as string | undefined;
    const scannerType = params.type === 'uid' ? 'userId' : (params.type as string | undefined);
    const isFromScanner = Boolean(scannerUserId && scannerType);

    // Form state
    const [key, setKey] = useState(scannerUserId || '');
    const [type, setType] = useState(scannerType || 'userId');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Replace allTopups state with days
    const [days, setDays] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [buttonAnim] = useState(new Animated.Value(1));

    // Phone number serialization function (same as signup page)
    const serializePhoneNumber = (phoneNumber: string) => {
        return phoneNumber.replace(/\D/g, "").slice(0, 13);
    };

    // Fetch all topups on mount
    useEffect(() => {
        const fetchTopups = async () => {
            setFetching(true);
            setFetchError(null);
            try {
                const res = await axios.get('https://ourcanteennbackend.vercel.app/api/owner/topup', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = res.data;
                if (data.success) {
                    setDays(data.days || []);
                } else {
                    setFetchError(data.error || 'Failed to fetch topups.');
                }
            } catch (error: any) {
                console.log(error);
                if (error.response?.status === 403) {
                    logout();
                    router.push("/(auth)/signin");
                    return;
                }
                setFetchError('Network error.');
            }
            setFetching(false);
        };
        if (token) fetchTopups();
    }, [token, logout, router]);

    const handleSubmit = async () => {
        setError(null);
        setSuccess(false);

        console.log(isFromScanner);
        if (!key || !type || !amount) {
            setError('All fields are required.');
            return;
        }
        
        // Phone number validation (same as signup page)
        if (type === 'phoneNumber') {
            const serializedPhone = serializePhoneNumber(key);
            if (!serializedPhone) {
                setError('Phone number is required.');
                return;
            } else if (!/^8801\d{9}$/.test(serializedPhone)) {
                setError('Phone number must start with 8801 and be exactly 13 digits.');
                return;
            }
        }
        
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('Amount must be a positive number.');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post('https://ourcanteennbackend.vercel.app/api/owner/topup', {
                key,
                type,
                amount: Number(amount),
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = res.data;
            if (data.success) {
                setDays(data.days || []);
                setSuccess(true);
                setAmount('');
            } else {
                setError(data.error || 'Topup failed.');
            }
        } catch (error: any) {
            console.log(error);
            if (error.response?.status === 403) {
                logout();
                router.push("/(auth)/signin");
                return;
            }
            setError('Network error.');
        }
        setLoading(false);
    };

    const handleButtonPressIn = () => {
        Animated.spring(buttonAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 30,
            bounciness: 8,
        }).start();
    };
    const handleButtonPressOut = () => {
        Animated.spring(buttonAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 8,
        }).start();
    };



    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#f3f1fa' : '#18181b' }}>
            {/* Header - match adminorders.tsx */}
            <View style={[styles.headerWrapper, { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingTop: 18, paddingBottom: 8, paddingHorizontal: 24 }]}>
                <TouchableOpacity
                    onPress={() => router.replace('/')}
                    style={{ marginRight: 12 }}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.tint} />
                </TouchableOpacity>
                <Text style={[styles.pageTitle, { color: colors.text }]}>Topups by Day</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colorScheme === 'light' ? '#ececec' : '#232323', marginBottom: 2 }]} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                {/* Topup Form - card style */}
                <View style={[styles.card, { backgroundColor: colorScheme === 'light' ? '#fff' : '#232323', borderRadius: 16, shadowColor: colorScheme === 'light' ? '#000' : '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, padding: 20, marginTop: 10, marginBottom: 24, width: '92%', alignSelf: 'center' }]}>
                    <Text style={[styles.title, { color: colors.text, fontSize: 20, marginBottom: 10, textAlign: 'center', fontWeight: '800' }]}>Make a Topup</Text>
                    <Text style={[styles.label, { color: colors.text }]}>Type</Text>
                    <View style={styles.pickerRow}>
                        {typeOptions.map(opt => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.pickerOption, { borderColor: type === opt.value ? colors.tint : '#e0e0e0', backgroundColor: type === opt.value ? (colorScheme === 'light' ? '#f3e8ff' : '#2a223a') : 'transparent' }]}
                                onPress={() => {
                                    setType(opt.value);
                                    // Clear value when type changes, but pre-fill with "880" for phone number
                                    if (opt.value === 'phoneNumber') {
                                        setKey('880');
                                    } else {
                                        setKey('');
                                    }
                                }}
                            >
                                <Text style={{ color: type === opt.value ? colors.tint : colors.text, fontWeight: '700' }}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>User {type === 'userId' ? 'ID' : type === 'phoneNumber' ? 'Phone' : 'Email'}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colorScheme === 'light' ? '#fafafa' : '#18181b' }]}
                        placeholder={type === 'userId' ? 'Enter User ID' : type === 'phoneNumber' ? 'Enter Phone Number' : 'Enter Email'}
                        placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#888'}
                        value={key}
                        onChangeText={(value) => {
                            if (type === 'phoneNumber') {
                                setKey(serializePhoneNumber(value));
                            } else {
                                setKey(value);
                            }
                        }}
                        autoCapitalize="none"
                        keyboardType={type === 'phoneNumber' ? 'phone-pad' : 'default'}
                    />
                    <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Amount</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colorScheme === 'light' ? '#fafafa' : '#18181b' }]}
                        placeholder="Enter amount"
                        placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#888'}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />
                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={18} color="#d32f2f" style={{ marginRight: 6 }} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                    {success && (
                        <Text style={{ color: '#388e3c', fontWeight: '700', marginTop: 10 }}>Topup successful!</Text>
                    )}
                    <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colorScheme === 'dark' ? '#DC143C' : colors.tint }]}
                            onPress={handleSubmit}
                            onPressIn={handleButtonPressIn}
                            onPressOut={handleButtonPressOut}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Top Up</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
                {/* Topup History List - match adminorders.tsx card style */}
                <View style={styles.topupsListWrapper}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Topup History by Day</Text>
                    {fetching ? (
                        <View style={[styles.center, { backgroundColor: 'transparent' }]}>
                            <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 20 }} />
                            <Text style={{ color: colors.text, marginTop: 12 }}>Loading topups...</Text>
                        </View>
                    ) : fetchError ? (
                        <View style={[styles.center, { backgroundColor: 'transparent' }]}>
                            <Ionicons name="alert-circle" size={48} color="#d32f2f" style={{ marginBottom: 16 }} />
                            <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center' }}>{fetchError}</Text>
                        </View>
                    ) : days.length === 0 ? (
                        <View style={[styles.center, { backgroundColor: 'transparent' }]}>
                            <Ionicons name="wallet-outline" size={64} color={colorScheme === 'light' ? '#e0e0e0' : '#333'} style={{ marginBottom: 16 }} />
                            <Text style={[styles.emptyText, { color: colorScheme === 'light' ? '#888' : '#aaa' }]}>No topups found.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={days}
                            keyExtractor={item => item.date}
                            renderItem={({ item }) => {
                                // Format date as '14 March 2025' and mark Today/Tomorrow
                                const monthNames = [
                                    "January", "February", "March", "April", "May", "June",
                                    "July", "August", "September", "October", "November", "December"
                                ];
                                const dateObj = new Date(item.date + 'T00:00:00');
                                const formattedDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const tomorrow = new Date(today);
                                tomorrow.setDate(today.getDate() + 1);
                                const isSameDay = (d1: Date, d2: Date) =>
                                    d1.getFullYear() === d2.getFullYear() &&
                                    d1.getMonth() === d2.getMonth() &&
                                    d1.getDate() === d2.getDate();
                                const isToday = isSameDay(dateObj, today);
                                const isTomorrow = isSameDay(dateObj, tomorrow);
                                return (
                                    <TouchableOpacity
                                        style={{ marginBottom: 18, marginHorizontal: 12, borderRadius: 14, backgroundColor: colorScheme === 'light' ? '#fff' : '#232323', shadowColor: colorScheme === 'light' ? '#000' : '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, padding: 16, flexDirection: 'row', alignItems: 'center' }}
                                        onPress={() => router.push({ pathname: '/topups/[date]', params: { date: item.date } })}
                                        activeOpacity={0.8}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{formattedDate}</Text>
                                                {isToday && (
                                                    <View style={{ backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Today</Text>
                                                    </View>
                                                )}
                                                {isTomorrow && !isToday && (
                                                    <View style={{ backgroundColor: '#FF9800', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Tomorrow</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                                                <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#e6ffed' : '#1e3a1e', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                                                    <Text style={{ color: '#388e3c', fontSize: 13, fontWeight: '600' }}>Total Amount</Text>
                                                    <Text style={{ color: '#388e3c', fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{item.totalAmount}</Text>
                                                </View>
                                                <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#fffbe6' : '#333', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                                                    <Text style={{ color: '#DC143C', fontSize: 13, fontWeight: '600' }}>Topups</Text>
                                                    <Text style={{ color: '#DC143C', fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{item.count}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={22} color={colors.text} />
                                    </TouchableOpacity>
                                );
                            }}
                            contentContainerStyle={{ paddingBottom: 24 }}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 24,
        alignItems: 'center',
        minHeight: '100%',
    },
    backButtonWrapper: {
        width: '100%',
        alignItems: 'flex-start',
        marginTop: 18,
        marginBottom: 0,
        zIndex: 20,
        position: 'relative',
        paddingLeft: 16,
    },
    backButton: {
        backgroundColor: '#fff2',
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 18,
        marginTop: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    card: {
        borderRadius: 22,
        padding: 26,
        marginTop: 10,
        marginBottom: 24,
        width: '92%',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.13,
        shadowRadius: 18,
        elevation: 8,
        alignSelf: 'center',
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 8,
        marginTop: 2,
        letterSpacing: 0.1,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 17,
        marginBottom: 2,
        marginTop: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
    },
    pickerRow: {
        flexDirection: 'row',
        borderRadius: 12,
        marginTop: 2,
        gap: 10,
        marginBottom: 2,
    },
    pickerOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        marginRight: 0,
        backgroundColor: 'transparent',
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButton: {
        marginTop: 26,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 6,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.2,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffeaea',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginTop: 14,
        marginBottom: 0,
        alignSelf: 'flex-start',
    },
    errorText: {
        color: '#d32f2f',
        fontWeight: '700',
        fontSize: 15,
    },
    divider: {
        width: '80%',
        height: 1.5,
        backgroundColor: '#e0e0e0',
        alignSelf: 'center',
        marginVertical: 18,
        opacity: 0.5,
    },
    topupsListWrapper: {
        marginTop: 0,
        marginBottom: 16,
        width: '92%',
        alignSelf: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 14,
        textAlign: 'center',
        letterSpacing: -0.2,
    },
    topupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    // Added styles for uniformity with adminorders.tsx
    headerWrapper: {
        paddingTop: 18,
        paddingBottom: 8,
        paddingHorizontal: 24,
        backgroundColor: 'transparent',
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        marginTop: 8,
    },
});
