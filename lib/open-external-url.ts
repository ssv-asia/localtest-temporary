import { Alert, Linking, Platform } from 'react-native';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

/** Open public web/email links without leaving rejected iOS URL promises unhandled. */
export async function openExternalUrl(url: string, label = 'link'): Promise<boolean> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'mailto:') {
      throw new Error('Unsupported external URL protocol');
    }

    if (Platform.OS === 'ios' && parsed.protocol === 'https:') {
      await openBrowserAsync(parsed.toString(), {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    } else {
      await Linking.openURL(parsed.toString());
    }
    return true;
  } catch (error) {
    console.warn(`[ExternalLink] Failed to open ${label}`, error);
    Alert.alert(
      `Unable to open ${label}`,
      'Check your connection and try again. You can also contact mail@ssv.asia for help.',
    );
    return false;
  }
}
