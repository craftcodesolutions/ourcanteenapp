import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  loanApproved?: boolean;
}

const OrdersPage = () => {
  const { token, isAuthLoaded, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null); // <-- add
  const [penaltyModalVisible, setPenaltyModalVisible] = useState(false);
  const [penaltyInfo, setPenaltyInfo] = useState<any>(null);
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

      // Check if penalty is required
      if (response.data.requiresPenalty) {
        setPenaltyInfo(response.data);
        setPenaltyModalVisible(true);
        setCancellingOrderId(null);
        return;
      }

      // Order cancelled successfully
      setOrders(response.data.orders || []);
      if (response.data.penaltyMessage) {
        alert(response.data.penaltyMessage);
      } else {
        alert('Order cancelled successfully');
      }
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

  // Handle penalty confirmation
  const handleConfirmPenalty = async () => {
    if (!penaltyInfo?.order?._id) return;
    
    setCancellingOrderId(penaltyInfo.order._id);
    setPenaltyModalVisible(false);
    
    try {
      const response = await axios.patch(
        'https://ourcanteennbackend.vercel.app/api/user/order',
        { orderId: penaltyInfo.order._id, confirmPenalty: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      setOrders(response.data.orders || []);
      if (response.data.penaltyMessage) {
        alert(response.data.penaltyMessage);
      } else {
        alert('Order cancelled successfully');
      }
    } catch (error: any) {
      alert(
        error.response?.data?.error ||
        error.message ||
        'Failed to cancel order'
      );
    } finally {
      setCancellingOrderId(null);
      setPenaltyInfo(null);
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
                {order.loanApproved && (
                  <Text style={[styles.loanIndicator, { color: '#ff6b35' }]}>💳 Paid via Loan</Text>
                )}
                <Text style={[styles.collectionDate, { color: nameColor }]}>
                  Collection: {new Date(order.collectionTime).toLocaleString([], { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
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
      
      {/* Penalty Warning Modal */}
      <Modal
        visible={penaltyModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPenaltyModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ 
            backgroundColor: cardBg, 
            borderRadius: 16, 
            padding: 0, 
            width: '100%', 
            maxWidth: 380,
            shadowColor: itemShadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8
          }}>
            {/* Header */}
            <View style={{ 
              alignItems: 'center', 
              paddingVertical: 24, 
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: dividerColor
            }}>
              <MaterialIcons name="warning" size={56} color="#ff6b35" style={{ marginBottom: 12 }} />
              <Text style={{ 
                color: textColor, 
                fontSize: 22, 
                fontWeight: 'bold', 
                textAlign: 'center',
                marginBottom: 8
              }}>
                Cancellation Penalty
              </Text>
              <Text style={{ 
                color: subtotalColor, 
                fontSize: 15, 
                textAlign: 'center', 
                lineHeight: 22,
                paddingHorizontal: 10
              }}>
                This order is close to collection time
              </Text>
            </View>
            
            {/* Content */}
            {penaltyInfo && (
              <View style={{ padding: 20 }}>
                {/* Order Details Card */}
                <View style={{ 
                  backgroundColor: colorScheme === 'light' ? '#fafafa' : '#1a1a1a', 
                  borderRadius: 12, 
                  padding: 16, 
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: dividerColor
                }}>
                  <Text style={{ 
                    color: textColor, 
                    fontSize: 16, 
                    fontWeight: 'bold', 
                    marginBottom: 12,
                    textAlign: 'center'
                  }}>
                    Order Details
                  </Text>
                  
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ color: subtotalColor, fontSize: 14, flex: 1 }}>Order Total</Text>
                      <Text style={{ color: textColor, fontSize: 16, fontWeight: 'bold' }}>৳{penaltyInfo.order?.total}</Text>
                    </View>
                  </View>
                  
                  {penaltyInfo.order?.collectionTime && (
                    <View style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ color: subtotalColor, fontSize: 14, flex: 1 }}>Collection Time</Text>
                        <Text style={{ color: textColor, fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1 }}>
                          {new Date(penaltyInfo.order.collectionTime).toLocaleString([], { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ color: subtotalColor, fontSize: 14, flex: 1 }}>Time Remaining</Text>
                      <Text style={{ color: '#ff6b35', fontSize: 14, fontWeight: 'bold' }}>
                        {penaltyInfo.hoursUntilCollection ? `${penaltyInfo.hoursUntilCollection}h` : 
                         penaltyInfo.hoursElapsed ? `${penaltyInfo.hoursElapsed}h` : 'Soon'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Penalty Info Card */}
                <View style={{ 
                  backgroundColor: colorScheme === 'light' ? '#fff5f2' : '#2d1410', 
                  borderRadius: 12, 
                  padding: 16, 
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colorScheme === 'light' ? '#ffe0db' : '#4a2c1f'
                }}>
                  <Text style={{ 
                    color: colorScheme === 'light' ? '#d84315' : '#ff8a65', 
                    fontSize: 16, 
                    fontWeight: 'bold', 
                    marginBottom: 12,
                    textAlign: 'center'
                  }}>
                    Penalty Charges
                  </Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: subtotalColor, fontSize: 14 }}>Penalty Rate</Text>
                    <Text style={{ color: '#ff6b35', fontSize: 14, fontWeight: 'bold' }}>{penaltyInfo.penaltyRate}%</Text>
                  </View>
                  
                  <View style={{ height: 1, backgroundColor: colorScheme === 'light' ? '#ffe0db' : '#4a2c1f', marginVertical: 12 }} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colorScheme === 'light' ? '#d84315' : '#ff8a65', fontSize: 18, fontWeight: 'bold' }}>Total Penalty</Text>
                    <Text style={{ color: colorScheme === 'light' ? '#d84315' : '#ff8a65', fontSize: 20, fontWeight: 'bold' }}>৳{penaltyInfo.penaltyAmount}</Text>
                  </View>
                </View>

                <Text style={{ 
                  color: subtotalColor, 
                  fontSize: 13, 
                  textAlign: 'center', 
                  marginBottom: 24,
                  lineHeight: 18,
                  fontStyle: 'italic'
                }}>
                  This amount will be deducted from your account balance
                </Text>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={{ 
              flexDirection: 'row', 
              gap: 12, 
              paddingHorizontal: 20, 
              paddingVertical: 20,
              paddingTop: 0,
              borderTopWidth: 1,
              borderTopColor: dividerColor
            }}>
              <TouchableOpacity
                style={{ 
                  flex: 1, 
                  backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a', 
                  borderRadius: 12, 
                  paddingVertical: 16, 
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: dividerColor
                }}
                onPress={() => {
                  setPenaltyModalVisible(false);
                  setPenaltyInfo(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={{ 
                  color: colorScheme === 'light' ? '#495057' : '#e0e0e0', 
                  fontWeight: '700', 
                  fontSize: 16 
                }}>
                  Keep Order
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{ 
                  flex: 1, 
                  backgroundColor: '#dc3545', 
                  borderRadius: 12, 
                  paddingVertical: 16, 
                  alignItems: 'center',
                  shadowColor: '#dc3545',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3
                }}
                onPress={handleConfirmPenalty}
                activeOpacity={0.8}
              >
                <Text style={{ 
                  color: '#fff', 
                  fontWeight: '700', 
                  fontSize: 16 
                }}>
                  Cancel & Pay
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loanIndicator: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default OrdersPage;
