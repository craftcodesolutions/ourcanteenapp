import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  restaurantId: string;
}

interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: string;
  collectionTime: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemSummary {
  itemId: string;
  name: string;
  image: string;
  quantity: number;
}

interface ClassifiedOrderStats {
  totalOrders: number;
  pendingOrders: number;
  successOrders: number;
  cancelledOrders: number;
}

interface ClassifiedOrderGroup {
  stats: ClassifiedOrderStats;
  orders: Order[];
  itemsSummary: ItemSummary[];
}

const OrdersPage = () => {
  const { token, isAuthLoaded, logout } = useAuth();
  const [classifiedOrders, setClassifiedOrders] = useState<Record<string, ClassifiedOrderGroup>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const dividerColor = colorScheme === 'light' ? '#ececec' : '#232323';
  const itemBg = colorScheme === 'light' ? '#fff' : '#232323';
  const itemShadow = colorScheme === 'light' ? '#000' : '#000';
  const nameColor = colorScheme === 'light' ? '#222' : '#ececec';
  const priceColor = colorScheme === 'light' ? '#555' : '#bbb';
  const subtotalColor = colorScheme === 'light' ? '#888' : '#aaa';
  const statusColor = colorScheme === 'light' ? '#DC143C' : '#fff';
  const emptyIconColor = colorScheme === 'light' ? '#e0e0e0' : '#333';
  const emptyTextColor = colorScheme === 'light' ? '#888' : '#aaa';
  const router = useRouter();
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!token) {
      setError('You must be logged in to view your orders.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    
    axios.get('https://ourcanteennbackend.vercel.app/api/owner/orderclssified', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        setClassifiedOrders(response.data || {});
        setLoading(false);
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          logout();
          router.push("/(auth)/signin");
        } else {
          setError(error.response?.data || error.message || 'Failed to fetch orders');
          setLoading(false);
        }
      });
  }, [token, isAuthLoaded, logout, router]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}>
        <ActivityIndicator size="large" color={statusColor} />
        <Text style={{ color: textColor, marginTop: 12 }}>Loading your orders...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}>
        <MaterialIcons name="error-outline" size={48} color={statusColor} style={{ marginBottom: 16 }} />
        <Text style={{ color: textColor, fontSize: 16, textAlign: 'center' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  const dateKeys = Object.keys(classifiedOrders).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (!dateKeys.length) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}>
        <MaterialIcons name="receipt" size={64} color={emptyIconColor} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: emptyTextColor }]}>You have no orders yet.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]}>
      <View style={[styles.headerWrapper, { flexDirection: 'row', alignItems: 'center' }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={statusColor} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: textColor }]}>Orders by Collection Date</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <FlatList
        data={dateKeys}
        keyExtractor={(date) => date}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
        renderItem={({ item: date }) => {
          const group = classifiedOrders[date];
          // Format date as '12 March 2025'
          const dateObj = new Date(date + 'T00:00:00');
          const formattedDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
          // Check if today or tomorrow (compare year, month, day)
          const today = new Date();
          today.setHours(0,0,0,0);
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          const isSameDay = (d1: Date, d2: Date) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
          const isToday = isSameDay(dateObj, today);
          const isTomorrow = isSameDay(dateObj, tomorrow);
          return (
            <View style={{ marginBottom: 18, marginHorizontal: 12, borderRadius: 14, backgroundColor: itemBg, shadowColor: itemShadow, shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, padding: 16 }}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/adminorders/[date]', params: { date } })}
                style={{ marginBottom: 0 }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialIcons name="calendar-today" size={20} color={statusColor} style={{ marginRight: 8 }} />
                  <Text style={{ color: nameColor, fontSize: 18, fontWeight: 'bold' }}>{formattedDate}</Text>
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
                <View style={{ flexDirection: 'row', marginLeft: 0, gap: 12, marginTop: 8 }}>
                  <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#f2f2f2' : '#222', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: priceColor, fontSize: 13, fontWeight: '600' }}>Total</Text>
                    <Text style={{ color: priceColor, fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{group.stats.totalOrders}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#fffbe6' : '#333', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: subtotalColor, fontSize: 13, fontWeight: '600' }}>Pending</Text>
                    <Text style={{ color: subtotalColor, fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{group.stats.pendingOrders}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#e6ffed' : '#1e3a1e', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: statusColor, fontSize: 13, fontWeight: '600' }}>Success</Text>
                    <Text style={{ color: statusColor, fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{group.stats.successOrders}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#ffe6e6' : '#3a1e1e', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#b71c1c', fontSize: 13, fontWeight: '600' }}>Cancelled</Text>
                    <Text style={{ color: '#b71c1c', fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{group.stats.cancelledOrders}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOpenAccordion(openAccordion === date ? null : date)}
                style={{ marginTop: 10, alignSelf: 'flex-end' }}
                activeOpacity={0.7}
              >
                <Text style={{ color: statusColor, fontWeight: 'bold' }}>
                  {openAccordion === date ? 'Hide Items ▲' : 'Show Items ▼'}
                </Text>
              </TouchableOpacity>
              {openAccordion === date && (
                <View style={{ marginTop: 10 }}>
                  {group.itemsSummary && group.itemsSummary.length > 0 ? (
                    group.itemsSummary.map(item => (
                      <View key={item.itemId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: colorScheme === 'light' ? '#f9f9f9' : '#222', borderRadius: 8, padding: 8 }}>
                        <Image
                          source={{ uri: item.image }}
                          style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' }}
                        />
                        <Text style={{ color: nameColor, fontSize: 15, flex: 1 }}>{item.name}</Text>
                        <Text style={{ color: priceColor, fontSize: 15, fontWeight: 'bold' }}>x{item.quantity}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: emptyTextColor, fontSize: 14 }}>No items summary.</Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
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
  divider: {
    height: 1.5,
    width: '100%',
    marginBottom: 2,
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
  orderContainer: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 22,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  orderId: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  status: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  orderDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  collectionDate: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    marginBottom: 1,
  },
  subtotal: {
    fontSize: 13,
  },
  orderFooter: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrdersPage;
