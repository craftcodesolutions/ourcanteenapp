import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  cuisine: string;
  available: boolean;
}

interface Cuisine {
  _id: string;
  name: string;
}

interface Config {
  cuisines: Cuisine[];
}

interface MenuForm {
  _id?: string;
  name: string;
  description: string;
  price: string;
  image: string;
  cuisine: string;
  available: boolean;
}

export default function MenuScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const iconColor = Colors[colorScheme].icon;

  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<MenuForm>({
    _id: '',
    name: '',
    description: '',
    price: '',
    image: '',
    cuisine: '',
    available: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [config, setConfig] = useState<Config>({ cuisines: [] });
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch menu items
  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://ourcanteennbackend.vercel.app/api/owner/resmenu', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch menu');
      const data: MenuItem[] = await res.json();
      setMenuItems(data);
    } catch (e) {
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cuisine config
  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await fetch('https://ourcanteennbackend.vercel.app/api/owner/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch config');
      const data: Config = await res.json();
      setConfig(data);
    } catch (e) {
      setConfig({ cuisines: [] });
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConfig();
      fetchMenu();
    }
  }, [token]);

  // Open modal for create/edit
  const openModal = (item: MenuItem | null = null) => {
    if (item) {
      setForm({
        _id: item._id,
        name: item.name,
        description: item.description || '',
        price: String(item.price),
        image: item.image || '',
        cuisine: item.cuisine || '',
        available: item.available ?? true,
      });
      setIsEditing(true);
    } else {
      setForm({ _id: '', name: '', description: '', price: '', image: '', cuisine: '', available: true });
      setIsEditing(false);
    }
    setModalVisible(true);
  };

  // Handle image pick/upload
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setUploadingImage(true);
      try {
        const url = await uploadToCloudinary(result.assets[0].uri, 'ourcanteen');
        setForm(f => ({ ...f, image: url }));
      } catch (e) {
        alert('Image upload failed');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  // Handle form submit (create/edit)
  const handleSave = async () => {
    if (!form.name || !form.price || !form.cuisine) {
      alert('Name, price, and cuisine are required');
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        image: form.image,
        cuisine: form.cuisine,
        available: form.available,
        ...(isEditing ? { _id: form._id } : {}),
      };
      const res = await fetch('https://ourcanteennbackend.vercel.app/api/owner/resmenu', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let errMsg = 'Failed to save';
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const data: MenuItem[] = await res.json();
      setMenuItems(data);
      setModalVisible(false);
    } catch (e: any) {
      alert(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cardBg }}>
      <ThemedView style={{ flex: 1, backgroundColor: cardBg }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 48 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <ThemedText type="title" style={{ fontSize: 22, fontWeight: '700' }}>Menu</ThemedText>
            <TouchableOpacity
              style={{ backgroundColor: primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}
              onPress={() => openModal(null)}
              activeOpacity={0.8}
            >
              <ThemedText style={{ color: colorScheme === 'light' ? '#fff' : '#18181b', fontWeight: '600', fontSize: 15 }}>Add Food Item</ThemedText>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
              <ActivityIndicator size="large" color={primary} />
            </View>
          ) : menuItems.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="fast-food-outline" size={48} color={iconColor} style={{ opacity: 0.5 }} />
              <ThemedText style={{ marginTop: 10, color: textColor, opacity: 0.7 }}>No menu items yet</ThemedText>
            </View>
          ) : (
            menuItems.map(item => {
              const cuisineName = config.cuisines.find(c => c._id === item.cuisine)?.name || 'Unknown';
              const availableColor = item.available ? '#388e3c' : '#d32f2f';
              const availableBg = item.available ? (colorScheme === 'light' ? '#e6f4ea' : '#23432c') : (colorScheme === 'light' ? '#fdeaea' : '#4a2323');
              const borderColor = colorScheme === 'light' ? '#e0e0e0' : '#333';
              return (
                <View
                  key={item._id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: cardBg,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor,
                  }}
                >
                  <Image
                    source={item.image ? { uri: item.image } : require('@/assets/images/partial-react-logo.png')}
                    style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#eee' }}
                  />
                  <View style={{ flex: 1, marginLeft: 14, justifyContent: 'center' }}>
                    <ThemedText style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 4 }} numberOfLines={1}>{item.name}</ThemedText>
                    <View style={{ height: 1, backgroundColor: borderColor, marginVertical: 6, opacity: 0.12 }} />
                    <ThemedText style={{ fontSize: 12, color: textColor, opacity: 0.8 }} numberOfLines={2}>{item.description}</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                      <ThemedText style={{ fontSize: 12, color: textColor, marginRight: 10 }}>Cuisine: <ThemedText style={{ fontWeight: '600', fontSize: 12 }}>{cuisineName}</ThemedText></ThemedText>
                      <ThemedText style={{ fontSize: 12, color: textColor, marginRight: 10 }}>Price: <ThemedText style={{ fontWeight: '600', fontSize: 12 }}>৳{item.price}</ThemedText></ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                      <View style={{
                        backgroundColor: availableBg,
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 2,
                        alignSelf: 'flex-start',
                        marginRight: 6,
                      }}>
                        <ThemedText style={{ fontSize: 11, color: availableColor, fontWeight: '700' }}>{item.available ? 'Available' : 'Not Available'}</ThemedText>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{
                      marginLeft: 10,
                      padding: 7,
                      borderRadius: 8,
                      backgroundColor: primary,
                      alignSelf: 'center',
                      opacity: 0.92,
                    }}
                    onPress={() => openModal(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={18} color={colorScheme === 'light' ? '#fff' : '#18181b'} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
        {/* Modal for create/edit food item */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: cardBg }]}> 
              <View style={styles.modalHeader}>
                <ThemedText type="title" style={{ fontSize: 20, fontWeight: '700' }}>{isEditing ? 'Edit Food Item' : 'Add Food Item'}</ThemedText>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={iconColor} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Name */}
                <ThemedText style={[styles.label, { color: textColor }]}>Name *</ThemedText>
                <TextInput
                  value={form.name}
                  onChangeText={text => setForm(f => ({ ...f, name: text }))}
                  placeholder="Food name"
                  placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#666'}
                  style={[
                    styles.input,
                    {
                      backgroundColor: cardBg,
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                      color: textColor,
                    },
                  ]}
                />
                {/* Description */}
                <ThemedText style={[styles.label, { color: textColor }]}>Description</ThemedText>
                <TextInput
                  value={form.description}
                  onChangeText={text => setForm(f => ({ ...f, description: text }))}
                  placeholder="Description"
                  placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#666'}
                  style={[
                    styles.input,
                    {
                      backgroundColor: cardBg,
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                      color: textColor,
                    },
                  ]}
                  multiline
                />
                {/* Price */}
                <ThemedText style={[styles.label, { color: textColor }]}>Price (৳) *</ThemedText>
                <TextInput
                  value={form.price}
                  onChangeText={text => setForm(f => ({ ...f, price: text.replace(/[^0-9]/g, '') }))}
                  placeholder="Price"
                  placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#666'}
                  style={[
                    styles.input,
                    {
                      backgroundColor: cardBg,
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                      color: textColor,
                    },
                  ]}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {/* Cuisine */}
                <ThemedText style={[styles.label, { color: textColor }]}>Cuisine *</ThemedText>
                <View
                  style={[
                    styles.pickerWrapper,
                    {
                      backgroundColor: cardBg,
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                    },
                  ]}
                >
                  {configLoading ? (
                    <ActivityIndicator size="small" color={primary} />
                  ) : (
                    <Picker
                      selectedValue={form.cuisine}
                      onValueChange={value => setForm(f => ({ ...f, cuisine: value }))}
                      style={{ color: textColor, height: 48, fontSize: 14, backgroundColor: 'transparent' }}
                      dropdownIconColor={textColor}
                    >
                      <Picker.Item label="Select Cuisine" value="" style={{ fontSize: 14 }} />
                      {config.cuisines.map(c => (
                        <Picker.Item key={c._id} label={c.name} value={c._id} style={{ fontSize: 14 }} />
                      ))}
                    </Picker>
                  )}
                </View>
                {/* Image */}
                <ThemedText style={[styles.label, { color: textColor }]}>Image</ThemedText>
                <TouchableOpacity
                  onPress={pickImage}
                  style={[
                    styles.imagePicker,
                    {
                      backgroundColor: cardBg,
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                    },
                  ]}
                  disabled={uploadingImage}
                  activeOpacity={0.7}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color={primary} />
                  ) : (
                    <>
                      {form.image ? (
                        <Image source={{ uri: form.image }} style={{ width: 100, height: 100, borderRadius: 10, marginBottom: 6 }} resizeMode="cover" />
                      ) : null}
                      <ThemedText style={{ color: primary, fontSize: 13 }}>{form.image ? 'Change Image' : 'Select Image'}</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
                {/* Available */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                  <ThemedText style={{ fontSize: 15, fontWeight: '600', marginRight: 10 }}>Available</ThemedText>
                  <Switch
                    value={form.available}
                    onValueChange={v => setForm(f => ({ ...f, available: v }))}
                    trackColor={{ false: '#ccc', true: primary }}
                    thumbColor={form.available ? primary : '#eee'}
                  />
                </View>
              </ScrollView>
              {/* Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <ThemedText style={{ color: iconColor, fontWeight: '600', fontSize: 16 }}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveBtn, saving && { backgroundColor: '#ccc' }]}
                  activeOpacity={0.7}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colorScheme === 'light' ? '#fff' : '#18181b'} />
                  ) : (
                    <ThemedText style={{ color: colorScheme === 'light' ? '#fff' : '#18181b', fontWeight: '600', fontSize: 16 }}>{isEditing ? 'Save' : 'Create'}</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '92%',
    minHeight: '70%',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#f3f3f3',
  },
  label: {
    marginBottom: 8,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
    fontSize: 15,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  imagePicker: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 18,
    padding: 12,
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 0,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'transparent',
  },
  cancelBtn: {
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  saveBtn: {
    backgroundColor: '#DC143C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
