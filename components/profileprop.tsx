import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVATAR_SIZE = 96;

export default function ProfileProp() {
  const { user, logout, isAuthLoaded, updateProfile } = useAuth();
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const iconColor = Colors[colorScheme].icon;
  const theme = Colors[colorScheme];
  const router = useRouter();

  const buttonTextColor = colorScheme === 'light' ? '#fff' : '#18181b';
  const cancelButtonBg = colorScheme === 'light' ? 'transparent' : '#2a2a2a';
  const cancelButtonBorder = colorScheme === 'light' ? '#ddd' : '#444';
  const infoLabelColor = colorScheme === 'light' ? '#888' : '#aaa';
  const dividerColor = colorScheme === 'light' ? '#eee' : '#232323';

  // Config state for institutes
  const [config, setConfig] = React.useState<{ institutes: { _id: string; name: string }[] }>({ institutes: [] });
  const [configLoading, setConfigLoading] = React.useState(true);

  // Modal and form state
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    institute: user?.institute || '',
    studentId: user?.studentId || '',
    phoneNumber: user?.phoneNumber || '',
  });

  // Credit balance state
  const [creditBalance, setCreditBalance] = React.useState<number | null>(null);
  const [showCredit, setShowCredit] = React.useState(false);
  const [creditLoading, setCreditLoading] = React.useState(false);

  // Fetch config on mount
  React.useEffect(() => {
    let isMounted = true;
    setConfigLoading(true);
    axios.get('https://ourcanteennbackend.vercel.app/api/owner/config')
      .then(res => {
        if (isMounted) {
          setConfig(res.data);
        }
      })
      .catch(() => { })
      .finally(() => { if (isMounted) setConfigLoading(false); });
    return () => { isMounted = false; };
  }, []);

  // Update form data when user changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        institute: user.institute || '',
        studentId: user.studentId || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  // Helper to get institute name
  const getInstituteName = (instituteId: string | undefined) => {
    if (!instituteId) return '-';
    return config.institutes.find(inst => inst._id === instituteId)?.name || instituteId;
  };

  // Fetch credit balance function
  const fetchCreditBalance = async () => {
    if (!token) return;

    setCreditLoading(true);
    try {
      const res = await axios.get('https://ourcanteennbackend.vercel.app/api/user/credit', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      setCreditBalance(data.credit);
      setShowCredit(true);

      // Hide credit balance after 3 seconds
      setTimeout(() => {
        setShowCredit(false);
      }, 3000);

    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch credit balance. Please try again.');

      if (error.response?.status === 403) {
        logout();
        router.push("/(auth)/signin");
      }
    } finally {
      setCreditLoading(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!formData.name || !formData.email || !formData.institute || !formData.studentId || !formData.phoneNumber) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setIsModalVisible(false);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAuthLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: cardBg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cardBg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 0 }}>
        {/* Modern Hero Section */}
        <View style={[styles.modernHero, { backgroundColor: theme.background }]}>
          {/* Avatar */}
          <View style={[styles.modernAvatar, { backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#1a1a1a' }]}>
            <Ionicons name="person" size={48} color={primary} />
          </View>
          
          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={[styles.modernName, { color: theme.text }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.modernEmail, { color: theme.tabIconDefault }]}>{user?.email}</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {/* Balance Card */}
                <TouchableOpacity
                  onPress={fetchCreditBalance}
                  disabled={creditLoading}
              style={[styles.balanceCard, { 
                backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
                borderColor: colorScheme === 'light' ? '#e5e7eb' : '#374151'
              }]}
              activeOpacity={0.7}
            >
              <View style={styles.balanceHeader}>
                <Ionicons name="wallet-outline" size={20} color={primary} />
                <Text style={[styles.balanceLabel, { color: theme.tabIconDefault }]}>Balance</Text>
              </View>
              {showCredit ? (
                <Text style={[styles.balanceAmount, { color: primary }]}>৳{creditBalance || 0}</Text>
              ) : (
                <View style={styles.balanceContent}>
                  {creditLoading ? (
                    <ActivityIndicator size="small" color={primary} />
                  ) : (
                    <Text style={[styles.balanceTap, { color: theme.tabIconDefault }]}>Tap to view</Text>
                  )}
                </View>
                  )}
                </TouchableOpacity>

            {/* Topup Button */}
            <TouchableOpacity
              style={[styles.topupCard, { backgroundColor: primary }]}
              onPress={() => {
                const data = { userId: user?.id, topup: true };
                const encodedData = encodeURIComponent(JSON.stringify(data));
                router.push({ pathname: '/qrtaka', params: { data: encodedData } });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={buttonTextColor} />
              <Text style={[styles.topupText, { color: buttonTextColor }]}>Top Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modern Details Section */}
        <View style={[styles.modernCard, { 
          backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
          borderColor: colorScheme === 'light' ? '#e5e7eb' : '#374151'
        }]}>
          {/* Section Header */}
          <View style={styles.modernSectionHeader}>
            <Text style={[styles.modernSectionTitle, { color: theme.text }]}>Personal Information</Text>
            <TouchableOpacity
              style={[styles.modernEditButton, { 
                backgroundColor: colorScheme === 'light' ? '#f3f4f6' : '#374151' 
              }]}
              onPress={() => setIsModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={16} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Info Items */}
          <View style={styles.modernInfoContainer}>
            <View style={styles.modernInfoItem}>
              <View style={styles.modernInfoHeader}>
                <Ionicons name="call" size={16} color={theme.tabIconDefault} />
                <Text style={[styles.modernInfoLabel, { color: theme.tabIconDefault }]}>Phone</Text>
              </View>
              <Text style={[styles.modernInfoValue, { color: theme.text }]}>{user?.phoneNumber || 'Not provided'}</Text>
            </View>

            <View style={styles.modernInfoItem}>
              <View style={styles.modernInfoHeader}>
                <Ionicons name="school" size={16} color={theme.tabIconDefault} />
                <Text style={[styles.modernInfoLabel, { color: theme.tabIconDefault }]}>Institute</Text>
              </View>
              <Text style={[styles.modernInfoValue, { color: theme.text }]}>
                {configLoading ? 'Loading...' : getInstituteName(user?.institute) || 'Not selected'}
              </Text>
            </View>

            <View style={styles.modernInfoItem}>
              <View style={styles.modernInfoHeader}>
                <Ionicons name="card" size={16} color={theme.tabIconDefault} />
                <Text style={[styles.modernInfoLabel, { color: theme.tabIconDefault }]}>Student ID</Text>
              </View>
              <Text style={[styles.modernInfoValue, { color: theme.text }]}>{user?.studentId || 'Not provided'}</Text>
          </View>
          </View>
          </View>


        {/* Modern Action Buttons */}
        <View style={styles.modernActionsContainer}>
          {/* History Button */}
          <TouchableOpacity
            style={[styles.modernActionButton, { 
              backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
              borderColor: colorScheme === 'light' ? '#e5e7eb' : '#374151'
            }]}
            onPress={() => router.push('/history')}
            activeOpacity={0.7}
          >
            <View style={[styles.modernActionIcon, { backgroundColor: '#10b981' }]}>
              <Ionicons name="time" size={18} color="#fff" />
            </View>
            <View style={styles.modernActionContent}>
              <Text style={[styles.modernActionTitle, { color: theme.text }]}>Transaction History</Text>
              <Text style={[styles.modernActionSubtitle, { color: theme.tabIconDefault }]}>View your loans and topups</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.tabIconDefault} />
          </TouchableOpacity>

          {/* Logout Button */}
            <TouchableOpacity
            style={[styles.modernActionButton, { 
              backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
              borderColor: colorScheme === 'light' ? '#e5e7eb' : '#374151'
              }]}
              onPress={logout}
            activeOpacity={0.7}
          >
            <View style={[styles.modernActionIcon, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="log-out" size={18} color="#fff" />
            </View>
            <View style={styles.modernActionContent}>
              <Text style={[styles.modernActionTitle, { color: theme.text }]}>Sign Out</Text>
              <Text style={[styles.modernActionSubtitle, { color: theme.tabIconDefault }]}>Logout from your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.tabIconDefault} />
            </TouchableOpacity>
          </View>

        {/* Bottom spacing for navigation bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Profile Update Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>Update Profile</ThemedText>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: infoLabelColor }]}>Full Name</ThemedText>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                    color: textColor,
                    borderColor: dividerColor
                  }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter your full name"
                  placeholderTextColor={infoLabelColor}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: infoLabelColor }]}>Email</ThemedText>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                    color: textColor,
                    borderColor: dividerColor
                  }]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter your email"
                  placeholderTextColor={infoLabelColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: infoLabelColor }]}>Institute</ThemedText>
                <View style={{
                  borderWidth: 1,
                  borderRadius: 12,
                  borderColor: dividerColor,
                  backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                  overflow: 'hidden',
                }}>
                  <Picker
                    selectedValue={formData.institute}
                    onValueChange={(itemValue) => setFormData({ ...formData, institute: itemValue })}
                    style={{ color: textColor }}
                    dropdownIconColor={textColor}
                  >
                    <Picker.Item label={configLoading ? 'Loading...' : 'Select your institute'} value="" />
                    {config.institutes.map((inst) => (
                      <Picker.Item key={inst._id} label={inst.name} value={inst._id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: infoLabelColor }]}>Student ID</ThemedText>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                    color: textColor,
                    borderColor: dividerColor
                  }]}
                  value={formData.studentId}
                  onChangeText={(text) => setFormData({ ...formData, studentId: text })}
                  placeholder="Enter your student ID"
                  placeholderTextColor={infoLabelColor}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: infoLabelColor }]}>Phone Number</ThemedText>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                    color: textColor,
                    borderColor: dividerColor
                  }]}
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                  placeholder="Enter your phone number"
                  placeholderTextColor={infoLabelColor}
                  keyboardType="phone-pad"
                />
              </View>


            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, {
                  borderColor: cancelButtonBorder,
                  backgroundColor: cancelButtonBg
                }]}
                onPress={() => setIsModalVisible(false)}
                disabled={isUpdating}
              >
                <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: primary }]}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={buttonTextColor} />
                ) : (
                  <ThemedText style={{ color: buttonTextColor, fontWeight: '600' }}>Update Profile</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Modern Hero Styles
  modernHero: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  modernAvatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  userInfo: {
    marginBottom: 32,
  },
  modernName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  modernEmail: {
    fontSize: 16,
    fontWeight: '400',
  },
  
  // Quick Actions Styles
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  balanceCard: {
    flex: 2,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  balanceContent: {
    minHeight: 32,
    justifyContent: 'center',
  },
  balanceTap: {
    fontSize: 14,
    fontWeight: '400',
  },
  topupCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topupText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },

  // Modern Card Styles
  modernCard: {
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modernEditButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernInfoContainer: {
    gap: 20,
  },
  modernInfoItem: {
    gap: 8,
  },
  modernInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modernInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernInfoValue: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Modern Actions Styles
  modernActionsContainer: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
    gap: 16,
  },
  modernActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  modernActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modernActionContent: {
    flex: 1,
    gap: 2,
  },
  modernActionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modernActionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },

  // Modal styles (keeping modern but simplified)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    paddingBottom: 50,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  updateButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
});