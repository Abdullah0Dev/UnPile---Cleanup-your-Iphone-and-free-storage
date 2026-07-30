// Paywall.tsx
import { Brand, FontSizes } from "@/constants/theme";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Switch,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { GradientButton } from "./gradient-button";
import {
  HardDrive,
  HeartPlus,
  LockOpen,
  ScanSearch,
} from "lucide-react-native";
import { Link } from "expo-router";
// -----------------------------------------------------------------------------
// 1. Types & Mock Data
// -----------------------------------------------------------------------------

interface PurchaseProductDetails {
  id: string;
  price: string;
  productId: string;
  duration: string;
  durationPlanName: string;
  hasTrial: boolean;
}

// Initial product details (matching Swift)
const INITIAL_PRODUCT_DETAILS: PurchaseProductDetails[] = [
  {
    id: "1",
    price: "$19.99",
    productId: "demo_y",
    duration: "year",
    durationPlanName: "Lifetime Plan",
    hasTrial: false,
  },
  {
    id: "2",
    price: "$2.99",
    productId: "demo_w",
    duration: "week",
    durationPlanName: "3-Day Trial",
    hasTrial: true,
  },
];

// -----------------------------------------------------------------------------
// 2. Custom Hook: Purchase Model (simulates StoreKit)
// -----------------------------------------------------------------------------

function usePurchaseModel() {
  const [productIds] = useState<string[]>(["demo_y", "demo_w"]);
  const [productDetails, setProductDetails] = useState<
    PurchaseProductDetails[]
  >(INITIAL_PRODUCT_DETAILS);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);

  // Simulate fetching products (like Swift's isFetchingProducts)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFetchingProducts(false);
    }, 1200); // simulate network delay
    return () => clearTimeout(timer);
  }, []);

  const purchaseSubscription = useCallback(
    (productId: string) => {
      if (isPurchasing) return;
      setIsPurchasing(true);
      // Simulate async purchase
      setTimeout(() => {
        setIsPurchasing(false);
        // Simulate successful subscription (for demo)
        setIsSubscribed(true);
      }, 2000);
    },
    [isPurchasing],
  );

  const restorePurchases = useCallback(() => {
    Alert.alert("Restore", "Restoring purchases...");
    // Simulate restore
    setTimeout(() => {
      // For demo, we do nothing; we'll trigger alert in the view if not subscribed
    }, 1000);
  }, []);

  return {
    productIds,
    productDetails,
    isSubscribed,
    isPurchasing,
    isFetchingProducts,
    purchaseSubscription,
    restorePurchases,
  };
}

// -----------------------------------------------------------------------------
// 3. Helper Functions
// -----------------------------------------------------------------------------

// Convert currency string like "$25.99" to number
function currencyStringToNumber(currencyString: string): number | null {
  const cleaned = currencyString.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Format number to local currency (e.g., "$25.99")
function toLocalCurrencyString(value: number): string {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD", // or user's locale; fallback to USD
  });
  return formatter.format(value);
}

// Calculate full yearly price from weekly price
function calculateFullPrice(
  productDetails: PurchaseProductDetails[],
): number | null {
  const weekly = productDetails.find((p) => p.duration === "week");
  if (!weekly) return null;
  const weeklyPrice = currencyStringToNumber(weekly.price);
  if (weeklyPrice === null) return null;
  return weeklyPrice * 52;
}

// Calculate percentage saved (yearly vs weekly*52)
function calculatePercentageSaved(
  productDetails: PurchaseProductDetails[],
): number {
  const yearly = productDetails.find((p) => p.duration === "year");
  const fullPrice = calculateFullPrice(productDetails);
  if (!yearly || fullPrice === null) return 90; // fallback
  const yearlyPrice = currencyStringToNumber(yearly.price);
  if (yearlyPrice === null) return 90;
  const saved = 100 - (yearlyPrice / fullPrice) * 100;
  return Math.round(saved);
}

