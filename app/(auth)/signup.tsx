import { useAuth } from '@/context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const institutions = [
  { id: "111", name: "University of Dhaka(DU)" },
  { id: "112", name: "University of Rajshahi(RU)" },
  { id: "113", name: "Rangpur Medical College(RpMC)" },
];

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { setAuth } = useAuth();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '8801',
    institute: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    institute: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  });

  // Make serializePhoneNumber available throughout the component
  const serializePhoneNumber = (phoneNumber: string) => {
    return phoneNumber.replace(/\D/g, "").slice(0, 13);
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      phoneNumber: '',
      institute: '',
      studentId: '',
      password: '',
      confirmPassword: '',
    };

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone number validation
    const serializedPhone = serializePhoneNumber(formData.phoneNumber);
    if (!serializedPhone) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^8801\d{9}$/.test(serializedPhone)) {
      newErrors.phoneNumber = 'Phone number must start with 8801 and be exactly 13 digits.';
    }

    // Institute validation
    if (!formData.institute) {
      newErrors.institute = 'Please select an institution';
    }

    // Student ID validation
    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('https://ourcanteennbackend.vercel.app/api/auth/signup', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        institute: formData.institute,
        studentId: formData.studentId.trim(),
        password: formData.password,
      });

      console.log("Login response:", response.data);

      if (response.data.token && response.data.user) {

        setAuth({ user: response.data.user, token: response.data.token });

        router.replace("/");

      }

    } catch (error: any) {
      // console.error('Signup error:', error.response.data);
      let errorMessage = 'Something went wrong. Please try again.';
      if (error.response?.status === 409) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your validation error and try again.';
      }

      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Join OurCanteen and start ordering delicious meals
            </Text>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                    color: colors.text,
                    borderColor: errors.name ? '#FF6B6B' : 'transparent'
                  }
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={colors.icon}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                autoCapitalize="words"
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                    color: colors.text,
                    borderColor: errors.email ? '#FF6B6B' : 'transparent'
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={colors.icon}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                    color: colors.text,
                    borderColor: errors.phoneNumber ? '#FF6B6B' : 'transparent'
                  }
                ]}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.icon}
                value={formData.phoneNumber}
                onChangeText={value => updateFormData('phoneNumber', serializePhoneNumber(value))}
                keyboardType="phone-pad"
              />
              {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
            </View>

            {/* Institute Picker */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Institution</Text>
              <View style={[
                styles.pickerContainer,
                {
                  backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                  borderColor: errors.institute ? '#FF6B6B' : 'transparent'
                }
              ]}>
                <Picker
                  selectedValue={formData.institute}
                  onValueChange={(value) => updateFormData('institute', value)}
                  style={[styles.picker, { color: colors.text }]}
                  dropdownIconColor={colors.text}
                >
                  <Picker.Item label="Select your institution" value="" style={{ fontSize: 14 }} />
                  {institutions.map((institution) => (
                    <Picker.Item
                      style={{ fontSize: 14 }}
                      key={institution.id}
                      label={institution.name}
                      value={institution.id}
                    />
                  ))}
                </Picker>
              </View>
              {errors.institute ? <Text style={styles.errorText}>{errors.institute}</Text> : null}
            </View>

            {/* Student ID Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Student ID</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                    color: colors.text,
                    borderColor: errors.studentId ? '#FF6B6B' : 'transparent'
                  }
                ]}
                placeholder="Enter your student ID"
                placeholderTextColor={colors.icon}
                value={formData.studentId}
                onChangeText={(value) => updateFormData('studentId', value)}
                autoCapitalize="none"
              />
              {errors.studentId ? <Text style={styles.errorText}>{errors.studentId}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                    color: colors.text,
                    borderColor: errors.password ? '#FF6B6B' : 'transparent'
                  }
                ]}
                placeholder="Enter your password"
                placeholderTextColor={colors.icon}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry
              />
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                    color: colors.text,
                    borderColor: errors.confirmPassword ? '#FF6B6B' : 'transparent'
                  }
                ]}
                placeholder="Confirm your password"
                placeholderTextColor={colors.icon}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry
              />
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                styles.signupButton,
                { backgroundColor: colors.tint },
                loading && styles.disabledButton
              ]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.signupButtonText, { color: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5' }]}>Create Account</Text>

              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <View style={styles.signinContainer}>
              <Text style={[styles.signinText, { color: colors.icon }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/signin')}>
                <Text style={[styles.signinLink, { color: colors.tint }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  pickerContainer: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  signupButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom: 20,
  },
  signinText: {
    fontSize: 14,
  },
  signinLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});
