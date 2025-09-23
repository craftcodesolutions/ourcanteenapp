import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator, Dimensions, Image, Keyboard, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { uploadToCloudinary } from '@/utils/cloudinary';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';

const { width } = Dimensions.get('window');
const height = (width * 9) / 16; // 16:9 ratio

// Define types for opening hours

type OpeningHourDay = {
  open: boolean;
  start: string | null;
  end: string | null;
};

type OpeningHours = {
  [day: string]: OpeningHourDay;
};

export default function RestaurantScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const iconColor = Colors[colorScheme].icon;

  const { token, logout } = useAuth();

  const [restaurant, setRestaurant] = useState<null | {
    _id: string;
    name: string;
    institute: string;
    location: string;
    banner: string;
    logo: string;
    cuisine: string[];
    openingHours: OpeningHours;
  }>(null);
  const [loading, setLoading] = useState(true);

  const [config, setConfig] = useState<{
    cuisines: { _id: string; name: string; }[];
    institutes: { _id: string; name: string; }[];
  }>({
    cuisines: [],
    institutes: []
  });
  const [configLoading, setConfigLoading] = useState(true);

  const [cuisine, setCuisine] = useState<{ _id: string; name: string; }[]>([]);

  
  // Helper functions for cuisine selection
  const openCuisineModal = () => {
    // Initialize selected cuisines with current cuisine IDs
    const currentCuisineIds = cuisine.map(c => c._id);
    setSelectedCuisines(currentCuisineIds);

    // Initialize custom cuisines (extract names that don't match config cuisines)
    const configCuisineNames = config.cuisines.map(c => c.name.toLowerCase());
    const customCuisineNames = cuisine
      .filter(c => !configCuisineNames.includes(c.name.toLowerCase()))
      .map(c => c.name);
    setCustomCuisines(customCuisineNames);

    setCuisineModalVisible(true);
  };

  const handleCuisineToggle = (cuisineId: string) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisineId)) {
        return prev.filter(id => id !== cuisineId);
      } else {
        return [...prev, cuisineId];
      }
    });

    console.log(selectedCuisines);
  };

  const saveCuisineSelection = async () => {
    setSavingCuisines(true);
    try {

      let newC = customCuisines.map(name => ({ name }))
      // Prepare the request body
      let requestBody;

      if (newC.length > 0) {
        requestBody = {
          selectedCuisine: selectedCuisines,
          newCuisine: newC
        };
      } else {
        requestBody = {
          selectedCuisine: selectedCuisines
        };
      }

      console.log(requestBody);

      // Make API call to update cuisines
      const response = await axios.post('https://ourcanteennbackend.vercel.app/api/owner/mycuis', requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response.data)

      // Update local state with the response (array of cuisine IDs)
      const updatedCuisineIds = response.data.latestC;

      setConfig({
        institutes: config.institutes,
        cuisines: response.data.cuisines
      })

      // Fetch the updated cuisine details to display names
      const updatedCuisineObjects = updatedCuisineIds.map((id: string) => {
        // First check if it's in config cuisines
        const configCuisine = response.data.cuisines.find((c: { _id: string; name: string }) => c._id === id);
        
        if (configCuisine) {
          return configCuisine;
        }
        // If not in config, it's a custom cuisine - we'll need to fetch it or handle it
        // For now, we'll create a placeholder object
        return { _id: id, name: 'Custom Cuisine' };
      });

      setCuisine(updatedCuisineObjects);
      setCuisineModalVisible(false);

      // Refresh config data to get any new cuisines that were added
      await fetchConfig();
    } catch (error: any) {
      console.log(error.response?.data)
      if (error.response) {
        if (error.response.status === 400) {
          alert('Please select at least one cuisine');
        } else if (error.response.status === 401) {
          alert('Authentication error. Please login again.');
        } else if (error.response.status === 403) {
          logout();
          router.replace("/(auth)/signin");
        } else {
          alert('Failed to update cuisines. Please try again.');
        }
      } else {
        alert('Network error. Please check your connection.');
      }
    } finally {
      setSavingCuisines(false);
    }
  };

  const addCustomCuisine = () => {
    if (newCustomCuisine.trim()) {
      setCustomCuisines(prev => [...prev, newCustomCuisine.trim()]);
      setNewCustomCuisine('');
    }
  };

  const removeCustomCuisine = (index: number) => {
    setCustomCuisines(prev => prev.filter((_, i) => i !== index));
  };

  // Penalty settings functions
  const savePenaltySettings = async () => {
    setSavingPenalty(true);
    try {
      await axios.put('https://ourcanteennbackend.vercel.app/api/owner/penalty-settings', penaltySettings, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setPenaltyModalVisible(false);
      alert('Penalty settings updated successfully');
    } catch (error: any) {
      if (error.response?.status === 403) {
        logout();
        router.replace("/(auth)/signin");
      } else {
        alert(error.response?.data?.error || 'Failed to update penalty settings');
      }
    } finally {
      setSavingPenalty(false);
    }
  };


  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    institute: '',
    location: '',
    banner: '',
    logo: '',
    openingHours: {
      sunday: { open: true, start: '', end: '' },
      monday: { open: true, start: '', end: '' },
      tuesday: { open: true, start: '', end: '' },
      wednesday: { open: true, start: '', end: '' },
      thursday: { open: true, start: '', end: '' },
      friday: { open: false, start: '', end: '' },
      saturday: { open: true, start: '', end: '' },
    } as OpeningHours,
  });

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [timeErrors, setTimeErrors] = useState<{ [key: string]: { start?: string, end?: string } }>({});

  // Cuisine selection modal state
  const [cuisineModalVisible, setCuisineModalVisible] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [penaltySettings, setPenaltySettings] = useState({
    enabled: true,
    penaltyRate: 10,
    timeThreshold: 6,
    allowNegativeBalance: true
  });
  const [penaltyModalVisible, setPenaltyModalVisible] = useState(false);
  const [savingPenalty, setSavingPenalty] = useState(false);
  const [customCuisines, setCustomCuisines] = useState<string[]>([]);
  const [newCustomCuisine, setNewCustomCuisine] = useState('');
  const [savingCuisines, setSavingCuisines] = useState(false);

  // Validation function for hours
  const validateHour = (hour: string): string | null => {
    if (!hour) return null;
    const h = parseInt(hour, 10);
    if (isNaN(h)) return 'Invalid hour';
    if (h < 0 || h > 23) return 'Hour must be 0-23';
    return null;
  };

  // Handle time input with validation
  const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
    const error = validateHour(value);
    let newErrors = { ...timeErrors };
    let newDayErrors = { ...newErrors[day], [field]: error };

    // Prepare values for cross-field validation
    let startRaw = field === 'start' ? value : form.openingHours[day as keyof typeof form.openingHours].start;
    let endRaw = field === 'end' ? value : form.openingHours[day as keyof typeof form.openingHours].end;
    let start = startRaw ?? '';
    let end = endRaw ?? '';
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    const startValid = !validateHour(start) && start !== '';
    const endValid = !validateHour(end) && end !== '';

    // Cross-field validation: start < end
    if (startValid && endValid) {
      if (startNum >= endNum) {
        newDayErrors.start = 'Start must be less than end';
        newDayErrors.end = 'End must be greater than start';
      } else {
        // Only keep individual errors
        if (newDayErrors.start === 'Start must be less than end') newDayErrors.start = undefined;
        if (newDayErrors.end === 'End must be greater than start') newDayErrors.end = undefined;
      }
    } else {
      // Only keep individual errors
      if (newDayErrors.start === 'Start must be less than end') newDayErrors.start = undefined;
      if (newDayErrors.end === 'End must be greater than start') newDayErrors.end = undefined;
    }

    newErrors[day] = newDayErrors;
    setTimeErrors(newErrors);

    // Only update form if valid or empty
    if (!error || value === '') {
      setForm(f => ({
        ...f,
        openingHours: {
          ...f.openingHours,
          [day]: {
            ...f.openingHours[day as keyof typeof f.openingHours],
            [field]: value
          }
        }
      }));
    }
  };

  // Banner image picker handler
  async function pickBannerImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setUploadingBanner(true);
      try {
        const url = await uploadToCloudinary(result.assets[0].uri, 'ourcanteen');
        console.log(url)
        setForm(f => ({ ...f, banner: url }));
      } catch (e) {
        console.log(e)
        alert('Banner upload failed');
      } finally {
        setUploadingBanner(false);
      }
    }
  }

  // Logo image picker handler
  async function pickLogoImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setUploadingLogo(true);
      try {
        const url = await uploadToCloudinary(result.assets[0].uri, 'ourcanteen');
        setForm(f => ({ ...f, logo: url }));
      } catch (e) {
        console.log(e)
        alert('Logo upload failed');
      } finally {
        setUploadingLogo(false);
      }
    }
  }

  // Add a helper for default form values
  const defaultForm = {
    name: '',
    institute: '',
    location: '',
    banner: '',
    logo: '',
    openingHours: {
      sunday: { open: true, start: '', end: '' },
      monday: { open: true, start: '', end: '' },
      tuesday: { open: true, start: '', end: '' },
      wednesday: { open: true, start: '', end: '' },
      thursday: { open: true, start: '', end: '' },
      friday: { open: false, start: '', end: '' },
      saturday: { open: true, start: '', end: '' },
    } as OpeningHours,
  };

  // Fetch config data
  const fetchConfig = async () => {
    try {
      setConfigLoading(true);
      const response = await axios.get('https://ourcanteennbackend.vercel.app/api/owner/config', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setConfig(response.data);
      return response.data; // Return the config data
    } catch (error: any) {
      if (error.response?.status === 403) {
        logout();
        router.replace('/(auth)/signin');
        return null;
      }
      console.error('Failed to fetch config:', error);
      // Don't show alert for config fetch failure, just log it
      return null;
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Fetch config data first, then fetch restaurant data
    const loadData = async () => {
      try {
        // Wait for config to load first and get the config data
        const configData = await fetchConfig();
        
        // Now fetch restaurant data and penalty settings
        const [res, penaltyRes] = await Promise.all([
          axios.get('https://ourcanteennbackend.vercel.app/api/owner/myres', {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }),
          axios.get('https://ourcanteennbackend.vercel.app/api/owner/penalty-settings', {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }).catch(() => null) // Don't fail if penalty settings don't exist yet
        ]);

        if (isMounted) {
          console.log(res.data);

          if (res.data.cuisine && configData) {
            // Convert cuisine IDs to objects with _id and name by looking up in config
            const cuisineObjects = res.data.cuisine.map((id: string) => {
              const configCuisine = configData.cuisines.find((c: { _id: string; name: string }) => c._id === id);
              return configCuisine || { _id: id, name: 'Unknown Cuisine' };
            });
            setCuisine(cuisineObjects);
          }

          // Set penalty settings
          if (penaltyRes?.data?.penaltySettings) {
            setPenaltySettings(penaltyRes.data.penaltySettings);
          }

          setRestaurant(res.data);
          setLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err.response) {
          if (err.response.status === 404) {
            setRestaurant(null);
          } else if (err.response.status === 401) {
            alert('You are not owner');
          } else if (err.response.status === 403) {
            logout();
            router.replace('/(auth)/signin');
          } else {
            alert('An error occurred');
          }
        } else {
          alert('Network error');
        }
        setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [token]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cardBg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48, flexGrow: 1 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : !restaurant ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
            <ThemedText type="title" style={{ marginBottom: 18, fontSize: 20, fontWeight: '700' }}>
              {"You don't have any Restaurant"}
            </ThemedText>
            <TouchableOpacity
              style={{
                backgroundColor: primary,
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 22,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 10,
              }}
              onPress={() => {
                setForm(defaultForm);
                setIsCreating(true);
                setModalVisible(true);
              }}
            >
              <ThemedText style={{ color: colorScheme === 'light' ? '#fff' : '#18181b', fontWeight: '600', fontSize: 16 }}>
                Create Restaurant...
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Hero Section */}
            <View style={styles.heroContainer}>
              <Image
                source={{ uri: restaurant.banner }}
                style={styles.coverImage}
                resizeMode="cover"
              />
              <View style={styles.overlay} />
              <View style={[styles.logoContainer, { backgroundColor: cardBg }]}>
                <Image
                  source={{ uri: restaurant.logo }}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.infoCardMinimal}>
              <ThemedText type="title" style={styles.title}>{restaurant.name}</ThemedText>
              <View style={styles.infoRowMinimal}>
                <Ionicons name="school-outline" size={16} color={iconColor} style={styles.icon} />
                <ThemedText style={styles.instituteText}>{
                  (config.institutes?.find(inst => inst._id === restaurant.institute)?.name) || restaurant.institute
                }</ThemedText>
              </View>
              <View style={styles.infoRowMinimal}>
                <Ionicons name="location-outline" size={14} color={iconColor} style={styles.icon} />
                <ThemedText style={styles.locationText}>{restaurant.location}</ThemedText>
              </View>
            </View>

            <View style={{ flexDirection: width > 600 ? 'row' : 'column', marginHorizontal: 20, marginTop: 14, gap: 20 }}>


              {/* Opening Hours Section */}
              <View style={{ flex: 1, backgroundColor: cardBg, padding: 12 }}>
                <ThemedText type="subtitle" style={[styles.sectionTitle, { marginBottom: 5 }]}>Opening Hours</ThemedText>
                {Object.entries(restaurant.openingHours as OpeningHours).map(([day, info]) => {
                  const infoTyped = info as OpeningHourDay;
                  // Convert 24-hour to 12-hour format with AM/PM
                  const formatTime = (hour: string | null) => {
                    if (hour === null) return '';
                    const h = parseInt(hour, 10);
                    const suffix = h >= 12 ? 'PM' : 'AM';
                    const hour12 = h % 12 === 0 ? 12 : h % 12;
                    return `${hour12}:00 ${suffix}`;
                  };
                  return (
                    <View key={day} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="time-outline" size={18} color={primary} style={{ marginRight: 8 }} />
                      <ThemedText style={{ fontWeight: '600', minWidth: 90, fontSize: 14 }}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </ThemedText>
                      <ThemedText style={{ marginLeft: 8, fontSize: 14, fontWeight: infoTyped.open ? '500' : '400', color: infoTyped.open ? textColor : '#d9534f' }}>
                        {infoTyped.open ? `${formatTime(infoTyped.start)} - ${formatTime(infoTyped.end)}` : 'Closed'}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>

              {/* Penalty Settings Section */}
              <View style={{ flex: 1, backgroundColor: cardBg, padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                  <ThemedText type="subtitle" style={[styles.sectionTitle, { marginBottom: 0 }]}>Penalty Settings</ThemedText>
                  <TouchableOpacity onPress={() => setPenaltyModalVisible(true)} activeOpacity={0.7}>
                    <Ionicons name="settings-outline" size={18} color={primary} style={{ padding: 2, borderRadius: 6, backgroundColor: 'transparent', opacity: 0.7 }} />
                  </TouchableOpacity>
                </View>
                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name={penaltySettings.enabled ? "checkmark-circle" : "close-circle"} size={18} color={penaltySettings.enabled ? "#4CAF50" : "#f44336"} style={{ marginRight: 8 }} />
                    <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                      Status: {penaltySettings.enabled ? 'Enabled' : 'Disabled'}
                    </ThemedText>
                  </View>
                  {penaltySettings.enabled && (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name="time-outline" size={16} color={primary} style={{ marginRight: 8 }} />
                        <ThemedText style={{ fontSize: 14 }}>
                          Time Threshold: {penaltySettings.timeThreshold} hours
                        </ThemedText>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name="cash-outline" size={16} color={primary} style={{ marginRight: 8 }} />
                        <ThemedText style={{ fontSize: 14 }}>
                          Penalty Rate: {penaltySettings.penaltyRate}%
                        </ThemedText>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name={penaltySettings.allowNegativeBalance ? "card-outline" : "card"} size={16} color={primary} style={{ marginRight: 8 }} />
                        <ThemedText style={{ fontSize: 14 }}>
                          Negative Balance: {penaltySettings.allowNegativeBalance ? 'Allowed' : 'Not Allowed'}
                        </ThemedText>
                      </View>
                    </>
                  )}
                </View>
              </View>

              <View style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 5 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: primary,
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                  onPress={() => {
                    if (restaurant) {
                      setForm({
                        name: restaurant.name || '',
                        institute: restaurant.institute || '',
                        location: restaurant.location || '',
                        banner: restaurant.banner || '',
                        logo: restaurant.logo || '',
                        openingHours: restaurant.openingHours || defaultForm.openingHours,
                      });
                      setIsCreating(false);
                    }
                    setModalVisible(true);
                  }}
                >
                  <ThemedText style={{ color: `${colorScheme === "light" ? "white" : "black"}`, fontSize: 14, fontWeight: '600' }}>Edit Basic Details</ThemedText>
                </TouchableOpacity>
              </View>

              {/* Cuisines Section */}
              <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 10, padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                  <ThemedText type="subtitle" style={[styles.sectionTitle, { marginBottom: 0 }]}>Cuisines</ThemedText>
                  <TouchableOpacity onPress={openCuisineModal} activeOpacity={0.7}>
                    <Ionicons name="create-outline" size={18} color={primary} style={{ padding: 2, borderRadius: 6, backgroundColor: 'transparent', opacity: 0.7 }} />
                  </TouchableOpacity>
                </View>
                <View>
                  {cuisine.map((item) => (
                    <View key={item._id} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 4 }}>
                      <Ionicons name="restaurant-outline" size={16} color={primary} style={{ marginRight: 10 }} />
                      <ThemedText style={{ color: textColor, fontSize: 15 }}>{item.name}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}

        {/* Modal for editing/creating basic details */}
        {/* // Replace your existing Modal section with this improved version */}

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setModalVisible(false);
            setIsCreating(false);
          }}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.25)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* Make the modal container take more space and improve layout */}
            <View style={{
              width: '92%',
              // maxHeight: '85%', // Limit height to prevent overflow
              minHeight: '85%',
              backgroundColor: cardBg,
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 12,
              overflow: 'hidden' // Important: prevent content overflow
            }}>
              {/* Header with close icon - Keep this fixed */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 18,
                borderBottomWidth: 1,
                borderBottomColor: colorScheme === 'light' ? '#eee' : '#222',
                backgroundColor: cardBg, // Ensure header has background
                zIndex: 1 // Keep header above scroll content
              }}>
                <ThemedText type="title" style={{ fontSize: 20, fontWeight: '700' }}>
                  {isCreating ? 'Create Restaurant' : 'Edit Basic Details'}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setIsCreating(false);
                  }}
                  style={{
                    padding: 4,
                    borderRadius: 16,
                    backgroundColor: colorScheme === 'light' ? '#f3f3f3' : '#232323'
                  }}
                >
                  <Ionicons name="close" size={22} color={iconColor} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Content - Improved ScrollView */}
              <ScrollView
                style={{
                  flex: 1, // Take remaining space
                  paddingHorizontal: 20,
                  paddingTop: 18
                }}
                contentContainerStyle={{
                  paddingBottom: 20,
                  flexGrow: 1 // Ensure content can grow
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                scrollEventThrottle={16} // Smooth scroll events
                bounces={true} // iOS bounce effect
                overScrollMode="auto" // Android over-scroll
                nestedScrollEnabled={true} // Important for nested scrolling
                keyboardDismissMode="on-drag" // Dismiss keyboard when scrolling
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                  <View>
                    {/* Name input */}
                    <ThemedText style={{ marginBottom: 6, fontWeight: '800', fontSize: 14 }}>Name</ThemedText>
                    <TextInput
                      value={form.name}
                      onChangeText={text => setForm(f => ({ ...f, name: text }))}
                      placeholder="Name"
                      placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#666'}
                      style={{
                        borderWidth: 1,
                        borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                        borderRadius: 6,
                        marginBottom: 14,
                        padding: 10,
                        color: textColor,
                        fontSize: 14,
                        backgroundColor: colorScheme === 'light' ? '#fafbfc' : '#232323'
                      }}
                    />

                    {/* Institute combobox */}
                    <ThemedText style={{ marginBottom: 6, fontWeight: '800', fontSize: 14 }}>Institute</ThemedText>
                    <View style={{
                      borderWidth: 1,
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                      borderRadius: 6,
                      marginBottom: 14,
                      backgroundColor: colorScheme === 'light' ? '#fafbfc' : '#232323'
                    }}>
                      <Picker
                        selectedValue={form.institute}
                        onValueChange={value => setForm(f => ({ ...f, institute: value }))}
                        style={{ color: textColor, height: 48, fontSize: 14 }}
                        dropdownIconColor={textColor}
                      >
                        <Picker.Item label="Select Institute" value="" style={{ fontSize: 14 }} />
                        {config.institutes && config.institutes.map((inst) => (
                          <Picker.Item key={inst._id} label={inst.name} value={inst._id} style={{ fontSize: 14 }} />
                        ))}
                      </Picker>
                    </View>

                    {/* Location input */}
                    <ThemedText style={{ marginBottom: 6, fontWeight: '800', fontSize: 14 }}>Location</ThemedText>
                    <TextInput
                      value={form.location}
                      onChangeText={text => setForm(f => ({ ...f, location: text }))}
                      placeholder="Location"
                      placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#666'}
                      style={{
                        borderWidth: 1,
                        borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                        borderRadius: 6,
                        marginBottom: 14,
                        padding: 10,
                        color: textColor,
                        fontSize: 14,
                        backgroundColor: colorScheme === 'light' ? '#fafbfc' : '#232323'
                      }}
                    />

                    {/* Banner image picker */}
                    <ThemedText style={{ marginBottom: 6, fontWeight: '800', fontSize: 14 }}>Banner Image (16:9)</ThemedText>
                    <TouchableOpacity
                      onPress={pickBannerImage}
                      style={{
                        borderWidth: 1,
                        borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                        borderRadius: 6,
                        marginBottom: 14,
                        padding: 10,
                        alignItems: 'center',
                        backgroundColor: colorScheme === 'light' ? '#fafbfc' : '#232323'
                      }}
                      disabled={uploadingBanner}
                      activeOpacity={0.7}
                    >
                      {uploadingBanner ? (
                        <ActivityIndicator color={primary} />
                      ) : (
                        <>
                          {form.banner ? (
                            <Image
                              source={{ uri: form.banner }}
                              style={{
                                width: '100%',
                                aspectRatio: 16 / 9,
                                borderRadius: 6,
                                marginBottom: 6
                              }}
                              resizeMode="cover"
                            />
                          ) : null}
                          <ThemedText style={{ color: primary, fontSize: 13 }}>
                            {form.banner ? 'Change Banner' : 'Select Banner'}
                          </ThemedText>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Logo image picker */}
                    <ThemedText style={{ marginBottom: 6, fontWeight: '800', fontSize: 14 }}>Logo Image (1:1)</ThemedText>
                    <TouchableOpacity
                      onPress={pickLogoImage}
                      style={{
                        borderWidth: 1,
                        borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                        borderRadius: 6,
                        marginBottom: 14,
                        padding: 10,
                        alignItems: 'center',
                        backgroundColor: colorScheme === 'light' ? '#fafbfc' : '#232323'
                      }}
                      disabled={uploadingLogo}
                      activeOpacity={0.7}
                    >
                      {uploadingLogo ? (
                        <ActivityIndicator color={primary} />
                      ) : (
                        <>
                          {form.logo ? (
                            <Image
                              source={{ uri: form.logo }}
                              style={{
                                width: 80,
                                height: 80,
                                borderRadius: 16,
                                marginBottom: 6
                              }}
                              resizeMode="cover"
                            />
                          ) : null}
                          <ThemedText style={{ color: primary, fontSize: 13 }}>
                            {form.logo ? 'Change Logo' : 'Select Logo'}
                          </ThemedText>
                        </>
                      )}
                    </TouchableOpacity>

                    <View style={{
                      height: 1,
                      backgroundColor: colorScheme === 'light' ? '#eee' : '#222',
                      marginVertical: 16
                    }} />

                    {/* Opening Hours Edit Section */}
                    <ThemedText style={{ marginBottom: 10, fontWeight: '800', fontSize: 14 }}>Opening Hours</ThemedText>
                    {Object.entries(form.openingHours).map(([day, info]) => {
                      const infoTyped = info;
                      const dayKey = day;
                      const dayErrors = timeErrors[day] || {};

                      return (
                        <View key={day} style={{
                          marginBottom: 18,
                          borderBottomWidth: 1,
                          borderBottomColor: colorScheme === 'light' ? '#eee' : '#222',
                          paddingBottom: 10
                        }}>
                          {/* Row 1: Day Name */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <ThemedText style={{ fontWeight: '700', fontSize: 15, color: textColor }}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </ThemedText>
                          </View>

                          {/* Row 2: Edit Controls */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 6 }}>
                            {/* Open/Closed Checkbox */}
                            <TouchableOpacity
                              onPress={() => setForm(f => ({
                                ...f,
                                openingHours: {
                                  ...f.openingHours,
                                  [dayKey]: { ...f.openingHours[dayKey], open: !f.openingHours[dayKey].open }
                                }
                              }))}
                              style={{ marginRight: 10 }}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={infoTyped.open ? 'checkbox-outline' : 'square-outline'}
                                size={22}
                                color={primary}
                              />
                            </TouchableOpacity>

                            {/* Start Time Input (24h) */}
                            <View style={{ alignItems: 'center' }}>
                              <TextInput
                                value={infoTyped.start ? String(infoTyped.start) : ''}
                                onChangeText={text => handleTimeChange(day, 'start', text)}
                                placeholder="Start"
                                placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#666'}
                                style={{
                                  borderWidth: 1,
                                  borderColor: dayErrors.start ? '#d9534f' : (colorScheme === 'light' ? '#e0e0e0' : '#333'),
                                  borderRadius: 6,
                                  padding: 6,
                                  color: textColor,
                                  fontSize: 13,
                                  width: 50,
                                  backgroundColor: colorScheme === 'light' ? '#fafbfc' : '#232323',
                                  opacity: infoTyped.open ? 1 : 0.5,
                                  textAlign: 'center'
                                }}
                                editable={infoTyped.open}
                                keyboardType="numeric"
                                maxLength={2}
                              />
                              {dayErrors.start && (
                                <ThemedText style={{ fontSize: 10, color: '#d9534f', marginTop: 2 }}>
                                  {dayErrors.start}
                                </ThemedText>
                              )}
                            </View>

                            <ThemedText style={{ marginHorizontal: 2, fontSize: 13 }}>-</ThemedText>

                            {/* End Time Input (24h) */}
                            <View style={{ alignItems: 'center' }}>
                              <TextInput
                                value={infoTyped.end ? String(infoTyped.end) : ''}
                                onChangeText={text => handleTimeChange(day, 'end', text)}
                                placeholder="End"
                                placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#666'}
                                style={{
                                  borderWidth: 1,
                                  borderColor: dayErrors.end ? '#d9534f' : (colorScheme === 'light' ? '#e0e0e0' : '#333'),
                                  borderRadius: 6,
                                  padding: 6,
                                  color: textColor,
                                  fontSize: 13,
                                  width: 50,
                                  backgroundColor: colorScheme === 'light' ? '#fafbfc' : '#232323',
                                  opacity: infoTyped.open ? 1 : 0.5,
                                  textAlign: 'center'
                                }}
                                editable={infoTyped.open}
                                keyboardType="numeric"
                                maxLength={2}
                              />
                              {dayErrors.end && (
                                <ThemedText style={{ fontSize: 10, color: '#d9534f', marginTop: 2 }}>
                                  {dayErrors.end}
                                </ThemedText>
                              )}
                            </View>

                            {!infoTyped.open && (
                              <ThemedText style={{
                                marginLeft: 12,
                                color: '#d9534f',
                                fontSize: 13,
                                fontWeight: '600'
                              }}>
                                Closed
                              </ThemedText>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </TouchableWithoutFeedback>
              </ScrollView>

              {/* Fixed Footer with buttons */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 10,
                paddingHorizontal: 20,
                paddingVertical: 18,
                borderTopWidth: 1,
                borderTopColor: colorScheme === 'light' ? '#eee' : '#222',
                backgroundColor: cardBg // Ensure footer has background
              }}>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setIsCreating(false);
                  }}
                  style={{
                    backgroundColor: colorScheme === 'light' ? '#f3f3f3' : '#232323',
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText style={{ color: iconColor, fontWeight: '600', fontSize: 16 }}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    // Your existing save logic here...
                    const missingHours = Object.entries(form.openingHours).find(
                      ([, info]) => info.open && (!info.start || !info.end)
                    );
                    if (missingHours) {
                      alert(`Please fill both start and end hour for all open days (${missingHours[0]})`);
                      return;
                    }

                    if (isCreating) {
                      axios.post('https://ourcanteennbackend.vercel.app/api/owner/myres', {
                        name: form.name,
                        institute: form.institute,
                        location: form.location,
                        banner: form.banner,
                        logo: form.logo,
                        openingHours: form.openingHours,
                      }, {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      })
                        .then(res => {
                          setRestaurant(res.data);
                          setModalVisible(false);
                          setIsCreating(false);
                        })
                        .catch(err => {
                          if (err.response && err.response.data && err.response.data.message) {
                            alert(err.response.data.message);
                          } else if (err.response && err.response.status === 403) {
                            logout();
                            router.replace('/(auth)/signin');
                          } else {
                            alert('Failed to create restaurant');
                          }
                        });
                    } else {
                      axios.put('https://ourcanteennbackend.vercel.app/api/owner/myres', {
                        name: form.name,
                        institute: form.institute,
                        location: form.location,
                        banner: form.banner,
                        logo: form.logo,
                        openingHours: form.openingHours,
                      }, {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      })
                        .then(res => {
                          setRestaurant(res.data);
                          setModalVisible(false);
                        })
                        .catch(err => {
                          if (err.response && err.response.data && err.response.data.message) {
                            alert(err.response.data.message);
                          } else if (err.response && err.response.status === 403) {
                            logout();
                            router.replace('/(auth)/signin');
                          } else {
                            alert('Failed to update restaurant');
                          }
                        });
                    }
                  }}
                  style={{
                    backgroundColor: primary,
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 22,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText style={{
                    color: colorScheme === 'light' ? '#fff' : '#18181b',
                    fontWeight: '600',
                    fontSize: 16
                  }}>
                    {isCreating ? 'Create' : 'Save'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Cuisine Selection Modal */}
        <Modal
          visible={cuisineModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCuisineModalVisible(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.25)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <View style={{
              width: '90%',
              minHeight: '80%',
              backgroundColor: cardBg,
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 12,
              overflow: 'hidden'
            }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 18,
                borderBottomWidth: 1,
                borderBottomColor: colorScheme === 'light' ? '#eee' : '#222',
                backgroundColor: cardBg,
                zIndex: 1
              }}>
                <ThemedText type="title" style={{ fontSize: 20, fontWeight: '700' }}>
                  Select Cuisines
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setCuisineModalVisible(false)}
                  style={{
                    padding: 4,
                    borderRadius: 16,
                    backgroundColor: colorScheme === 'light' ? '#f3f3f3' : '#232323'
                  }}
                >
                  <Ionicons name="close" size={22} color={iconColor} />
                </TouchableOpacity>
              </View>

              {/* Cuisine List */}
              <ScrollView
                style={{
                  flex: 1,
                  paddingHorizontal: 20,
                  paddingTop: 18
                }}
                contentContainerStyle={{
                  paddingBottom: 20
                }}
                showsVerticalScrollIndicator={true}
              >
                {configLoading ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                    <ActivityIndicator size="large" color={primary} />
                    <ThemedText style={{ marginTop: 10, color: textColor, opacity: 0.7 }}>
                      Loading cuisines...
                    </ThemedText>
                  </View>
                ) : config.cuisines.length === 0 ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                    <Ionicons name="restaurant-outline" size={48} color={iconColor} style={{ opacity: 0.5 }} />
                    <ThemedText style={{ marginTop: 10, color: textColor, opacity: 0.7 }}>
                      No cuisines available
                    </ThemedText>
                  </View>
                ) : (
                  config.cuisines.map((cuisineItem) => {
                    const isSelected = selectedCuisines.includes(cuisineItem._id);
                    return (
                      <TouchableOpacity
                        key={cuisineItem._id}
                        onPress={() => handleCuisineToggle(cuisineItem._id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 16,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          marginBottom: 8,
                          backgroundColor: isSelected
                            ? (colorScheme === 'light' ? '#f0f8ff' : '#1a3a5f')
                            : (colorScheme === 'light' ? '#fafbfc' : '#232323'),
                          borderWidth: 1,
                          borderColor: isSelected
                            ? primary
                            : (colorScheme === 'light' ? '#e0e0e0' : '#333'),
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: isSelected ? primary : (colorScheme === 'light' ? '#ccc' : '#555'),
                          backgroundColor: isSelected ? primary : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12
                        }}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color={colorScheme === 'light' ? '#fff' : '#18181b'} />
                          )}
                        </View>
                        <Ionicons
                          name="restaurant-outline"
                          size={20}
                          color={isSelected ? primary : iconColor}
                          style={{ marginRight: 12 }}
                        />
                        <ThemedText style={{
                          color: textColor,
                          fontSize: 16,
                          fontWeight: isSelected ? '600' : '400'
                        }}>
                          {cuisineItem.name}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Custom Cuisines Section */}
              <View style={{
                borderTopWidth: 1,
                borderTopColor: colorScheme === 'light' ? '#eee' : '#222',
                paddingHorizontal: 20,
                paddingTop: 18,
                paddingBottom: 10
              }}>
                <ThemedText type="subtitle" style={{
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 12,
                  color: textColor
                }}>
                  Add Custom Cuisines
                </ThemedText>

                {/* Add new custom cuisine */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  gap: 8
                }}>
                  <TextInput
                    value={newCustomCuisine}
                    onChangeText={setNewCustomCuisine}
                    placeholder="Enter cuisine name..."
                    placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#666'}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                      borderRadius: 8,
                      padding: 10,
                      color: textColor,
                      fontSize: 14,
                      backgroundColor: colorScheme === 'light' ? '#fafbfc' : '#232323'
                    }}
                    onSubmitEditing={addCustomCuisine}
                  />
                  <TouchableOpacity
                    onPress={addCustomCuisine}
                    style={{
                      backgroundColor: primary,
                      borderRadius: 8,
                      padding: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 44
                    }}
                    activeOpacity={0.7}
                    disabled={!newCustomCuisine.trim()}
                  >
                    <Ionicons name="add" size={20} color={colorScheme === 'light' ? '#fff' : '#18181b'} />
                  </TouchableOpacity>
                </View>

                {/* Display existing custom cuisines */}
                {customCuisines.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <ThemedText style={{
                      fontSize: 14,
                      fontWeight: '600',
                      marginBottom: 8,
                      color: textColor,
                      opacity: 0.8
                    }}>
                      Custom Cuisines ({customCuisines.length}):
                    </ThemedText>
                    {customCuisines.map((cuisineName, index) => (
                      <View key={index} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        marginBottom: 6,
                        backgroundColor: colorScheme === 'light' ? '#f0f8ff' : '#1a3a5f',
                        borderWidth: 1,
                        borderColor: primary,
                      }}>
                        <Ionicons
                          name="restaurant-outline"
                          size={16}
                          color={primary}
                          style={{ marginRight: 10 }}
                        />
                        <ThemedText style={{
                          color: textColor,
                          fontSize: 14,
                          fontWeight: '500',
                          flex: 1
                        }}>
                          {cuisineName}
                        </ThemedText>
                        <TouchableOpacity
                          onPress={() => removeCustomCuisine(index)}
                          style={{
                            padding: 4,
                            borderRadius: 12,
                            backgroundColor: colorScheme === 'light' ? '#ffebee' : '#4a1c1c'
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={16} color="#d32f2f" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 18,
                borderTopWidth: 1,
                borderTopColor: colorScheme === 'light' ? '#eee' : '#222',
                backgroundColor: cardBg
              }}>
                <TouchableOpacity
                  onPress={() => setCuisineModalVisible(false)}
                  style={{
                    backgroundColor: colorScheme === 'light' ? '#f3f3f3' : '#232323',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText style={{ color: iconColor, fontWeight: '600', fontSize: 16 }}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveCuisineSelection}
                  style={{
                    backgroundColor: savingCuisines ? (colorScheme === 'light' ? '#ccc' : '#555') : primary,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  activeOpacity={0.7}
                  disabled={savingCuisines}
                >
                  {savingCuisines ? (
                    <ActivityIndicator size="small" color={colorScheme === 'light' ? '#fff' : '#18181b'} />
                  ) : (
                    <ThemedText style={{
                      color: colorScheme === 'light' ? '#fff' : '#18181b',
                      fontWeight: '600',
                      fontSize: 16
                    }}>
                      Save ({selectedCuisines.length + customCuisines.length})
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Penalty Settings Modal */}
        <Modal
          visible={penaltyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPenaltyModalVisible(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              width: '100%',
              maxWidth: 400,
              height: '90%',
              backgroundColor: cardBg,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: colorScheme === 'light' ? '#eee' : '#222',
                backgroundColor: cardBg,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16
              }}>
                <ThemedText type="title" style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: textColor,
                  flex: 1,
                  textAlign: 'center'
                }}>
                  Penalty Settings
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setPenaltyModalVisible(false)}
                  style={{
                    padding: 4,
                    borderRadius: 16,
                    backgroundColor: colorScheme === 'light' ? '#f3f3f3' : '#232323'
                  }}
                >
                  <Ionicons name="close" size={20} color={iconColor} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={{ flex: 1, backgroundColor: cardBg }}
                contentContainerStyle={{ 
                  paddingHorizontal: 20, 
                  paddingTop: 18, 
                  paddingBottom: 20,
                  flexGrow: 1 
                }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {/* Enable/Disable Penalty */}
                <View style={{ marginBottom: 24, backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#1a1a1a', borderRadius: 8, padding: 16 }}>
                  <ThemedText style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: textColor }}>
                    Penalty System
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setPenaltySettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#232323',
                      borderWidth: 1,
                      borderColor: penaltySettings.enabled ? primary : (colorScheme === 'light' ? '#e0e0e0' : '#333')
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={penaltySettings.enabled ? "checkmark-circle" : "ellipse-outline"} 
                      size={24} 
                      color={penaltySettings.enabled ? "#4CAF50" : (colorScheme === 'light' ? '#ccc' : '#555')} 
                      style={{ marginRight: 12 }} 
                    />
                    <ThemedText style={{ fontSize: 16, color: textColor }}>
                      {penaltySettings.enabled ? 'Enabled' : 'Disabled'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {penaltySettings.enabled && (
                  <>
                    {/* Penalty Rate */}
                    <View style={{ marginBottom: 24, backgroundColor: colorScheme === 'light' ? '#f0f8ff' : '#1a2332', borderRadius: 8, padding: 16 }}>
                      <ThemedText style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: textColor }}>
                        Penalty Rate (%)
                      </ThemedText>
                      <ThemedText style={{ fontSize: 14, color: iconColor, marginBottom: 12 }}>
                        Percentage of order total to charge as penalty
                      </ThemedText>
                      <TextInput
                        value={penaltySettings.penaltyRate.toString()}
                        onChangeText={(text) => {
                          const value = parseFloat(text) || 0;
                          setPenaltySettings(prev => ({ ...prev, penaltyRate: Math.min(100, Math.max(0, value)) }));
                        }}
                        placeholder="10"
                        placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#666'}
                        style={{
                          borderWidth: 1,
                          borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                          borderRadius: 8,
                          padding: 12,
                          color: textColor,
                          fontSize: 16,
                          backgroundColor: colorScheme === 'light' ? '#fafbfc' : '#232323'
                        }}
                        keyboardType="numeric"
                      />
                    </View>

                    {/* Time Threshold */}
                    <View style={{ marginBottom: 24, backgroundColor: colorScheme === 'light' ? '#fff8f0' : '#2d1f0a', borderRadius: 8, padding: 16 }}>
                      <ThemedText style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: textColor }}>
                        Time Threshold (Hours)
                      </ThemedText>
                      <ThemedText style={{ fontSize: 14, color: iconColor, marginBottom: 12 }}>
                        Orders cancelled within this time will incur penalty
                      </ThemedText>
                      <TextInput
                        value={penaltySettings.timeThreshold.toString()}
                        onChangeText={(text) => {
                          const value = parseFloat(text) || 0;
                          setPenaltySettings(prev => ({ ...prev, timeThreshold: Math.min(48, Math.max(0, value)) }));
                        }}
                        placeholder="6"
                        placeholderTextColor={colorScheme === 'light' ? '#aaa' : '#666'}
                        style={{
                          borderWidth: 1,
                          borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333',
                          borderRadius: 8,
                          padding: 12,
                          color: textColor,
                          fontSize: 16,
                          backgroundColor: colorScheme === 'light' ? '#fafbfc' : '#232323'
                        }}
                        keyboardType="numeric"
                      />
                    </View>

                    {/* Allow Negative Balance */}
                    <View style={{ marginBottom: 24, backgroundColor: colorScheme === 'light' ? '#f0fff4' : '#0a2d0f', borderRadius: 8, padding: 16 }}>
                      <ThemedText style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: textColor }}>
                        Negative Balance
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => setPenaltySettings(prev => ({ ...prev, allowNegativeBalance: !prev.allowNegativeBalance }))}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#232323',
                          borderWidth: 1,
                          borderColor: penaltySettings.allowNegativeBalance ? primary : (colorScheme === 'light' ? '#e0e0e0' : '#333')
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={penaltySettings.allowNegativeBalance ? "checkmark-circle" : "ellipse-outline"} 
                          size={24} 
                          color={penaltySettings.allowNegativeBalance ? "#4CAF50" : (colorScheme === 'light' ? '#ccc' : '#555')} 
                          style={{ marginRight: 12 }} 
                        />
                        <View style={{ flex: 1 }}>
                          <ThemedText style={{ fontSize: 16, color: textColor, marginBottom: 2 }}>
                            {penaltySettings.allowNegativeBalance ? 'Allow Negative Balance' : 'Prevent Negative Balance'}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 13, color: iconColor }}>
                            {penaltySettings.allowNegativeBalance 
                              ? 'Users can go negative when penalty exceeds credit'
                              : 'Penalty limited to available credit only'
                            }
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Footer */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 10,
                paddingHorizontal: 20,
                paddingVertical: 18,
                borderTopWidth: 1,
                borderTopColor: colorScheme === 'light' ? '#eee' : '#222',
                backgroundColor: cardBg,
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16
              }}>
                <TouchableOpacity
                  onPress={() => setPenaltyModalVisible(false)}
                  style={{
                    backgroundColor: colorScheme === 'light' ? '#f3f3f3' : '#232323',
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText style={{ color: iconColor, fontWeight: '600', fontSize: 16 }}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={savePenaltySettings}
                  style={{
                    backgroundColor: primary,
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: savingPenalty ? 0.7 : 1
                  }}
                  activeOpacity={0.7}
                  disabled={savingPenalty}
                >
                  {savingPenalty ? (
                    <ActivityIndicator size="small" color={colorScheme === 'light' ? '#fff' : '#18181b'} />
                  ) : (
                    <ThemedText style={{ color: colorScheme === 'light' ? '#fff' : '#18181b', fontWeight: '600', fontSize: 16 }}>
                      Save
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: height,
    marginBottom: 10,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  logoContainer: {
    position: 'absolute',
    bottom: -50,
    left: width / 2 - 50,
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  infoCardMinimal: {
    marginTop: 50,
    marginBottom: 8,
    marginHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 0,
  },
  infoRowMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 0,
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
  },
  instituteText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.85,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.7,
    marginLeft: 2,
  },
  ctaButton: {
    marginTop: 20,
    marginHorizontal: 60,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 15,
    marginBottom: 2,
  },
});
