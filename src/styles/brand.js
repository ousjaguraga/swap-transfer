// Swap Transfer — "Midnight & Mint" identity.
// Existing keys are preserved (so the whole app re-themes) with new values;
// new tokens (accent, gradients, surfaces) power the redesigned hero/screens.
const appColor = {
  // Indigo brand
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#0B1220',

  // Mint / emerald accent (CTAs, positive)
  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',

  // Backgrounds
  backgroundOne: '#0B1220', // deep slate base
  backgroundTwo: '#E2E8F0', // light surface

  // --- New "Midnight & Mint" tokens ---
  accent: '#10B981',
  accentSoft: 'rgba(16, 185, 129, 0.14)',

  surface: '#121A2E', // raised dark card
  surfaceLight: '#1B2540', // inputs / elevated
  border: '#243049',

  textPrimary: '#F8FAFC',
  textMuted: 'rgba(226, 232, 240, 0.62)',
  textFaint: 'rgba(226, 232, 240, 0.40)',

  // Hero gradient: indigo → deep slate (top-left → bottom-right)
  heroGradient: ['#4F46E5', '#312E81', '#0B1220'],
  // Accent gradient for buttons / marks
  accentGradient: ['#34D399', '#10B981', '#059669'],
  // Splash backdrop
  splashGradient: ['#0B1220', '#121A2E', '#1E1B4B'],
};

export default appColor;
