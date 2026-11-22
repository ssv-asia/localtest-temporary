import { useEffect, useRef } from 'react';
import { Animated, Easing, Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Android's edge-to-edge window does not resize for the IME, so keep the
// APK-tested explicit offset there. iOS uses KeyboardAvoidingView in the route.
export function useAgentKeyboardPadding() {
  const insets = useSafeAreaInsets();
  const padding = useRef(new Animated.Value(Platform.OS === 'ios' ? 0 : insets.bottom)).current;

  useEffect(() => {
    // Browser viewports already resize for the on-screen keyboard. Applying the
    // native IME offset there lifts the entire chat a second time.
    if (Platform.OS === 'web') {
      padding.setValue(0);
      return;
    }
    if (Platform.OS === 'ios') {
      padding.setValue(0);
      return;
    }
    const updateKeyboardFrame = (event: { endCoordinates: { height: number } }) => {
      const height = event.endCoordinates.height + insets.bottom;
      padding.stopAnimation();
      Animated.timing(padding, {
        toValue: Math.max(0, height), duration: 180, easing: Easing.out(Easing.cubic),
        isInteraction: false, useNativeDriver: false,
      }).start();
    };
    const show = Keyboard.addListener('keyboardDidShow', updateKeyboardFrame);
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      padding.stopAnimation();
      Animated.timing(padding, {
        toValue: Platform.OS === 'ios' ? 0 : insets.bottom, duration: 160, easing: Easing.out(Easing.cubic),
        isInteraction: false, useNativeDriver: false,
      }).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, [insets.bottom, padding]);

  return padding;
}
