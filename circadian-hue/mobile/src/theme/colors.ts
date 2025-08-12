export const theme = {
  colors: {
    // Primary circadian colors matching web app
    primary: '#f59e0b', // Circadian amber
    secondary: '#1e293b', // Circadian navy
    accent: '#3b82f6',
    
    // Backgrounds
    background: '#0f172a',
    surface: '#1e293b',
    card: '#334155',
    
    // Text colors
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Phase colors
    sunrise: '#fb923c',
    day: '#3b82f6',
    evening: '#f59e0b',
    night: '#a855f7',
    
    // UI elements
    border: '#475569',
    divider: '#334155',
    disabled: '#64748b',
    
    // Glass morphism
    glassBg: 'rgba(30, 41, 59, 0.8)',
    glassOverlay: 'rgba(255, 255, 255, 0.1)',
  },
  
  gradients: {
    primary: ['#f59e0b', '#ea580c'],
    secondary: ['#1e293b', '#334155'],
    circadian: ['#1e293b', '#475569', '#f59e0b'],
    phase: {
      sunrise: ['#fb923c', '#f97316'],
      day: ['#3b82f6', '#1d4ed8'],
      evening: ['#f59e0b', '#d97706'],
      night: ['#a855f7', '#7c3aed'],
    },
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    heading: 32,
  },
};