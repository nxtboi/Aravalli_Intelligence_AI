import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeConfig {
  primary: string;
  background: string;
  text: string;
  radius: string;
}

interface FeaturesConfig {
  showChatbot: boolean;
  showSuggestions: boolean;
  showHistory: boolean;
  showMap: boolean;
}

interface ContentConfig {
  appName: string;
  welcomeMessage: string;
}

interface GlobalConfig {
  theme: ThemeConfig;
  features: FeaturesConfig;
  content: ContentConfig;
}

const defaultConfig: GlobalConfig = {
  theme: {
    primary: '#10b981',
    background: '#fafafa',
    text: '#18181b',
    radius: '0.75rem',
  },
  features: {
    showChatbot: true,
    showSuggestions: true,
    showHistory: true,
    showMap: true
  },
  content: {
    appName: 'Aravalli Watch',
    welcomeMessage: 'Eco-Monitoring System'
  }
};

interface SettingsContextType {
  config: GlobalConfig;
  refreshConfig: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  config: defaultConfig,
  refreshConfig: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<GlobalConfig>(defaultConfig);

  const refreshConfig = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        // Apply CSS variables
        document.documentElement.style.setProperty('--color-primary', data.theme.primary);
        document.documentElement.style.setProperty('--color-bg', data.theme.background);
        document.documentElement.style.setProperty('--color-text', data.theme.text);
        document.documentElement.style.setProperty('--radius', data.theme.radius);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  return (
    <SettingsContext.Provider value={{ config, refreshConfig }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
