import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManageProps() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    // const primary = Colors[colorScheme].tint;
    const cardBg = Colors[colorScheme].background;
    const textColor = Colors[colorScheme].text;
    const iconColor = Colors[colorScheme].icon;

    // Base configuration for all possible buttons
    const allButtons = [
        {
            id: 'orders',
            title: 'Orders',
            icon: 'list-outline' as const,
            href: '/adminorders' as const,
            color: '#DC143C',
            requiredAccess: 'basic' // Available to all staff
        },
        {
            id: 'scanner',
            title: 'Scanner',
            icon: 'qr-code-outline' as const,
            href: '/scanner' as const,
            color: '#4CAF50',
            requiredAccess: 'basic' // Available to all staff
        },
        {
            id: 'topup',
            title: 'Topup',
            icon: 'wallet-outline' as const,
            href: '/topups' as any,
            color: '#FF9800',
            requiredAccess: 'admin' // Available to admin staff and owners
        },
        {
            id: 'staffs',
            title: 'Staffs',
            icon: 'people-outline' as const,
            href: '/staffs' as any,
            color: '#4CFFF0',
            requiredAccess: 'owner' // Available only to owners
        }
    ];

    // Filter buttons based on user permissions
    const buttonProps = allButtons.filter(button => {
        if (user?.isOwner) {
            return true; // Owners get access to everything
        }
        
        if (user?.staff?.access === 'A') {
            // Admin staff get access to basic and admin buttons
            return button.requiredAccess === 'basic' || button.requiredAccess === 'admin';
        }
        
        // Regular staff get access to basic buttons only
        return button.requiredAccess === 'basic';
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: cardBg }}>
            <ThemedView style={{ flex: 1, backgroundColor: cardBg }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 48 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <ThemedText type="title" style={{ fontSize: 22, fontWeight: '700' }}>Manage</ThemedText>
                    </View>

                    {buttonProps.length > 0 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 32, justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 16 }}>

                            {buttonProps.map((item) => (
                                <Link key={item.id} href={item.href} asChild>
                                    <TouchableOpacity
                                        style={[
                                            styles.gridItem,
                                            {
                                                backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
                                            }
                                        ]}
                                    >
                                        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                            <Ionicons name={item.icon} size={32} color={item.color} />
                                        </View>
                                        <ThemedText type="title" style={[styles.itemTitle, { color: textColor }]}>
                                            {item.title}
                                        </ThemedText>

                                    </TouchableOpacity>
                                </Link>
                            ))}

                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="shield-outline" size={64} color={iconColor} />
                            <ThemedText type="title" style={[styles.emptyTitle, { color: textColor }]}>
                                Access Restricted
                            </ThemedText>
                            <ThemedText style={[styles.emptyMessage, { color: iconColor }]}>
                                You don&apos;t have permission to access admin features.
                            </ThemedText>
                        </View>
                    )}
                </ScrollView>
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    gridItem: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});
