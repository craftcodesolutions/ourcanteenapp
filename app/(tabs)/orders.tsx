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

const OrdersPage = () => {
  const { token, isAuthLoaded, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null); // <-- add
  const colorScheme = useColorScheme() ?? 'light';
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const dividerColor = colorScheme === 'light' ? '#ececec' : '#232323';
  const itemBg = colorScheme === 'light' ? '#fff' : '#232323';
  const itemShadow = colorScheme === 'light' ? '#000' : '#000';
  const nameColor = colorScheme === 'light' ? '#222' : '#ececec';
  const priceColor = colorScheme === 'light' ? '#555' : '#bbb';
  const subtotalColor = colorScheme === 'light' ? '#888' : '#aaa';
  const statusColor = colorScheme === 'light' ? '#DC143C' : '#DC143C';
  // Add a green color for the Show QR button
  const qrColor = colorScheme === 'light' ? '#1DB954' : '#4CAF50';
  const emptyIconColor = colorScheme === 'light' ? '#e0e0e0' : '#333';
  const emptyTextColor = colorScheme === 'light' ? '#888' : '#aaa';
  const router = useRouter();

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

    axios.get('https://ourcanteennbackend.vercel.app/api/user/order', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        setOrders(response.data.orders || []);
        setLoading(false);
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          logout();
          router.push("/(auth)/signin");
        } else {
          setError(error.response?.data?.message || error.message || 'Failed to fetch orders');
          setLoading(false);
        }
      });
  }, [token, isAuthLoaded, logout, router]);

  // Add cancel handler
  const handleCancelOrder = async (orderId: string) => {
    console.log(orderId)
    setCancellingOrderId(orderId);
    try {
      const response = await axios.patch(
        'https://ourcanteennbackend.vercel.app/api/user/order',
        { orderId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setOrders(response.data.orders || []);
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

  if (!orders.length) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}>
        <MaterialIcons name="receipt" size={64} color={emptyIconColor} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: emptyTextColor }]}>You have no orders yet.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]}>
      <View style={styles.headerWrapper}>
        <Text style={[styles.pageTitle, { color: textColor }]}>My Orders</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <FlatList
        data={orders}
        keyExtractor={(order) => order._id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
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
            </View>
            {/* Action buttons in a single horizontal row, spaced between */}
            {(order.status === 'PENDING' || order.status === 'SCANNED') && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', opacity: cancellingOrderId === order._id ? 0.5 : 1 }}
                  onPress={() => handleCancelOrder(order._id)}
                  disabled={cancellingOrderId === order._id}
                >
                  {cancellingOrderId === order._id ? (
                    <ActivityIndicator size="small" color={statusColor} style={{ marginRight: 6 }} />
                  ) : (
                    <MaterialIcons name="cancel" size={28} color={statusColor} style={{ marginRight: 6 }} />
                  )}
                  <Text style={{ color: statusColor, fontWeight: 'bold' }}>Cancel Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => {
                    const data = { orderId: order._id, userId: order.userId };
                    const encodedData = encodeURIComponent(JSON.stringify(data));
                    router.push({ pathname: '/qr', params: { data: encodedData } });
                  }}
                >
                  <MaterialIcons name="qr-code" size={28} color={qrColor} style={{ marginRight: 6 }} />
                  <Text style={{ color: qrColor, fontWeight: 'bold' }}>Show QR</Text>
                </TouchableOpacity>
              </View>
            )}


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
