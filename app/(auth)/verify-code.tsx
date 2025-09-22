import { useColorScheme } from '@/hooks/useColorScheme';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
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

export default function VerifyCodeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    // Auto-focus first input
    inputRefs[0].current?.focus();
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const codeString = code.join('');
    
    if (codeString.length !== 4) {
      setError('Please enter the complete 4-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('https://ourcanteennbackend.vercel.app/api/auth/verify-reset-code', {
        email,
        code: codeString,
      });
      
      if (response.data.success) {
        // Navigate to reset password with the reset token
        router.push({
          pathname: '/(auth)/reset-password',
          params: { 
            email, 
            resetToken: response.data.resetToken 
          }
        });
      }
    } catch (error: any) {
      let errorMessage = 'Invalid code. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      await axios.post('https://ourcanteennbackend.vercel.app/api/auth/forgot-password', {
        email,
      });
      
      Alert.alert(
        'Code Resent',
        'A new verification code has been sent to your email address.',
        [{ text: 'OK' }]
      );
      setCode(['', '', '', '']);
      inputRefs[0].current?.focus();
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Failed to resend code. Please try again.'
      );
    } finally {
      setResending(false);
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
            <Text style={[styles.title, { color: colors.text }]}>Verify Code</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Enter the 4-digit code sent to{'\n'}
              <Text style={{ fontWeight: '600' }}>{email}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            {/* Code Input */}
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                      color: colors.text,
                      borderColor: error ? '#FF6B6B' : colors.tint,
                    },
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  editable={!loading}
                />
              ))}
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                { backgroundColor: colors.tint },
                loading && styles.disabledButton,
              ]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.verifyButtonText, { color: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5' }]}>
                  Verify Code
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend Code */}
            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: colors.icon }]}>
                Didn't receive the code?
              </Text>
              <TouchableOpacity onPress={handleResendCode} disabled={resending}>
                <Text style={[styles.resendLink, { color: colors.tint, opacity: resending ? 0.5 : 1 }]}>
                  {resending ? 'Resending...' : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Back Link */}
            <View style={styles.backContainer}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={[styles.backLink, { color: colors.tint }]}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  form: {
    flex: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  verifyButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 5,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  backLink: {
    fontSize: 14,
    fontWeight: '500',
  },
});
