import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  loanApproved?: boolean;
  loanCompleted?: boolean;
  items?: { _id: string; name: string; quantity: number; price: number }[];
}

interface LoanTrack {
  _id: string;
  orderId: string;
  loanAmount: number;
  paidAt: string;
  customerInfo: {
    name: string;
    phoneNumber: string;
  };
  settledBy?: string;
  notes?: string;
}

interface MemberDayData {
  info: MemberInfo;
  topupTracks: TopupTrack[];
  ordersTracks: OrderTrack[];
  loanTracks: LoanTrack[];
  topupStat: { count: number; amount: number };
  orderStat: { 
    count: number; 
    amount: number;
    loanPaidOrdersCount: number;
    cashPaidOrdersCount: number;
  };
  loanStat: { count: number; amount: number };
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: {topups: boolean, orders: boolean, loans: boolean}}>({});
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const response = await axios.get('https://ourcanteennbackend.vercel.app/api/owner/accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: CategorizedByDate = response.data.categorizedByDate || {};
      if (date && data[date]) {
        setMembers(Object.values(data[date]));
      } else {
        setMembers([]);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        logout();
        router.push("/(auth)/signin");
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch data';
        setError(typeof errorMessage === 'string' ? errorMessage : 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!token) {
      setError('You must be logged in to view this page.');
      setLoading(false);
      return;
    }
    fetchData();
  }, [token, isAuthLoaded, date]);

  const toggleSection = (memberId: string, section: 'topups' | 'orders' | 'loans') => {
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
      <MaterialIcons name="attach-money" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 14 }}>৳{topup.amount}</Text>
        <Text style={{ color: theme.tabIconDefault, fontSize: 13 }}>{new Date(topup.createdAt).toLocaleString()}</Text>
        {topup.name && (
          <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>
            To: {topup.name} ({topup.phoneNumber})
          </Text>
        )}
      </View>
    </View>
  );

  const renderOrderItem = (order: OrderTrack) => {
    const isLoanPaid = order.loanApproved || order.loanCompleted;
    return (
      <View key={order._id} style={{ marginBottom: 4, backgroundColor: colorScheme === 'light' ? '#f9f9f9' : '#222', borderRadius: 8, padding: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="shopping-cart" size={20} color="#FF9800" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: theme.text, fontSize: 14 }}>৳{order.total}</Text>
              {isLoanPaid && (
                <View style={{ marginLeft: 8, backgroundColor: '#9C27B0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>LOAN</Text>
                </View>
              )}
              {!isLoanPaid && (
                <View style={{ marginLeft: 8, backgroundColor: '#4CAF50', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>CASH</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={{ color: theme.tabIconDefault, fontSize: 13 }}>{new Date(order.updatedAt).toLocaleString()}</Text>
        </View>
        {order.items && order.items.length > 0 && (
          <View style={{ marginTop: 4, marginLeft: 28 }}>
            {order.items.map(item => (
              <Text key={item._id} style={{ color: theme.tabIconDefault, fontSize: 12 }}>
                {item.name} x{item.quantity || 1} - ৳{item.price}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderLoanItem = (loan: LoanTrack) => (
    <View key={loan._id} style={{ marginBottom: 4, backgroundColor: colorScheme === 'light' ? '#f9f9f9' : '#222', borderRadius: 8, padding: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialIcons name="payment" size={20} color="#9C27B0" style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 14 }}>৳{loan.loanAmount}</Text>
          <Text style={{ color: theme.tabIconDefault, fontSize: 13 }}>{new Date(loan.paidAt).toLocaleString()}</Text>
          <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>
            Order: #{loan.orderId.slice(-8).toUpperCase()}
          </Text>
          {loan.customerInfo && (
            <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>
              Customer: {loan.customerInfo.name} ({loan.customerInfo.phoneNumber})
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}> 
        <ActivityIndicator size="large" color="#8e24aa" />
        <Text style={{ color: theme.text, marginTop: 12, fontSize: 16 }}>Loading transaction data...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}> 
        <MaterialIcons name="error-outline" size={48} color="#ff6b35" style={{ marginBottom: 16 }} />
        <Text style={{ color: theme.text, fontSize: 16, textAlign: 'center', paddingHorizontal: 32 }}>{error}</Text>
        <TouchableOpacity 
          style={{ marginTop: 16, padding: 12, backgroundColor: '#8e24aa', borderRadius: 8 }}
          onPress={() => fetchData()}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!members.length) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}> 
        <MaterialIcons name="receipt" size={64} color={theme.tabIconDefault} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: theme.text }]}>No transactions for this date</Text>
        <Text style={{ color: theme.tabIconDefault, fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
          No financial activity recorded for the selected date
        </Text>
      </SafeAreaView>
    );
  }

  // Format date for header
  const dateObj = new Date((date as string) + 'T00:00:00');
  const formattedDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
        borderBottomColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transactions for {formattedDate}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={members}
        keyExtractor={(member) => member.info.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: member }) => {
          const memberId = member.info.id;
          const isTopupsExpanded = expandedSections[memberId]?.topups || false;
          const isOrdersExpanded = expandedSections[memberId]?.orders || false;
          const isLoansExpanded = expandedSections[memberId]?.loans || false;
          const hasMoreTopups = member.topupTracks.length > 3;
          const hasMoreOrders = member.ordersTracks.length > 3;
          const hasMoreLoans = (member.loanTracks?.length || 0) > 3;

          return (
            <View style={{ 
              marginBottom: 18, 
              marginHorizontal: 12, 
              borderRadius: 14, 
              backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a', 
              borderWidth: 1,
              borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
              padding: 16 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name={member.info.title === 'Owner' ? 'person' : 'person-outline'} size={20} color="#8e24aa" style={{ marginRight: 8 }} />
                <Text style={{ color: theme.text, fontSize: 17, fontWeight: 'bold', flexDirection: 'row', alignItems: 'center' }}>
                  {member.info.name} <Text style={{ color: theme.tabIconDefault, fontSize: 13 }}>({member.info.title})</Text>
                  <MaterialIcons name="circle" size={13} color={member.info.isActive ? 'green' : 'crimson'} style={{ marginLeft: 6, marginBottom: -1 }} />
                </Text>
              </View>
              <Text style={{ color: theme.tabIconDefault, fontSize: 13, marginBottom: 4 }}>Email: {member.info.email}</Text>
              <Text style={{ color: theme.tabIconDefault, fontSize: 13, marginBottom: 8 }}>Phone: {member.info.phoneNumber}</Text>
              <View style={{ flexDirection: 'row', marginLeft: 0, gap: 8, marginTop: 4, marginBottom: 10 }}>
                <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#e8f5e8' : '#1a2e1a', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: theme.tabIconDefault, fontSize: 12, fontWeight: '600' }}>Top-ups</Text>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold', marginTop: 2 }}>{member.topupStat.count} / ৳{member.topupStat.amount}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#fff3e0' : '#2e1a00', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: theme.tabIconDefault, fontSize: 12, fontWeight: '600' }}>Orders</Text>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold', marginTop: 2 }}>{member.orderStat.count} / ৳{member.orderStat.amount}</Text>
                  <Text style={{ color: theme.tabIconDefault, fontSize: 10, fontStyle: 'italic', marginTop: 1 }}>Cash only</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#f3e5f5' : '#2a1a2e', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: theme.tabIconDefault, fontSize: 12, fontWeight: '600' }}>Loans</Text>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold', marginTop: 2 }}>{member.loanStat?.count || 0} / ৳{member.loanStat?.amount || 0}</Text>
                  <Text style={{ color: theme.tabIconDefault, fontSize: 10, fontStyle: 'italic', marginTop: 1 }}>Settlements</Text>
                </View>
              </View>
              {/* Top-up Transactions */}
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 4 }}>Top-up Transactions</Text>
                {member.topupTracks.length ? (
                  <>
                    {(isTopupsExpanded ? member.topupTracks : member.topupTracks.slice(0, 3)).map(renderTopupItem)}
                    {hasMoreTopups && (
                      <TouchableOpacity
                        onPress={() => toggleSection(memberId, 'topups')}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
                      >
                        <Text style={{ color: theme.tabIconDefault, fontSize: 12, marginRight: 4 }}>
                          {isTopupsExpanded ? 'Show less' : `Show ${member.topupTracks.length - 3} more`}
                        </Text>
                        <MaterialIcons
                          name={isTopupsExpanded ? 'expand-less' : 'expand-more'}
                          size={20}
                          color={theme.tabIconDefault}
                        />
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={{ color: theme.tabIconDefault, fontSize: 14 }}>No top-ups.</Text>
                )}
              </View>
              {/* Order Transactions */}
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 4 }}>Order Transactions</Text>
                {member.ordersTracks.length ? (
                  <>
                    {(isOrdersExpanded ? member.ordersTracks : member.ordersTracks.slice(0, 3)).map(renderOrderItem)}
                    {hasMoreOrders && (
                      <TouchableOpacity
                        onPress={() => toggleSection(memberId, 'orders')}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
                      >
                        <Text style={{ color: theme.tabIconDefault, fontSize: 12, marginRight: 4 }}>
                          {isOrdersExpanded ? 'Show less' : `Show ${member.ordersTracks.length - 3} more`}
                        </Text>
                        <MaterialIcons
                          name={isOrdersExpanded ? 'expand-less' : 'expand-more'}
                          size={20}
                          color={theme.tabIconDefault}
                        />
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={{ color: theme.tabIconDefault, fontSize: 14 }}>No orders.</Text>
                )}
              </View>
              
              {/* Loan Settlements */}
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 4 }}>Loan Settlements</Text>
                {member.loanTracks && member.loanTracks.length ? (
                  <>
                    {(isLoansExpanded ? member.loanTracks : member.loanTracks.slice(0, 3)).map(renderLoanItem)}
                    {hasMoreLoans && (
                      <TouchableOpacity
                        onPress={() => toggleSection(memberId, 'loans')}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
                      >
                        <Text style={{ color: theme.tabIconDefault, fontSize: 12, marginRight: 4 }}>
                          {isLoansExpanded ? 'Show less' : `Show ${member.loanTracks.length - 3} more`}
                        </Text>
                        <MaterialIcons
                          name={isLoansExpanded ? 'expand-less' : 'expand-more'}
                          size={20}
                          color={theme.tabIconDefault}
                        />
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={{ color: theme.tabIconDefault, fontSize: 14 }}>No loan settlements.</Text>
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
});

export default KalakarToodDatePage; 