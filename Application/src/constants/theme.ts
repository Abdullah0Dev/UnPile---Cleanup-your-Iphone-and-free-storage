import "@/global.css";


export const Brand = {
  appBackground: "#08071A", // near-black background with a hint of violet #060423 => right color
  cardBackground: "#15131F", // card / screen container fill
  cardBorder: "#3A2E6E", // faint violet outline around cards & screen frames

  // Primary accent (the vivid purple used for buttons, progress ring, icons)
  primary: "#7B4FE0", // solid button / accent purple
  primaryLight: "#9B6FF5", // lighter purple, used in gradients & highlights
  primaryDark: "#5A34B8", // darker purple, gradient bottom / pressed state
  primaryGradient: ["#9B6FF5", "#6C3CE0"] as const, // icon tile / button gradient stops

  // Glow / decorative accents (sparkles, ring glow, success check glow)
  glow: "#B98CFF", // soft glow color behind icons & rings
  sparkle: "#D6BBFF", // sparkle accents (✨ icon color)

  // Selection & checkbox states
  selectedFill: "#7B4FE0", // filled circular checkbox when photo is selected
  unselectedStroke: "#5A5A6E", // empty circle outline for unselected items

  // Category tile tint backgrounds (soft translucent purple tiles behind icons)
  tileBackground: "rgba(123, 79, 224, 0.15)",
  tileBackgroundAlt: "rgba(123, 79, 224, 0.08)",

  // Semantic
  danger: "#7B4FE0", // NOTE: "Delete" buttons reuse brand primary, not red
  // this app has no destructive-red pattern; keep delete
  // actions in brand purple to match provided mocks.
  success: "#7B4FE0", // "All Done" checkmark also reuses brand primary/glow

  // Text on dark surfaces
  textPrimary: "#FFFFFF",
  textSecondary: "#A8A6B8", // secondary/meta text (e.g. "874 items · 4.2 GB")
  textTertiary: "#7A7890", // deemphasized captions
  textOnPrimary: "#FFFFFF", // text on top of solid purple buttons

  // Borders / dividers
  divider: "rgba(255,255,255,0.08)",
} as const;

// -----------------------------------------------------------------------------
// GRADIENTS
// Use with expo-linear-gradient or react-native-linear-gradient.
// -----------------------------------------------------------------------------

export const Gradients = {
  primaryButton: ["#9B6FF5", "#6C3CE0"] as const,
  buttonGradient: ["#5C28C6", "#7733E8", "#5D29C7"] as const,
  buttonGradientOFF: ["#12112890", "#121128", "#12112880"] as const,
  iconTile: ["#8A5CF0", "#5A34B8"] as const,
  screenGlow: ["rgba(123,79,224,0.25)", "rgba(11,10,20,0)"] as const,
} as const;

// -----------------------------------------------------------------------------
// TYPE SCALE  sizes observed across the screens
// (large title, section title, body, caption, button label)
// -----------------------------------------------------------------------------

export const FontSizes = {
  largeTitle: 52, // "Unpile" wordmark / "23.6 GB" stat
  title: 20, // "Scan Complete", "All Categories" nav titles
  headline: 17, // section headers e.g. "Screenshots"
  body: 15, // standard row text
  caption: 13, // meta text e.g. "874 items · 4.2 GB"
  small: 11, // status bar / tiny labels
} as const;

export const FontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

// -----------------------------------------------------------------------------
// SPACING
// -----------------------------------------------------------------------------

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// -----------------------------------------------------------------------------
// RADII  corner rounding observed in cards, buttons, tiles, thumbnails
// -----------------------------------------------------------------------------

export const Radii = {
  none: 0,
  small: 8, // thumbnail grid images
  medium: 14, // category tiles
  large: 20, // buttons
  xlarge: 28, // cards / screen frame corners
  full: 999, // circular checkboxes, avatar/icon containers, progress ring
} as const;
