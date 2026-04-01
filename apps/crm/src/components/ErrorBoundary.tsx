import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: any) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.msg}>{this.state.error?.message}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => this.setState({ hasError: false, error: undefined })}>
            <Text style={styles.btnTxt}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#1a1008' },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#c9a84c', marginBottom: 8 },
  msg: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: '#c9a84c', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnTxt: { color: '#1a1008', fontWeight: '700', fontSize: 14 },
});
