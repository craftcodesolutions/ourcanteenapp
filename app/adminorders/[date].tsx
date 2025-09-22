import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

interface ClassifiedOrderStats {
  totalOrders: number;
  pendingOrders: number;
  successOrders: number;
  cancelledOrders: number;
}

interface ClassifiedOrderGroup {
  stats: ClassifiedOrderStats;
  orders: Order[];
}

const OrdersByDatePage = () => {
  const { token, isAuthLoaded, logout } = useAuth();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [group, setGroup] = useState<ClassifiedOrderGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
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

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

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
        const data = response.data;
        setGroup(data && date && data[date] ? data[date] : null);
        setLoading(false);
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          logout();
          router.push("/(auth)/signin");
        } else {
          setError(error.response?.data || error.message || 'Failed to fetch orders');
        }
        setLoading(false);
      });
  }, [token, isAuthLoaded, date, logout, router]);

  // Handle cancel order
  const handleCancelOrder = async (orderId: string, userId: string) => {
    setCancellingOrderId(orderId);
    try {
      const response = await axios.patch(
        'https://ourcanteennbackend.vercel.app/api/owner/cancel-order',
        { orderId, userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Refresh the orders
      const refreshResponse = await axios.get('https://ourcanteennbackend.vercel.app/api/owner/orderclssified', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = refreshResponse.data;
      setGroup(data && date && data[date] ? data[date] : null);
      
      // Show success message with refund info if applicable
      const refunded = response.data.refunded || 0;
      const message = refunded > 0 
        ? `Order cancelled successfully. ৳${refunded.toFixed(2)} refunded to customer.`
        : 'Order cancelled successfully.';
      
      alert(message);
    } catch (error: any) {
      alert(
        error.response?.data?.error ||
        error.message ||
        'Failed to cancel order'
      );
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}> 
        <ActivityIndicator size="large" color={statusColor} />
        <Text style={{ color: textColor, marginTop: 12 }}>Loading orders...</Text>
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

  if (!group || !group.orders.length) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}> 
        <MaterialIcons name="receipt" size={64} color={emptyIconColor} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: emptyTextColor }]}>No orders for this date.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]}> 
      <View style={styles.headerWrapper}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={statusColor} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: textColor }]}>Orders for {formatDate(date)}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <View style={{ flexDirection: 'row', marginLeft: 0, gap: 12, marginTop: 8, marginBottom: 16, paddingHorizontal: 16 }}>
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
      <FlatList
        data={group.orders}
        keyExtractor={(order) => order._id}
        contentContainerStyle={{ paddingBottom: 48 }}
        renderItem={({ item: order }) => (
          <View style={[styles.orderContainer, { backgroundColor: itemBg, shadowColor: itemShadow }]}> 
            <View style={styles.orderHeader}>
              <Text style={[styles.orderId, { color: priceColor }]}>Order ID: {order._id.slice(-9).toUpperCase()}</Text>
              <Text style={[styles.status, { color: statusColor }]}>{order.status}</Text>
            </View>
            <Text style={[styles.orderDate, { color: subtotalColor }]}>Placed: {new Date(order.createdAt).toLocaleString()}</Text>
            <FlatList
              data={order.items}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <Image source={{ uri: item.image }} style={styles.image} />
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: nameColor }]}>{item.name}</Text>
                    <Text style={[styles.price, { color: priceColor }]}>৳{item.price.toFixed(2)} x {item.quantity}</Text>
                    <Text style={[styles.subtotal, { color: subtotalColor }]}>Subtotal: ৳{(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                </View>
              )}
            />
            <View style={[styles.orderFooter, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}> 
              <View>
                <Text style={[styles.total, { color: nameColor }]}>Total: ৳{order.total.toFixed(2)}</Text>
                <Text style={[styles.collectionDate, { color: nameColor }]}>Collection: {`${new Date(order.collectionTime).getDate()} ${monthNames[new Date(order.collectionTime).getMonth()]} ${new Date(order.collectionTime).getFullYear()}`}</Text>
              </View>
              
              {/* Cancel Button - Only show for non-cancelled and non-completed orders */}
              {order.status !== 'CANCELLED' && order.status !== 'SUCCESS' && (
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: '#ff4444',
                      opacity: cancellingOrderId === order._id ? 0.7 : 1,
                    },
                  ]}
                  onPress={() => {
                    Alert.alert(
                      'Cancel Order',
                      'Are you sure you want to cancel this order? This action cannot be undone.',
                      [
                        { text: 'No', style: 'cancel' },
                        { 
                          text: 'Yes, Cancel', 
                          style: 'destructive',
                          onPress: () => handleCancelOrder(order._id, order.userId)
                        },
                      ]
                    );
                  }}
                  disabled={cancellingOrderId === order._id}
                >
                  {cancellingOrderId === order._id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="cancel" size={18} color="#fff" />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
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
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default OrdersByDatePage; 