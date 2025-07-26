import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MemberInfo {
  id: string;
  isActive: boolean;
  title: string;
  name: string;
  email: string;
  phoneNumber: string;
}

interface TopupTrack {
  _id: string;
  topupMaker: string;
  amount: number;
  createdAt: string;
  name?: string;
  phoneNumber?: string;
}

interface OrderTrack {
  _id: string;
  succeededBy: string;
  updatedAt: string;
  total?: number;
  items?: { _id: string; name: string; quantity: number; price: number }[];
}

interface MemberDayData {
  info: MemberInfo;
  topupTracks: TopupTrack[];
  ordersTracks: OrderTrack[];
  topupStat: { count: number; amount: number };
  orderStat: { count: number; amount: number };
}

interface CategorizedByDate {
  [date: string]: {
    [memberId: string]: MemberDayData;
  };
}

const KalakarToodDatePage = () => {
  const { token, isAuthLoaded, logout } = useAuth();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [members, setMembers] = useState<MemberDayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: {topups: boolean, orders: boolean}}>({});
  const colorScheme = useColorScheme() ?? 'light';
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const dividerColor = colorScheme === 'light' ? '#ececec' : '#232323';
  const itemBg = colorScheme === 'light' ? '#fff' : '#232323';
  const itemShadow = colorScheme === 'light' ? '#000' : '#000';
  const nameColor = colorScheme === 'light' ? '#222' : '#ececec';
  const statColor = colorScheme === 'light' ? '#555' : '#bbb';
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
      setError('You must be logged in to view this page.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    axios.get('https://ourcanteennbackend.vercel.app/api/owner/accounts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        const data: CategorizedByDate = response.data.categorizedByDate || {};
        if (date && data[date]) {
          setMembers(Object.values(data[date]));
        } else {
          setMembers([]);
        }
        setLoading(false);
      })
              .catch((error) => {
          if (error.response?.status === 403) {
            logout();
            router.push("/(auth)/signin");
          } else {
            const errorMessage = error.response?.data?.message || error.response?.data || error.message || 'Failed to fetch data';
            setError(typeof errorMessage === 'string' ? errorMessage : 'Failed to fetch data');
            setLoading(false);
          }
        });
  }, [token, isAuthLoaded, date, logout, router]);

  const toggleSection = (memberId: string, section: 'topups' | 'orders') => {
    setExpandedSections(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [section]: !prev[memberId]?.[section]
      }
    }));
  };

  const renderTopupItem = (topup: TopupTrack) => (
    <View key={topup._id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, backgroundColor: colorScheme === 'light' ? '#f9f9f9' : '#222', borderRadius: 8, padding: 8, flexWrap: 'wrap' }}>
      <MaterialIcons name="attach-money" size={20} color={statusColor} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: statColor, fontSize: 14 }}>৳{topup.amount}</Text>
        <Text style={{ color: statColor, fontSize: 13 }}>{new Date(topup.createdAt).toLocaleString()}</Text>
        {topup.name && (
          <Text style={{ color: statColor, fontSize: 12 }}>
            To: {topup.name} ({topup.phoneNumber})
          </Text>
        )}
      </View>
    </View>
  );

  const renderOrderItem = (order: OrderTrack) => (
    <View key={order._id} style={{ marginBottom: 4, backgroundColor: colorScheme === 'light' ? '#f9f9f9' : '#222', borderRadius: 8, padding: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialIcons name="shopping-cart" size={20} color={statusColor} style={{ marginRight: 8 }} />
        <Text style={{ color: statColor, fontSize: 14, flex: 1 }}>৳{order.total}</Text>
        <Text style={{ color: statColor, fontSize: 13 }}>{new Date(order.updatedAt).toLocaleString()}</Text>
      </View>
      {order.items && order.items.length > 0 && (
        <View style={{ marginTop: 4, marginLeft: 28 }}>
          {order.items.map(item => (
            <Text key={item._id} style={{ color: statColor, fontSize: 12 }}>
              {item.name} x{item.quantity || 1} - ৳{item.price}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}> 
        <ActivityIndicator size="large" color={statusColor} />
        <Text style={{ color: textColor, marginTop: 12 }}>Loading data...</Text>
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

  if (!members.length) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}> 
        <MaterialIcons name="receipt" size={64} color={emptyIconColor} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: emptyTextColor }]}>No transactions for this date.</Text>
      </SafeAreaView>
    );
  }

  // Format date for header
  const dateObj = new Date((date as string) + 'T00:00:00');
  const formattedDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]}> 
      <View style={[styles.headerWrapper, { flexDirection: 'row', alignItems: 'center' }]}> 
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={statusColor} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: textColor }]}>Transactions for {formattedDate}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <FlatList
        data={members}
        keyExtractor={(member) => member.info.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
        renderItem={({ item: member }) => {
          const memberId = member.info.id;
          const isTopupsExpanded = expandedSections[memberId]?.topups || false;
          const isOrdersExpanded = expandedSections[memberId]?.orders || false;
          const hasMoreTopups = member.topupTracks.length > 3;
          const hasMoreOrders = member.ordersTracks.length > 3;

          return (
            <View style={{ marginBottom: 18, marginHorizontal: 12, borderRadius: 14, backgroundColor: itemBg, shadowColor: itemShadow, shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name={member.info.title === 'Owner' ? 'person' : 'person-outline'} size={20} color={statusColor} style={{ marginRight: 8 }} />
                <Text style={{ color: nameColor, fontSize: 17, fontWeight: 'bold', flexDirection: 'row', alignItems: 'center' }}>
                  {member.info.name} <Text style={{ color: statColor, fontSize: 13 }}>({member.info.title})</Text>
                  <MaterialIcons name="circle" size={13} color={member.info.isActive ? 'green' : 'crimson'} style={{ marginLeft: 6, marginBottom: -1 }} />
                </Text>
              </View>
              <Text style={{ color: statColor, fontSize: 13, marginBottom: 4 }}>Email: {member.info.email}</Text>
              <Text style={{ color: statColor, fontSize: 13, marginBottom: 8 }}>Phone: {member.info.phoneNumber}</Text>
              <View style={{ flexDirection: 'row', marginLeft: 0, gap: 12, marginTop: 4, marginBottom: 10 }}>
                <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#e6f7ff' : '#1e2a3a', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: statColor, fontSize: 13, fontWeight: '600' }}>Top-ups</Text>
                  <Text style={{ color: statColor, fontSize: 15, fontWeight: 'bold', marginTop: 2 }}>{member.topupStat.count} / ৳{member.topupStat.amount}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#fffbe6' : '#333', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: statColor, fontSize: 13, fontWeight: '600' }}>Orders</Text>
                  <Text style={{ color: statColor, fontSize: 15, fontWeight: 'bold', marginTop: 2 }}>{member.orderStat.count} / ৳{member.orderStat.amount}</Text>
                </View>
              </View>
              {/* Top-up Transactions */}
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: nameColor, fontWeight: 'bold', marginBottom: 4 }}>Top-up Transactions</Text>
                {member.topupTracks.length ? (
                  <>
                    {(isTopupsExpanded ? member.topupTracks : member.topupTracks.slice(0, 3)).map(renderTopupItem)}
                    {hasMoreTopups && (
                      <TouchableOpacity
                        onPress={() => toggleSection(memberId, 'topups')}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
                      >
                        <Text style={{ color: statColor, fontSize: 12, marginRight: 4 }}>
                          {isTopupsExpanded ? 'Show less' : `Show ${member.topupTracks.length - 3} more`}
                        </Text>
                        <MaterialIcons
                          name={isTopupsExpanded ? 'expand-less' : 'expand-more'}
                          size={20}
                          color={statColor}
                        />
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={{ color: emptyTextColor, fontSize: 14 }}>No top-ups.</Text>
                )}
              </View>
              {/* Order Transactions */}
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: nameColor, fontWeight: 'bold', marginBottom: 4 }}>Order Transactions</Text>
                {member.ordersTracks.length ? (
                  <>
                    {(isOrdersExpanded ? member.ordersTracks : member.ordersTracks.slice(0, 3)).map(renderOrderItem)}
                    {hasMoreOrders && (
                      <TouchableOpacity
                        onPress={() => toggleSection(memberId, 'orders')}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
                      >
                        <Text style={{ color: statColor, fontSize: 12, marginRight: 4 }}>
                          {isOrdersExpanded ? 'Show less' : `Show ${member.ordersTracks.length - 3} more`}
                        </Text>
                        <MaterialIcons
                          name={isOrdersExpanded ? 'expand-less' : 'expand-more'}
                          size={20}
                          color={statColor}
                        />
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={{ color: emptyTextColor, fontSize: 14 }}>No orders.</Text>
                )}
              </View>
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
});

export default KalakarToodDatePage; 