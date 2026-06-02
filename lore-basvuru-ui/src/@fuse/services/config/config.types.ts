// Types
export type Scheme = 'auto' | 'dark' | 'light';
export type Screens = { [key: string]: string };
export type Theme = 'theme-default' | string;
export type Themes = { id: string; name: string }[];

/**
 * Header buttons configuration interface
 */
export interface HeaderButtons {
    showLanguages?: boolean;
    showFullscreen?: boolean;
    showSearch?: boolean;
    showShortcuts?: boolean;
    showMessages?: boolean;
    showNotifications?: boolean;
    showQuickChat?: boolean;
    showUser?: boolean;
    showSettings?: boolean;
    showProfilButton?: boolean;
}

/**
 * Settings panel visibility configuration
 */
export interface SettingsConfig {
    showTheme?: boolean;         // Tema seçici bölümü — default: true
    showScheme?: boolean;        // Scheme (light/dark/auto) bölümü — default: true
    showLayout?: boolean;        // Layout seçici bölümü — default: false
    showHeaderButtons?: boolean; // Header buton toggle listesi — default: false
    buttonPosition?: 'floating' | 'header'; // Settings butonu konumu — default: 'floating'
}

/**
 * AppConfig interface. Update this interface to strictly type your config
 * object.
 */
export interface FuseConfig {
    layout: string;
    scheme: Scheme;
    screens: Screens;
    theme: Theme;
    themes: Themes;
    headerButtons?: HeaderButtons;
    settingsConfig?: SettingsConfig;
}
