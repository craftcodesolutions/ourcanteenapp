import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  FlatList,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import axios from 'axios';

interface Loan {
  _id: string;
  loanApprover: string;
  restaurantId: string;
  userId: string;
  orderId: string;
  customerInfo: {
    name: string;
    phoneNumber: string;
    email: string;
    studentId?: string;
  };
  loanAmount: number;
  orderTotal: number;
  status: 'ACTIVE' | 'PAID' | 'CANCELLED';
  approvedAt: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  paymentMethod: string;
  paidAt?: string;
  cancelledAt?: string;
  notes?: string;
}

interface LoanStats {
  active: { count: number; totalAmount: number };
  paid: { count: number; totalAmount: number };
  cancelled: { count: number; totalAmount: number };
  total: { count: number; totalAmount: number };
}

interface GroupedLoans {
  userId: string;
  customerInfo: {
    name: string;
    phoneNumber: string;
    email: string;
    studentId?: string;
  };
  loans: Loan[];
  totalActive: number;
  totalActiveAmount: number;
  totalPaid: number;
  totalPaidAmount: number;
  totalCancelled: number;
  totalCancelledAmount: number;
}

export default function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [groupedLoans, setGroupedLoans] = useState<GroupedLoans[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);
  const [communicationModalVisible, setCommunicationModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [communicationType, setCommunicationType] = useState('');
  const [communicationNotes, setCommunicationNotes] = useState('');
  const [page, setPage] = useState(1);
  const [groupedPage, setGroupedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [groupedHasMore, setGroupedHasMore] = useState(true);
  
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const fetchLoans = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setHasMore(true);
        setLoading(true);
        setLoans([]); // Clear old data immediately
      }
      
      const statusParam = selectedStatus === 'ALL' ? '' : selectedStatus;
      const currentPage = reset ? 1 : page;
      
      const response = await axios.get(
        `https://ourcanteennbackend.vercel.app/api/owner/loans?status=${statusParam}&page=${currentPage}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        if (reset) {
          setLoans(response.data.loans);
        } else {
          setLoans(prev => [...prev, ...response.data.loans]);
        }
        
        setStats(response.data.statistics);
        setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
        if (!reset) {
          setPage(prev => prev + 1);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        logout();
        router.push("/(auth)/signin");
      } else {
        console.error('Error fetching loans:', err);
        Alert.alert('Error', 'Failed to fetch loans');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchGroupedLoans = async (reset = false) => {
    try {
      if (reset) {
        setGroupedPage(1);
        setGroupedHasMore(true);
        setLoading(true);
        setGroupedLoans([]); // Clear old data immediately
      }
      
      const statusParam = selectedStatus === 'ALL' ? '' : selectedStatus;
      const currentPage = reset ? 1 : groupedPage;
      
      const response = await axios.get(
        `https://ourcanteennbackend.vercel.app/api/owner/loans-grouped?status=${statusParam}&page=${currentPage}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        if (reset) {
          setGroupedLoans(response.data.groupedLoans);
        } else {
          setGroupedLoans(prev => [...prev, ...response.data.groupedLoans]);
        }
        
        setStats(response.data.statistics);
        setGroupedHasMore(response.data.pagination.hasMore);
        if (!reset) {
          setGroupedPage(prev => prev + 1);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        logout();
        router.push("/(auth)/signin");
      } else {
        console.error('Error fetching grouped loans:', err);
        Alert.alert('Error', 'Failed to fetch grouped loans');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (viewMode === 'grouped') {
      fetchGroupedLoans(true);
    } else {
      fetchLoans(true);
    }
  };

  const loadMore = () => {
    if (loading) return;
    
    if (viewMode === 'grouped' && groupedHasMore) {
      setLoading(true);
      fetchGroupedLoans(false);
    } else if (viewMode === 'list' && hasMore) {
      setLoading(true);
      fetchLoans(false);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const expandAllUsers = () => {
    setExpandedUsers(new Set(groupedLoans.map(group => group.userId)));
  };

  const collapseAllUsers = () => {
    setExpandedUsers(new Set());
  };

  useEffect(() => {
    // Clear all data immediately when changing filters or view mode
    setLoans([]);
    setGroupedLoans([]);
    setStats(null);
    setLoading(true);
    
    if (viewMode === 'grouped') {
      fetchGroupedLoans(true);
    } else {
      fetchLoans(true);
    }
  }, [selectedStatus, viewMode]);

  const handleUpdateLoan = async (status: 'PAID' | 'CANCELLED') => {
    if (!selectedLoan) return;
    
    // Check if trying to cancel loan within 1 hour of issue
    if (status === 'CANCELLED') {
      const loanCreatedTime = new Date(selectedLoan.createdAt).getTime();
      const currentTime = new Date().getTime();
      const timeDifferenceHours = (currentTime - loanCreatedTime) / (1000 * 60 * 60);
      
      if (timeDifferenceHours < 1) {
        Alert.alert(
          'Cannot Cancel Loan',
          `Loans cannot be cancelled within 1 hour of being issued. This loan was created ${Math.round(timeDifferenceHours * 60)} minutes ago.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    setUpdating(true);
    try {
      const finalNotes = status === 'PAID' && paymentMethod 
        ? `Payment Method: ${paymentMethod}${notes.trim() ? ` - ${notes.trim()}` : ''}`
        : notes.trim();

      const response = await axios.put(
        'https://ourcanteennbackend.vercel.app/api/owner/loans',
        {
          loanId: selectedLoan._id,
          status: status,
          notes: finalNotes || undefined
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', `Loan marked as ${status.toLowerCase()}`);
        setUpdateModalVisible(false);
        setPaymentMethodModalVisible(false);
        setSelectedLoan(null);
        setNotes('');
        setPaymentMethod('');
        // Refresh data based on current view mode
        if (viewMode === 'grouped') {
          fetchGroupedLoans(true);
        } else {
          fetchLoans(true);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        logout();
        router.push("/(auth)/signin");
      } else {
        Alert.alert('Error', err?.response?.data?.error || 'Failed to update loan');
      }
    }
    setUpdating(false);
  };

  const handleCommunicationLog = async () => {
    if (!selectedLoan || !communicationType || !communicationNotes.trim()) {
      Alert.alert('Error', 'Please fill in all communication details');
      return;
    }

    try {
      const logNote = `[${new Date().toLocaleString()}] ${communicationType}: ${communicationNotes.trim()} - by ${user?.name || 'Staff'}`;
      
      // Add communication log to loan notes
      const currentNotes = selectedLoan.notes || '';
      const updatedNotes = currentNotes 
        ? `${currentNotes}\n\n${logNote}`
        : logNote;

      const response = await axios.put(
        'https://ourcanteennbackend.vercel.app/api/owner/loans',
        {
          loanId: selectedLoan._id,
          status: selectedLoan.status, // Keep same status
          notes: updatedNotes
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Communication logged successfully');
        setCommunicationModalVisible(false);
        setCommunicationType('');
        setCommunicationNotes('');
        setSelectedLoan({ ...selectedLoan, notes: updatedNotes });
        // Refresh data based on current view mode
        if (viewMode === 'grouped') {
          fetchGroupedLoans(true);
        } else {
          fetchLoans(true);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to log communication');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#ff6b35';
      case 'PAID': return '#4CAF50';
      case 'CANCELLED': return '#f44336';
      default: return theme.text;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'pending';
      case 'PAID': return 'check-circle';
      case 'CANCELLED': return 'cancel';
      default: return 'help';
    }
  };

  const renderLoanItem = ({ item }: { item: Loan }) => (
    <TouchableOpacity
      style={[styles.loanCard, { 
        backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
        borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
        marginLeft: 20, // Indent for grouped view
      }]}
      onPress={() => {
        setSelectedLoan(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.loanHeader}>
        <View style={styles.loanInfo}>
          <Text style={[styles.orderId, { color: theme.tabIconDefault }]}>
            Order #{item.orderId.slice(-8).toUpperCase()}
          </Text>
          <Text style={[styles.loanDate, { color: theme.tabIconDefault }]}>
            {new Date(item.approvedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <MaterialIcons 
            name={getStatusIcon(item.status) as any} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.loanFooter}>
        <Text style={[styles.loanAmount, { color: '#ff6b35' }]}>
          ৳{item.loanAmount.toFixed(2)}
        </Text>
        <MaterialIcons name="chevron-right" size={20} color={theme.tabIconDefault} />
      </View>
    </TouchableOpacity>
  );

  const renderUserGroup = ({ item }: { item: GroupedLoans }) => {
    const isExpanded = expandedUsers.has(item.userId);
    
    return (
      <View style={styles.userGroupContainer}>
        <TouchableOpacity
          style={[styles.userGroupHeader, { 
            backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
            borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
          }]}
          onPress={() => toggleUserExpansion(item.userId)}
        >
          <View style={styles.userGroupInfo}>
            <View style={styles.userBasicInfo}>
              <Text style={[styles.customerName, { color: theme.text }]}>
                {item.customerInfo.name || 'Unknown Customer'}
              </Text>
              <Text style={[styles.customerContact, { color: theme.tabIconDefault }]}>
                {item.customerInfo.phoneNumber || 'No phone'}
              </Text>
              {item.customerInfo.studentId && (
                <Text style={[styles.studentId, { color: theme.tabIconDefault }]}>
                  ID: {item.customerInfo.studentId}
                </Text>
              )}
            </View>
            
            <View style={styles.userStats}>
              {item.totalActive > 0 && (
                <View style={[styles.statBadge, { backgroundColor: '#ff6b35' }]}>
                  <Text style={styles.statBadgeText}>
                    {item.totalActive} Active (৳{item.totalActiveAmount.toFixed(0)})
                  </Text>
                </View>
              )}
              {item.totalPaid > 0 && (
                <View style={[styles.statBadge, { backgroundColor: '#4CAF50' }]}>
                  <Text style={styles.statBadgeText}>
                    {item.totalPaid} Paid (৳{item.totalPaidAmount.toFixed(0)})
                  </Text>
                </View>
              )}
              {item.totalCancelled > 0 && (
                <View style={[styles.statBadge, { backgroundColor: '#f44336' }]}>
                  <Text style={styles.statBadgeText}>
                    {item.totalCancelled} Cancelled
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <MaterialIcons 
            name={isExpanded ? 'expand-less' : 'expand-more'} 
            size={24} 
            color={theme.tabIconDefault} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.userLoansContainer}>
            {item.loans
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((loan) => (
                <View key={`${item.userId}-${loan._id}`}>
                  {renderLoanItem({ item: loan })}
                </View>
              ))}
          </View>
        )}
      </View>
    );
  };

  const renderOriginalLoanItem = ({ item }: { item: Loan }) => (
    <TouchableOpacity
      style={[styles.loanCard, { 
        backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
        borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
      }]}
      onPress={() => {
        setSelectedLoan(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.loanHeader}>
        <View style={styles.loanInfo}>
          <Text style={[styles.customerName, { color: theme.text }]}>
            {item.customerInfo.name || 'Unknown Customer'}
          </Text>
          <Text style={[styles.orderId, { color: theme.tabIconDefault }]}>
            Order #{item.orderId.slice(-8).toUpperCase()}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <MaterialIcons 
            name={getStatusIcon(item.status) as any} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.loanDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={14} color={theme.tabIconDefault} />
          <Text style={[styles.detailText, { color: theme.tabIconDefault }]}>
            {item.customerInfo.phoneNumber || 'N/A'}
          </Text>
        </View>
        {item.customerInfo.studentId && (
          <View style={styles.detailRow}>
            <MaterialIcons name="badge" size={14} color={theme.tabIconDefault} />
            <Text style={[styles.detailText, { color: theme.tabIconDefault }]}>
              {item.customerInfo.studentId}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.loanFooter}>
        <View style={styles.amountInfo}>
          <Text style={[styles.loanAmount, { color: '#ff6b35' }]}>
            ৳{item.loanAmount.toFixed(2)}
          </Text>
          <Text style={[styles.loanDate, { color: theme.tabIconDefault }]}>
            {new Date(item.approvedAt).toLocaleDateString()}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={theme.tabIconDefault} />
      </View>
    </TouchableOpacity>
  );

  const StatCard = ({ title, count, amount, color }: { title: string; count: number; amount: number; color: string }) => (
    <View style={[styles.statCard, { 
      backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
    }]}>
      <Text style={[styles.statTitle, { color: theme.tabIconDefault }]}>{title}</Text>
      <Text style={[styles.statCount, { color: color }]}>{count}</Text>
      <Text style={[styles.statAmount, { color: theme.text }]}>৳{amount.toFixed(2)}</Text>
    </View>
  );


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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Loan Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        {stats ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <StatCard title="Total" count={stats.total.count} amount={stats.total.totalAmount} color="#8e24aa" />
            <StatCard title="Active" count={stats.active.count} amount={stats.active.totalAmount} color="#ff6b35" />
            <StatCard title="Paid" count={stats.paid.count} amount={stats.paid.totalAmount} color="#4CAF50" />
            <StatCard title="Cancelled" count={stats.cancelled.count} amount={stats.cancelled.totalAmount} color="#f44336" />
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.statCard, { 
              backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
              borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
            }]}>
              <ActivityIndicator size="small" color="#8e24aa" />
              <Text style={[styles.statTitle, { color: theme.tabIconDefault }]}>Loading...</Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              { 
                backgroundColor: viewMode === 'grouped' ? '#8e24aa' : 'transparent',
                borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
              }
            ]}
            onPress={() => setViewMode('grouped')}
          >
            <MaterialIcons 
              name="group" 
              size={16} 
              color={viewMode === 'grouped' ? '#fff' : theme.text} 
            />
            <Text style={[
              styles.viewModeText,
              { color: viewMode === 'grouped' ? '#fff' : theme.text }
            ]}>
              By User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              { 
                backgroundColor: viewMode === 'list' ? '#8e24aa' : 'transparent',
                borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
              }
            ]}
            onPress={() => setViewMode('list')}
          >
            <MaterialIcons 
              name="list" 
              size={16} 
              color={viewMode === 'list' ? '#fff' : theme.text} 
            />
            <Text style={[
              styles.viewModeText,
              { color: viewMode === 'list' ? '#fff' : theme.text }
            ]}>
              List View
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'grouped' && (
          <View style={styles.expandCollapseButtons}>
            <TouchableOpacity
              style={[styles.expandButton, { borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333' }]}
              onPress={expandAllUsers}
            >
              <Text style={[styles.expandButtonText, { color: theme.text }]}>Expand All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.expandButton, { borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333' }]}
              onPress={collapseAllUsers}
            >
              <Text style={[styles.expandButtonText, { color: theme.text }]}>Collapse All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'ACTIVE', 'PAID', 'CANCELLED'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                selectedStatus === status && styles.activeFilterTab,
                { 
                  backgroundColor: selectedStatus === status ? '#8e24aa' : 'transparent',
                  borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
                }
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[
                styles.filterTabText,
                { color: selectedStatus === status ? '#fff' : theme.text }
              ]}>
                {status === 'ALL' ? 'All Loans' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Loans List */}
      {loading && (viewMode === 'grouped' ? groupedLoans.length === 0 : loans.length === 0) ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#8e24aa" />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading {viewMode === 'grouped' ? 'grouped loans' : 'loans'}...
          </Text>
        </View>
      ) : viewMode === 'grouped' ? (
        <FlatList
          data={groupedLoans}
          renderItem={renderUserGroup}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loading && groupedLoans.length > 0 && groupedHasMore ? (
              <ActivityIndicator size="small" color="#8e24aa" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="group" size={64} color={theme.tabIconDefault} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No customers with loans found</Text>
                <Text style={[styles.emptySubtext, { color: theme.tabIconDefault }]}>
                  Customer loan groups will appear here when loans are created
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={loans}
          renderItem={renderOriginalLoanItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loading && loans.length > 0 && hasMore ? (
              <ActivityIndicator size="small" color="#8e24aa" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="receipt-long" size={64} color={theme.tabIconDefault} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No loans found</Text>
                <Text style={[styles.emptySubtext, { color: theme.tabIconDefault }]}>
                  Loans will appear here when customers request them
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Loan Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { 
            backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a' 
          }]}>
            {selectedLoan && (
              <>
                <View style={[styles.modalHeader, { 
                  borderBottomColor: colorScheme === 'light' ? '#e0e0e0' : '#333' 
                }]}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Loan Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalContent}>
                  <View style={[styles.detailSection, { 
                    backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                    borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444'
                  }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Customer Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Name:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>{selectedLoan.customerInfo.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Phone:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>{selectedLoan.customerInfo.phoneNumber}</Text>
                    </View>
                    {selectedLoan.customerInfo.studentId && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Student ID:</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{selectedLoan.customerInfo.studentId}</Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.detailSection, { 
                    backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                    borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444'
                  }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Loan Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Order ID:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>#{selectedLoan.orderId.slice(-8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Amount:</Text>
                      <Text style={[styles.infoValue, { color: '#ff6b35', fontWeight: 'bold' }]}>৳{selectedLoan.loanAmount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Status:</Text>
                      <Text style={[styles.infoValue, { color: getStatusColor(selectedLoan.status), fontWeight: 'bold' }]}>{selectedLoan.status}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Approved:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>{new Date(selectedLoan.approvedAt).toLocaleString()}</Text>
                    </View>
                  </View>

                  {selectedLoan.notes && (
                    <View style={[styles.detailSection, { 
                      backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444'
                    }]}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
                      <Text style={[styles.notesText, { color: theme.text }]}>{selectedLoan.notes}</Text>
                    </View>
                  )}
                </ScrollView>

                {selectedLoan.status === 'ACTIVE' && (
                  <>
                    {/* Main Action Buttons */}
                    <View style={[styles.modalActions, { 
                      borderTopColor: colorScheme === 'light' ? '#e0e0e0' : '#333' 
                    }]}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                        onPress={() => {
                          setModalVisible(false);
                          setPaymentMethodModalVisible(true);
                        }}
                      >
                        <Text style={styles.actionButtonText}>Mark as Paid</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#f44336' }]}
                        onPress={() => {
                          const loanCreatedTime = new Date(selectedLoan.createdAt).getTime();
                          const currentTime = new Date().getTime();
                          const timeDifferenceHours = (currentTime - loanCreatedTime) / (1000 * 60 * 60);
                          
                          if (timeDifferenceHours < 1) {
                            Alert.alert(
                              'Cannot Cancel Loan',
                              `Loans cannot be cancelled within 1 hour of being issued. This loan was created ${Math.round(timeDifferenceHours * 60)} minutes ago.`,
                              [{ text: 'OK' }]
                            );
                            return;
                          }

                          Alert.alert(
                            'Cancel Loan',
                            'Are you sure you want to cancel this loan?',
                            [
                              { text: 'No', style: 'cancel' },
                              { text: 'Yes', onPress: () => handleUpdateLoan('CANCELLED') }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.actionButtonText}>Cancel Loan</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Communication Actions */}
                    <View style={[styles.communicationActions, { 
                      borderTopColor: colorScheme === 'light' ? '#e0e0e0' : '#333' 
                    }]}>
                      <TouchableOpacity
                        style={[styles.communicationButton, { 
                          backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                          borderColor: colorScheme === 'light' ? '#dee2e6' : '#495057'
                        }]}
                        onPress={() => {
                          setModalVisible(false);
                          setCommunicationModalVisible(true);
                        }}
                      >
                        <Text style={[styles.communicationButtonText, { color: theme.text }]}>
                          📞 Log Communication
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Method Selection Modal */}
      <Modal
        visible={paymentMethodModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPaymentMethodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.updateModalContainer, { 
            backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a' 
          }]}>
            <Text style={[styles.updateModalTitle, { color: theme.text }]}>Payment Collection</Text>
            <Text style={[styles.updateModalSubtitle, { color: theme.tabIconDefault }]}>
              Select how the payment was collected
            </Text>
            
            {/* Payment Method Selection */}
            <View style={styles.paymentMethodContainer}>
              {['Cash at Restaurant', 'Mobile Banking (bKash/Nagad)', 'Credit Top-up Adjustment', 'Bank Transfer', 'Other'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodOption,
                    { 
                      backgroundColor: paymentMethod === method ? '#8e24aa' : 'transparent',
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444'
                    }
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[
                    styles.paymentMethodText,
                    { color: paymentMethod === method ? '#fff' : theme.text }
                  ]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              style={[styles.notesInput, { 
                backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444',
                color: theme.text
              }]}
              placeholder="Additional notes (transaction ID, staff name, etc.)"
              placeholderTextColor={theme.tabIconDefault}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.updateActions}>
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: '#f44336' }]}
                onPress={() => {
                  setPaymentMethodModalVisible(false);
                  setPaymentMethod('');
                  setNotes('');
                }}
              >
                <Text style={styles.updateButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.updateButton, { 
                  backgroundColor: '#4CAF50', 
                  opacity: (updating || !paymentMethod) ? 0.7 : 1 
                }]}
                onPress={() => handleUpdateLoan('PAID')}
                disabled={updating || !paymentMethod}
              >
                <Text style={styles.updateButtonText}>
                  {updating ? 'Processing...' : 'Confirm Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Communication Logging Modal */}
      <Modal
        visible={communicationModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCommunicationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.updateModalContainer, { 
            backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a' 
          }]}>
            <Text style={[styles.updateModalTitle, { color: theme.text }]}>Log Communication</Text>
            <Text style={[styles.updateModalSubtitle, { color: theme.tabIconDefault }]}>
              Record customer contact attempt
            </Text>
            
            {/* Communication Type Selection */}
            <View style={styles.paymentMethodContainer}>
              {['Phone Call', 'SMS/WhatsApp', 'In-Person Visit', 'Email', 'Family Contact'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.paymentMethodOption,
                    { 
                      backgroundColor: communicationType === type ? '#FF9800' : 'transparent',
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444'
                    }
                  ]}
                  onPress={() => setCommunicationType(type)}
                >
                  <Text style={[
                    styles.paymentMethodText,
                    { color: communicationType === type ? '#fff' : theme.text }
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              style={[styles.notesInput, { 
                backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444',
                color: theme.text
              }]}
              placeholder="Communication details (customer response, next steps, etc.)"
              placeholderTextColor={theme.tabIconDefault}
              value={communicationNotes}
              onChangeText={setCommunicationNotes}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.updateActions}>
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: '#f44336' }]}
                onPress={() => {
                  setCommunicationModalVisible(false);
                  setCommunicationType('');
                  setCommunicationNotes('');
                }}
              >
                <Text style={styles.updateButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.updateButton, { 
                  backgroundColor: '#FF9800', 
                  opacity: (!communicationType || !communicationNotes.trim()) ? 0.7 : 1 
                }]}
                onPress={handleCommunicationLog}
                disabled={!communicationType || !communicationNotes.trim()}
              >
                <Text style={styles.updateButtonText}>Log Communication</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
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
  statsContainer: {
    paddingVertical: 16,
  },
  statCard: {
    marginHorizontal: 8,
    marginLeft: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  statCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginLeft: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeFilterTab: {
    borderWidth: 0,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  loanCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loanDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  loanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountInfo: {
    flex: 1,
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  loanDate: {
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  detailSection: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  updateModalContainer: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
  },
  updateModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  updateModalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  updateActions: {
    flexDirection: 'row',
  },
  updateButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  communicationActions: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  communicationButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  communicationButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  paymentMethodContainer: {
    marginBottom: 16,
  },
  paymentMethodOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewModeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewModeToggle: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  expandCollapseButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  expandButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 16,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userGroupContainer: {
    marginBottom: 12,
  },
  userGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  userGroupInfo: {
    flex: 1,
  },
  userBasicInfo: {
    marginBottom: 8,
  },
  customerContact: {
    fontSize: 14,
    marginTop: 2,
  },
  studentId: {
    fontSize: 12,
    marginTop: 2,
  },
  userStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  userLoansContainer: {
    marginLeft: 8,
  },
});