// -----------------------------------------------------------------------------
// 4. Sub-Components
// -----------------------------------------------------------------------------

// Feature row (icon + text)
const PurchaseFeatureView: React.FC<{
  title: string;
  icon: "hard-drive" | "scan-search" | "heart-plus" | "lock-open";
  color: string;
}> = ({ title, icon, color }) => {
  let CustomIcon = HardDrive;
  switch (icon) {
    case "hard-drive":
      CustomIcon = HardDrive;
      break;
    case "scan-search":
      CustomIcon = ScanSearch;
      break;
    case "heart-plus":
      CustomIcon = HeartPlus;
      break;
    case "lock-open":
      CustomIcon = LockOpen;
      break;

    default:
      break;
  }
  return (
    <View style={styles.featureRow}>
      {/* <Text style={[styles.featureIcon, { color }]}>{icon}</Text> */}
      <CustomIcon style={[styles.featureIcon]} color={color} />
      <Text style={styles.featureText}>{title}</Text>
    </View>
  );
};

// Circular progress (used for cooldown close button)
const ProgressCircle: React.FC<{ progress: Animated.SharedValue<number> }> = ({
  progress,
}) => {
  const size = 24;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedStyle = useAnimatedStyle(() => {
    const offset = circumference * (1 - progress.value);
    return {
      transform: [{ rotate: "-90deg" }],
      strokeDashoffset: offset,
    };
  });

  return (
    <Svg width={size} height={size} style={styles.progressSvg}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Brand.primary}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeLinecap="round"
        style={animatedStyle}
      />
    </Svg>
  );
};

