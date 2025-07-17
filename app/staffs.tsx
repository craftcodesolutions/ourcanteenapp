import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

export default function StaffsPage() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { token, user, logout } = useAuth();
    const router = useRouter();

    // Form state
    const [email, setEmail] = useState('');
    const [topupAccess, setTopupAccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [staff, setStaff] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [buttonAnim] = useState(new Animated.Value(1));
    const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

    // Fetch all staff on mount
    useEffect(() => {
        const fetchStaff = async () => {
            setFetching(true);
            setFetchError(null);
            try {
                const response = await axios.get('https://ourcanteennbackend.vercel.app/api/owner/staff', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.data.staff) {
                    setStaff(response.data.staff || []);
                } else {
                    setFetchError('Failed to fetch staff.');
                }
            } catch (error: any) {
                console.log(error);

                if (error.response?.status === 403) {
                    logout();
                    router.push("/(auth)/signin");
                    return;
                }

                setFetchError(error.response?.data?.error || 'Network error.');
            }
            setFetching(false);
        };
        if (token) fetchStaff();
    }, [token, logout, router]);

    const handleSubmit = async () => {
        setError(null);
        setSuccess(false);
        if (!email) {
            setError('Email is required.');
            return;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post('https://ourcanteennbackend.vercel.app/api/owner/staff', {
                email,
                topupAccess,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.data.staff) {
                setStaff(response.data.staff || []);
                setSuccess(true);
                setEmail('');
                setTopupAccess(false);
            } else {
                setError('Failed to add staff member.');
            }
        } catch (error: any) {
            console.log(error);

            if (error.response?.status === 403) {
                logout();
                router.push("/(auth)/signin");
                return;
            }

            setError(error.response?.data?.error || 'Network error.');
        }
        setLoading(false);
    };

    const handleDeleteStaff = async (staffId: string, staffName: string) => {
        Alert.alert(
            'Remove Staff Member',
            `Are you sure you want to remove ${staffName} from your staff?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingStaffId(staffId);
                        try {
                            const response = await axios.delete('https://ourcanteennbackend.vercel.app/api/owner/staff', {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                },
                                data: {
                                    staffId,
                                },
                            });

                            if (response.data.staff) {
                                setStaff(response.data.staff || []);
                            }
                        } catch (error: any) {
                            console.log(error);

                            if (error.response?.status === 403) {
                                logout();
                                router.push("/(auth)/signin");
                                return;
                            }

                            Alert.alert(
                                'Error',
                                error.response?.data?.error || 'Failed to remove staff member.',
                                [{ text: 'OK' }]
                            );
                        }
                        setDeletingStaffId(null);
                    },
                },
            ]
        );
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
            {/* Header */}
            <View style={[styles.headerWrapper, { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingTop: 18, paddingBottom: 8, paddingHorizontal: 24 }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ marginRight: 12 }}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.tint} />
                </TouchableOpacity>
                <Text style={[styles.pageTitle, { color: colors.text }]}>Staff Management</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colorScheme === 'light' ? '#ececec' : '#232323', marginBottom: 2 }]} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                {/* Add Staff Form - card style */}
                <View style={[styles.card, { backgroundColor: colorScheme === 'light' ? '#fff' : '#232323', borderRadius: 16, shadowColor: colorScheme === 'light' ? '#000' : '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, padding: 20, marginTop: 10, marginBottom: 24, width: '92%', alignSelf: 'center' }]}>
                    <Text style={[styles.title, { color: colors.text, fontSize: 20, marginBottom: 10, textAlign: 'center', fontWeight: '800' }]}>Add Staff Member</Text>
                    <Text style={[styles.label, { color: colors.text }]}>Staff Email</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colorScheme === 'light' ? '#fafafa' : '#18181b' }]}
                        placeholder="Enter staff email"
                        placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#888'}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                    />
                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={18} color="#d32f2f" style={{ marginRight: 6 }} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                    {success && (
                        <Text style={{ color: '#388e3c', fontWeight: '700', marginTop: 10 }}>Staff member added successfully!</Text>
                    )}

                    {/* TopUp Access Checkbox */}
                    <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                            style={[styles.checkbox, { borderColor: topupAccess ? colors.tint : colorScheme === 'light' ? '#ccc' : '#555' }]}
                            onPress={() => setTopupAccess(!topupAccess)}
                        >
                            {topupAccess && (
                                <Ionicons name="checkmark" size={16} color={colors.tint} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.checkboxLabel}
                            onPress={() => setTopupAccess(!topupAccess)}
                        >
                            <Text style={[styles.checkboxText, { color: colors.text }]}>TopUp Access</Text>
                        </TouchableOpacity>
                    </View>

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
                                <Text style={styles.submitButtonText}>Add Staff</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
                {/* Staff List */}
                <View style={styles.staffListWrapper}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Staff Members</Text>
                    {fetching ? (
                        <View style={[styles.center, { backgroundColor: 'transparent' }]}>
                            <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 20 }} />
                            <Text style={{ color: colors.text, marginTop: 12 }}>Loading staff...</Text>
                        </View>
                    ) : fetchError ? (
                        <View style={[styles.center, { backgroundColor: 'transparent' }]}>
                            <Ionicons name="alert-circle" size={48} color="#d32f2f" style={{ marginBottom: 16 }} />
                            <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center' }}>{fetchError}</Text>
                        </View>
                    ) : staff.length === 0 ? (
                        <View style={[styles.center, { backgroundColor: 'transparent' }]}>
                            <Ionicons name="people-outline" size={64} color={colorScheme === 'light' ? '#e0e0e0' : '#333'} style={{ marginBottom: 16 }} />
                            <Text style={[styles.emptyText, { color: colorScheme === 'light' ? '#888' : '#aaa' }]}>No staff members found.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={staff}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <View style={{ marginBottom: 18, marginHorizontal: 12, borderRadius: 14, backgroundColor: colorScheme === 'light' ? '#fff' : '#232323', shadowColor: colorScheme === 'light' ? '#000' : '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, padding: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colorScheme === 'light' ? '#f3e8ff' : '#2a223a', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <Text style={{ color: colors.tint, fontSize: 16, fontWeight: 'bold' }}>
                                                {item.name ? item.name.charAt(0).toUpperCase() : 'S'}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                                                {item.name || 'Staff Member'}
                                            </Text>
                                            <Text style={{ color: colorScheme === 'light' ? '#666' : '#aaa', fontSize: 14, marginTop: 2 }}>
                                                {item.email}
                                            </Text>
                                        </View>
                                        <View style={{ backgroundColor: colorScheme === 'light' ? '#e6ffed' : '#1e3a1e', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8 }}>
                                            <Text style={{ color: '#388e3c', fontSize: 12, fontWeight: 'bold' }}>
                                                {item.staff?.access === 'A' ? 'Admin' : 'Staff'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteStaff(item._id, item.name || 'this staff member')}
                                            disabled={deletingStaffId === item._id}
                                            style={[styles.deleteButton, { backgroundColor: deletingStaffId === item._id ? '#ccc' : '#ff4444' }]}
                                        >
                                            {deletingStaffId === item._id ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Ionicons name="trash-outline" size={16} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    {item.phone && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Ionicons name="call-outline" size={14} color={colorScheme === 'light' ? '#666' : '#aaa'} style={{ marginRight: 6 }} />
                                            <Text style={{ color: colorScheme === 'light' ? '#666' : '#aaa', fontSize: 13 }}>
                                                {item.phone}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
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
    staffListWrapper: {
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
    // Added styles for uniformity
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
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    checkboxLabel: {
        flex: 1,
    },
    checkboxText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
