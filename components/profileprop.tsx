import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVATAR_SIZE = 96;

export default function ProfileProp() {
  const { user, logout, isAuthLoaded, updateProfile } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const iconColor = Colors[colorScheme].icon;
  // const heroBg = colorScheme === 'light' ? '#ffe6eb' : '#18181b';
  const cardOverlayBg = colorScheme === 'light' ? 'rgba(255,255,255,0.98)' : 'rgba(30,30,32,0.98)';
  const avatarBorder = colorScheme === 'light' ? '#fff' : '#232323';
  const dividerColor = colorScheme === 'light' ? '#eee' : '#232323';
  const infoLabelColor = colorScheme === 'light' ? '#888' : '#aaa';
  const infoValueColor = colorScheme === 'light' ? '#222' : '#ececec';
  const heroNameColor = colorScheme === 'light' ? '#222' : '#ececec';
  const heroSubtitleColor = colorScheme === 'light' ? '#888' : '#aaa';
  const buttonTextColor = colorScheme === 'light' ? '#fff' : '#18181b';
  const cancelButtonBg = colorScheme === 'light' ? 'transparent' : '#2a2a2a';
  const cancelButtonBorder = colorScheme === 'light' ? '#ddd' : '#444';

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
        {/* Hero Section */}
        <LinearGradient
          colors={colorScheme === 'light' ? ['#ffe6eb', '#fff'] : ['#18181b', '#232323']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.hero, { backgroundColor: undefined }]}
        >
          <View style={[styles.avatarWrapper, { borderColor: avatarBorder, backgroundColor: cardBg, position: 'absolute', top: 38, zIndex: 10, alignSelf: 'center', shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 }]}>
            <Ionicons name="person-circle" size={AVATAR_SIZE} color={primary} style={{ backgroundColor: 'transparent' }} />
          </View>
          <View style={{ height: AVATAR_SIZE / 2 + 20 }} />
          <ThemedText type="title" style={[styles.heroName, { color: heroNameColor, marginTop: AVATAR_SIZE, fontSize: 26, fontWeight: '800' }]}>{user?.name || 'User'}</ThemedText>
          <ThemedText type="subtitle" style={[styles.heroSubtitle, { color: heroSubtitleColor, fontSize: 16 }]}>{user?.email}</ThemedText>
        </LinearGradient>
        {/* Card Overlay */}
        <ThemedView style={[styles.cardOverlay, { backgroundColor: cardOverlayBg, marginTop: AVATAR_SIZE / 2 - 60, padding: 32, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <ThemedText type="subtitle" style={styles.sectionHeader}>Account Details</ThemedText>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: primary }]}
              onPress={() => setIsModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color={buttonTextColor} />
              <ThemedText style={{ color: buttonTextColor, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Edit</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={iconColor} style={styles.icon} />
            <ThemedText style={[styles.infoLabel, { color: infoLabelColor, fontSize: 14 }]}>Phone:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: infoValueColor, fontSize: 14 }]}>{user?.phoneNumber || '-'}</ThemedText>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={20} color={iconColor} style={styles.icon} />
            <ThemedText style={[styles.infoLabel, { color: infoLabelColor, fontSize: 14 }]}>Institute:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: infoValueColor, fontSize: 13 }]}>{configLoading ? '-' : getInstituteName(user?.institute)}</ThemedText>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="id-card-outline" size={20} color={iconColor} style={styles.icon} />
            <ThemedText style={[styles.infoLabel, { color: infoLabelColor, fontSize: 14 }]}>Student ID:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: infoValueColor, fontSize: 14 }]}>{user?.studentId || '-'}</ThemedText>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={20} color={iconColor} style={styles.icon} />
            <ThemedText style={[styles.infoLabel, { color: infoLabelColor, fontSize: 14 }]}>Role:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: infoValueColor, fontSize: 14 }]}>{user?.isOwner ? 'Owner' : 'User'}</ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: primary, width: '100%', marginTop: 28, shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 }]}
            onPress={logout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color={buttonTextColor} style={{ marginRight: 12 }} />
            <ThemedText style={{ color: buttonTextColor, fontWeight: '800', fontSize: 16 }}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>
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
  hero: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    paddingBottom: 38,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 0,
    zIndex: 2,
    minHeight: 220,
    overflow: 'visible',
  },
  avatarWrapper: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 0,
  },
  heroSubtitle: {
    fontSize: 16,
    marginTop: 2,
    marginBottom: 0,
    fontWeight: '400',
  },
  cardOverlay: {
    marginTop: -AVATAR_SIZE / 2 + 38,
    marginHorizontal: 12,
    borderRadius: 26,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
    zIndex: 3,
  },
  sectionHeader: {
    fontWeight: '800',
    marginBottom: 16,
    color: '#DC143C',
    fontSize: 20,
    letterSpacing: 0.2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 18,
    marginTop: 2,
    opacity: 0.7,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#eee',
    opacity: 0.3,
    marginVertical: 6,
    marginLeft: 36,
    borderRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    paddingVertical: 10,
  },
  infoLabel: {
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
    color: '#888',
    minWidth: 100,
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    flex: 1,
    fontWeight: '500',
  },
  icon: {
    marginRight: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
    alignSelf: 'center',
    marginTop: 28,
  },
  // Modal styles
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