// Animated Circle wrapper for Reanimated
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Product option button
const ProductOption: React.FC<{
  product: PurchaseProductDetails;
  selected: boolean;
  onSelect: () => void;
  color: string;
  percentageSaved: number;
  fullPrice: number | null;
}> = ({ product, selected, onSelect, color, percentageSaved, fullPrice }) => {
  const { durationPlanName, hasTrial, price, duration } = product;

  return (
    <TouchableOpacity
      style={[
        styles.productOption,
        selected && styles.productOptionSelected,
        { borderColor: selected ? color : "rgba(0,0,0,0.15)" },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.productOptionContent}>
        <View style={styles.productOptionText}>
          <Text style={styles.productPlanName}>{durationPlanName}</Text>
          {hasTrial ? (
            <Text style={styles.productPriceDetail}>
              then {price} per {duration}
            </Text>
          ) : (
            <View style={styles.productPriceRow}>
              {fullPrice !== null && fullPrice > 0 && (
                <Text style={styles.productStrikethrough}>
                  {toLocalCurrencyString(fullPrice)}{" "}
                </Text>
              )}
              <Text style={styles.productPriceDetail}>{price}</Text>
            </View>
          )}
        </View>

        {!hasTrial ? (
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>BEST VALUE</Text>
          </View>
        ) : (
          <Text
            style={{
              fontSize: FontSizes.title,
              fontWeight: "800",
              color: "white",
            }}
          >
            Short Term
          </Text>
        )}

        <View style={styles.radioContainer}>
          <View style={[styles.radioOuter, selected && { borderColor: color }]}>
            {selected && (
              <View style={[styles.radioInner, { backgroundColor: color }]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// -----------------------------------------------------------------------------
// 5. Main Paywall Component
// -----------------------------------------------------------------------------

interface PaywallProps {
  isPresented: boolean;
  onDismiss: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ isPresented, onDismiss }) => {
  // ── Purchase model ──
  const {
    productDetails,
    isSubscribed,
    isPurchasing,
    isFetchingProducts,
    purchaseSubscription,
    restorePurchases,
  } = usePurchaseModel();

  // ── UI state ──
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [showCloseButton, setShowCloseButton] = useState<boolean>(false);
  const [showNoneRestoredAlert, setShowNoneRestoredAlert] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isWeeklyPlan, setIsWeeklyPlan] = useState<boolean>(true); // true = weekly, false = yearly

  // ── Shared values for animations ──
  const shakeDegrees = useSharedValue(0);
  const shakeZoom = useSharedValue(0.9);
  const progress = useSharedValue(0);

  // ── Computed values ──
  const fullPrice = useMemo(
    () => calculateFullPrice(productDetails),
    [productDetails],
  );
  const percentageSaved = useMemo(
    () => calculatePercentageSaved(productDetails),
    [productDetails],
  );

  const selectedProduct = useMemo(
    () => productDetails.find((p) => p.productId === selectedProductId),
    [productDetails, selectedProductId],
  );

  const callToActionText = useMemo(() => {
    if (selectedProduct?.hasTrial) {
      return "Try 3 Days Free";
    }
    return "Unlock Now";
  }, [selectedProduct]);

  // ── Effects ──

  // Select weekly by default when switch is ON
  useEffect(() => {
    if (productDetails.length > 0) {
      const weekly = productDetails.find((p) => p.duration === "week");
      if (isWeeklyPlan && weekly) {
        setSelectedProductId(weekly.productId);
      } else {
        const yearly = productDetails.find((p) => p.duration === "year");
        if (yearly) setSelectedProductId(yearly.productId);
      }
    }
  }, [productDetails, isWeeklyPlan]);

  // Start cooldown progress and show close button after 5s
  useEffect(() => {
    if (isPresented) {
      progress.value = 0;
      setShowCloseButton(false);
      progress.value = withTiming(1, {
        duration: 5000,
        easing: Easing.inOut(Easing.ease),
      });
      const timer = setTimeout(() => {
        setShowCloseButton(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isPresented, progress]);

  // Start shake animation after 1 second (repeats)
  useEffect(() => {
    if (isPresented) {
      const startShake = () => {
        shakeZoom.value = withRepeat(
          withSequence(
            withTiming(1.06, { duration: 200 }),
            withDelay(100, withTiming(1.06, { duration: 0 })),
            withTiming(0.94, { duration: 300 }),
            withTiming(1, { duration: 0 }),
            withDelay(1400, withTiming(1, { duration: 0 })),
          ),
          -1,
          false,
        );

        shakeDegrees.value = withRepeat(
          withSequence(
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(0, { duration: 0 }),
            withDelay(1400, withTiming(0, { duration: 0 })),
          ),
          -1,
          false,
        );
      };

      const delayTimer = setTimeout(() => {
        startShake();
      }, 1000);

      return () => {
        clearTimeout(delayTimer);
        shakeDegrees.value = 0;
        shakeZoom.value = 0.9;
      };
    }
  }, [isPresented, shakeDegrees, shakeZoom]);

  const handleRestore = () => {
    restorePurchases();
    setTimeout(() => {
      if (!isSubscribed) {
        setShowNoneRestoredAlert(true);
      }
    }, 7000);
  };

  // ── Animated styles ──
  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${shakeDegrees.value}deg` },
      { scale: shakeZoom.value },
    ],
  }));

  // Animated close button: scale and opacity when showCloseButton changes
  const closeButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showCloseButton ? 1 : 0, { duration: 300 }),
    transform: [
      { scale: withTiming(showCloseButton ? 1 : 0.8, { duration: 300 }) },
    ],
  }));

  // ── Handlers ──
  const handleToggleSwitch = (value: boolean) => {
    setIsWeeklyPlan(value);
  };

  const handleProductSelect = (productId: string) => {
    const product = productDetails.find((p) => p.productId === productId);
    if (product) {
      setIsWeeklyPlan(product.duration === "week");
      setSelectedProductId(productId);
    }
  };

  // ── Render ──

  if (!isPresented) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button (top-right) */}
      {/* <View style={styles.closeContainer}>
        <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View> */}
      <View style={styles.closeContainer}>
        <Animated.View style={closeButtonAnimatedStyle}>
          {showCloseButton ? (
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          ) : (
            <ProgressCircle progress={progress} />
          )}
        </Animated.View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Hero Image */}
        <View style={styles.heroWrapper}>
          <Animated.Image
            source={require("@/assets/images/logo.png")}
            style={[styles.heroImage, heroAnimatedStyle]}
            resizeMode="contain"
          />
        </View>

        {/* Title & Features */}
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}>Premium Access</Text>
          <View style={styles.featuresContainer}>
            <PurchaseFeatureView
              title="Free Up your storage"
              icon="hard-drive"
              color={Brand.primary}
            />
            <PurchaseFeatureView
              title="Unlimit Photos Scans"
              icon="scan-search"
              color={Brand.primary}
            />
            <PurchaseFeatureView
              title="Support me Improving The App"
              icon="heart-plus"
              color={Brand.primary}
            />
            <PurchaseFeatureView
              title="Remove annoying paywalls"
              icon="lock-open"
              color={Brand.primary}
            />
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Product Options */}
        <View
          style={[
            styles.optionsContainer,
            { opacity: isFetchingProducts ? 0 : 1 },
          ]}
        >
          {productDetails.map((product) => (
            <ProductOption
              key={product.id}
              product={product}
              selected={selectedProductId === product.productId}
              onSelect={() => handleProductSelect(product.productId)}
              color={Brand.primary}
              percentageSaved={percentageSaved}
              fullPrice={fullPrice}
            />
          ))}
        </View>

        {/* Free Trial Toggle */}
        <View style={styles.trialContainer}>
          <Text style={styles.trialText}>
            {/* {isWeeklyPlan ? "Free Trial Enabled" : "Lifetime Plan"} */}
            Free Trial Enabled
          </Text>
          <Switch
            trackColor={{ false: "#E5E5EA", true: "#34C759" }}
            thumbColor={"#FFFFFF"}
            ios_backgroundColor="#E5E5EA"
            onValueChange={handleToggleSwitch}
            value={isWeeklyPlan}
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
          />
        </View>

        <Text style={[styles.title, { fontSize: 16, fontWeight: "600" }]}>
          {isWeeklyPlan && `NO PAYMENT REQUIRED TODAY`}
        </Text>

        {/* Purchase Button & Loading */}
        {/* <View style={styles.purchaseContainer}>
          {isPurchasing ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <TouchableOpacity
              style={[styles.purchaseButton, { backgroundColor: "#007AFF" }]}
              onPress={() => {
                if (!isPurchasing && selectedProductId) {
                  purchaseSubscription(selectedProductId);
                }
              }}
              disabled={isPurchasing}
            >
              <Text style={styles.purchaseButtonText}>
                {callToActionText} <Text style={styles.chevron}>›</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View> */}
        <View style={{ marginTop: 5 }}>
          <GradientButton
            title={callToActionText + "  ›"}
            onPress={() => {
              if (!isPurchasing && selectedProductId) {
                purchaseSubscription(selectedProductId);
              }
            }}
            disabled={isPurchasing}
          />
        </View>

        {/* Footer Links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore} style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Restore</Text>
            <View style={styles.underline} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowTermsModal(true)}
            style={styles.footerLink}
          >
            <Link href="https://expo.dev">
              <Text style={styles.footerLinkText}>
                Terms of Use & Privacy Policy
              </Text>
            </Link>
            <View style={styles.underline} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Alert for no purchases restored */}
      {showNoneRestoredAlert && (
        <Modal transparent animationType="fade" visible={showNoneRestoredAlert}>
          <View style={styles.alertOverlay}>
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>Restore Purchases</Text>
              <Text style={styles.alertMessage}>No purchases restored</Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowNoneRestoredAlert(false)}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

// -----------------------------------------------------------------------------
// 6. Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#08071A", // Your deep near-black app background
    flex: 1,
    paddingHorizontal: 20,
  },
  closeContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
    height: 30, // fixed height to avoid layout shift
    alignItems: "center",
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.4)", // White opacity close icon
  },
  progressSvg: {
    // dimensions set in component
  },
  content: {
    flex: 1,
  },
  heroWrapper: {
    alignItems: "center",
    marginVertical: 10,
  },
  heroImage: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 30,
    fontWeight: "700", // Shifted to bold to match "Scan Complete" style
    textAlign: "center",
    marginTop: 15,
    color: "#FFFFFF", // Premium crisp white title text
  },
  featuresContainer: {
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  featureIcon: {
    fontSize: 22,
    marginRight: 8,
    width: 26,
  },
  featureText: {
    fontSize: 17,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.9)", // Highly readable muted white text
  },
  trialContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // backgroundColor: "#15131F", // Matches card / screen container fill
    borderWidth: 1,
    // borderColor: "#3A2E6E", // Faint violet outline
    borderRadius: 12, // Adjusted radius to match the rest of your app UI
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  trialText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  optionsContainer: {
    marginVertical: 10,
  },
  productOption: {
    borderWidth: 1,
    borderRadius: 12, // Smoother corners matching app screenshots
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: "#15131F", // Dark card fill matching app containers
    borderColor: "#3A2E6E", // Clear faint violet outline
  },
  productOptionSelected: {
    backgroundColor: "rgba(123, 79, 224, 0.15)", // Subtle brand purple background glow
    borderColor: "#9B6FF5", // Bright purple pop-out active border
  },
  productOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productOptionText: {
    flex: 1,
  },
  productPlanName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  productPriceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  productPriceDetail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)", // Muted white pricing description
  },
  productStrikethrough: {
    fontSize: 14,
    textDecorationLine: "line-through",
    color: "rgba(255, 255, 255, 0.35)", // Muted greyed-out crossed text
  },
  saveBadge: {
    backgroundColor: "#7B4FE0", // Changed from red to your solid button purple accent
    borderRadius: 6,
    paddingVertical: 4, // Tighter spacing for modern accent badge shape
    paddingHorizontal: 8,
    marginHorizontal: 10,
    justifyContent: "center",
  },
  saveBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  radioContainer: {
    marginLeft: 8,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)", // Border adjustments for dark visibility
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  checkmark: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  purchaseContainer: {
    marginVertical: 10,
    alignItems: "center",
  },
  purchaseButton: {
    backgroundColor: "#7B4FE0", // Base brand purple (Swap this out if using LinearGradient component)
    borderRadius: 12, // Perfect matched corner radius to your "Review Items" design
    paddingVertical: 16,
    paddingHorizontal: 30,
    width: "100%",
  },
  purchaseButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  chevron: {
    fontSize: 22,
    color: "rgba(255, 255, 255, 0.6)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 15,
  },
  footerLink: {
    marginHorizontal: 10,
    marginVertical: 4,
    alignItems: "center",
  },
  footerLinkText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)", // Grayed text readable on black ground
  },
  underline: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginTop: 1,
  },
  alertOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)", // Deeper backdrop blend
  },
  alertBox: {
    backgroundColor: "#15131F", // Custom card modal theme
    borderWidth: 1,
    borderColor: "#3A2E6E",
    borderRadius: 14,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#FFFFFF",
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.8)",
  },
  alertButton: {
    backgroundColor: "#7B4FE0", // Removed corporate blue
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  alertButtonText: {
    color: "white",
    fontWeight: "600",
  },
  termsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  termsBox: {
    backgroundColor: "#15131F", // Bottom sheet dark wrapper
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#3A2E6E",
    padding: 20,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#FFFFFF",
  },
  termsOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3A2E6E", // Premium custom partition divider line
  },
  termsOptionText: {
    fontSize: 18,
    textAlign: "center",
    color: "#FFFFFF",
  },
  termsCancel: {
    borderBottomWidth: 0,
  },
  termsCancelText: {
    fontSize: 18,
    color: "#FF453A", // Premium light system-red accent color for dark background clarity
    textAlign: "center",
    fontWeight: "600",
  },
});

export default Paywall;
