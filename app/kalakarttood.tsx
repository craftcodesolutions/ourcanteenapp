import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
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
}

interface OrderTrack {
  _id: string;
  succeededBy: string;
  amount: number;
  updatedAt: string;
  loanApproved?: boolean;
  loanCompleted?: boolean;
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

const KalakarToodPage = () => {
  const { token, isAuthLoaded, logout } = useAuth();
  const [categorizedByDate, setCategorizedByDate] = useState<CategorizedByDate>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const response = await axios.get('https://ourcanteennbackend.vercel.app/api/owner/accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCategorizedByDate(response.data.categorizedByDate || {});
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
  }, [token, isAuthLoaded]);

  const dateKeys = Object.keys(categorizedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#8e24aa" />
        <Text style={{ color: theme.text, marginTop: 12, fontSize: 16 }}>Loading accounts data...</Text>
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

  if (!dateKeys.length) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <MaterialIcons name="account-balance" size={64} color={theme.tabIconDefault} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: theme.text }]}>No financial data found</Text>
        <Text style={{ color: theme.tabIconDefault, fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
          Top-ups and orders will appear here when processed
        </Text>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Financial Accounts</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={dateKeys}
        keyExtractor={(date) => date}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: date }) => {
          const members = Object.values(categorizedByDate[date]);
          // Sum stats for all members
          const totalTopupCount = members.reduce((sum, m) => sum + (m.topupStat?.count || 0), 0);
          const totalTopupAmount = members.reduce((sum, m) => sum + (m.topupStat?.amount || 0), 0);
          const totalOrderCount = members.reduce((sum, m) => sum + (m.orderStat?.count || 0), 0);
          const totalOrderAmount = members.reduce((sum, m) => sum + (m.orderStat?.amount || 0), 0);
          const totalLoanCount = members.reduce((sum, m) => sum + (m.loanStat?.count || 0), 0);
          const totalLoanAmount = members.reduce((sum, m) => sum + (m.loanStat?.amount || 0), 0);
          
          // Format date as '12 March 2025'
          const dateObj = new Date(date + 'T00:00:00');
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const formattedDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
          
          return (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/kalakarttood/[date]', params: { date } })}
              style={[styles.dateCard, { 
                backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
                borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
              }]}
              activeOpacity={0.7}
            >
              <View style={styles.dateHeader}>
                <MaterialIcons name="calendar-today" size={20} color="#8e24aa" style={{ marginRight: 8 }} />
                <Text style={[styles.dateTitle, { color: theme.text }]}>{formattedDate}</Text>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={[styles.statBox, { backgroundColor: colorScheme === 'light' ? '#e8f5e8' : '#1a2e1a' }]}>
                  <MaterialIcons name="account-balance-wallet" size={16} color="#4CAF50" />
                  <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Top-ups</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {totalTopupCount} • ৳{totalTopupAmount}
                  </Text>
                </View>
                
                <View style={[styles.statBox, { backgroundColor: colorScheme === 'light' ? '#fff3e0' : '#2e1a00' }]}>
                  <MaterialIcons name="shopping-cart" size={16} color="#FF9800" />
                  <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Orders</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {totalOrderCount} • ৳{totalOrderAmount}
                  </Text>
                  <Text style={[styles.statSubtext, { color: theme.tabIconDefault }]}>
                    Cash only
                  </Text>
                </View>
                
                <View style={[styles.statBox, { backgroundColor: colorScheme === 'light' ? '#f3e5f5' : '#2a1a2e' }]}>
                  <MaterialIcons name="payment" size={16} color="#9C27B0" />
                  <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Loans</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {totalLoanCount} • ৳{totalLoanAmount}
                  </Text>
                  <Text style={[styles.statSubtext, { color: theme.tabIconDefault }]}>
                    Settlements
                  </Text>
                </View>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.tabIconDefault }]}>Daily Total:</Text>
                <Text style={[styles.totalAmount, { color: '#8e24aa' }]}>
                  ৳{totalTopupAmount + totalOrderAmount + totalLoanAmount}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="account-balance" size={64} color={theme.tabIconDefault} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No financial data</Text>
            <Text style={[styles.emptySubtext, { color: theme.tabIconDefault }]}>
              Daily financial reports will appear here
            </Text>
          </View>
        }
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
  listContainer: {
    padding: 16,
  },
  dateCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statSubtext: {
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default KalakarToodPage;
