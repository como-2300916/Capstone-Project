import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const THEME_STORAGE_KEY = 'aquaguard-theme-mode';

const palettes = {
  light: {
    background: '#F1F6F8',
    surface: '#FFFFFF',
    text: '#152D3A',
    muted: '#425B69',
    border: '#D4E0E6',
    teal: '#087F82',
    accent: '#087F82',
    aqua: '#087F82',
    amber: '#FFB300',
    amberFill: 'rgba(255,179,0,0.22)',
    safe: '#16834A',
    caution: '#B85C00',
    danger: '#B4232F',
    inputBackground: '#FFFFFF',
    inputBorder: '#A8BBC5',
  },
  dark: {
    background: '#101B20',
    surface: '#19292F',
    text: '#F2F7F8',
    muted: '#B5C7CD',
    border: '#344B52',
    teal: '#087F82',
    accent: '#67DED3',
    aqua: '#67DED3',
    amber: '#FFC247',
    amberFill: 'rgba(255,194,71,0.22)',
    safe: '#57CC84',
    caution: '#FFC15C',
    danger: '#FF777F',
    inputBackground: '#22363D',
    inputBorder: '#587079',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedMode) => {
        setMode(savedMode === 'dark' ? 'dark' : 'light');
      })
      .catch(() => {});
  }, []);

  const changeMode = useCallback(async (nextMode) => {
    const selectedMode = nextMode === 'dark' ? 'dark' : 'light';
    setMode(selectedMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, selectedMode);
    } catch {
      // Keep the selection for this session even if storage is unavailable.
    }
  }, []);

  const resolvedMode = mode === 'dark' ? 'dark' : 'light';
  const colors = palettes[resolvedMode] || palettes.light;
  useEffect(() => {
    Appearance.setColorScheme(resolvedMode);
  }, [resolvedMode]);

  const value = useMemo(
    () => ({ mode, resolvedMode, colors, setMode: changeMode }),
    [mode, resolvedMode, colors, changeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider.');
  return value;
}

export function useThemeStyles(createStyles) {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
}
