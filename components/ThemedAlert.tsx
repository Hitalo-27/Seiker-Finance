import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { CheckCircle, AlertCircle } from 'lucide-react-native';

interface ThemedAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function ThemedAlert({ visible, title, message, type = 'info', onClose }: ThemedAlertProps) {
  const { theme: themeMode } = useTheme();
  const theme = Colors[themeMode as keyof typeof Colors];

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.alertContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          <View style={styles.iconContainer}>
            {type === 'success' && <CheckCircle color={theme.primary} size={48} />}
            {type === 'error' && <AlertCircle color={theme.error} size={48} />}
            {type === 'info' && <AlertCircle color={theme.secondary} size={48} />}
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.secondary }]}>{message}</Text>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]} 
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: theme.background }]}>ENTENDIDO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 30,
  },
  alertContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  iconContainer: { marginBottom: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 2,
  },
});