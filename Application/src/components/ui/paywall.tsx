// Paywall.tsx
import { Brand, FontSizes } from "@/constants/theme";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
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
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { GradientButton } from "./gradient-button";
import {
  Gem,
  HardDrive,
  HeartPlus,
  Lightbulb,
  LockOpen,
  ScanSearch,
  Sparkle,
  Sparkles,
  Trash,
  WandSparkles,
} from "lucide-react-native";
import { Link } from "expo-router";
import CountdownCloseButton from "./countdown-close-button";
import BottomSheet, { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { useCredits } from "@/context/CreditsContext";

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
    productId: "clean_life",
    duration: "life",
    durationPlanName: "Lifetime Plan",
    hasTrial: false,
  },
  {
    id: "2",
    price: "$2.99",
    productId: "clean_w",
    duration: "week",
    durationPlanName: "3-Day Trial",
    hasTrial: true,
  },
];

// -----------------------------------------------------------------------------
// 2. Custom Hook: Purchase Model (simulates StoreKit)
// -----------------------------------------------------------------------------

function usePurchaseModel({ onDismiss }: { onDismiss: () => void }) {
  const [productIds] = useState<string[]>(["demo_y", "demo_w"]);
  const [productDetails, setProductDetails] = useState<
    PurchaseProductDetails[]
  >(INITIAL_PRODUCT_DETAILS);
  const { setSubscriptionStatus } = useCredits();
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
      setTimeout(async () => {
        setIsPurchasing(false);
        console.log("Subscribed:)");
        // 1. Call the method that updates the Context and Storage
        await setSubscriptionStatus(true);

        // 2. Close the paywall
        onDismiss();
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
  return weeklyPrice * 52; //. 14 months
}

// -----------------------------------------------------------------------------
// 4. Sub-Components
// -----------------------------------------------------------------------------

// Feature row (icon + text)
const PurchaseFeatureView: React.FC<{
  title: string;
  icon: "trash-can" | "sparkles" | "lightning-bolt" | "gem";
  color: string;
}> = ({ title, icon, color }) => {
  let CustomIcon = Trash;
  switch (icon) {
    case "trash-can":
      CustomIcon = Trash;
      break;
    case "sparkles":
      CustomIcon = Sparkles;
      break;
    case "lightning-bolt":
      CustomIcon = Lightbulb;
      break;
    case "gem":
      CustomIcon = Gem;
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

// Product option button
const ProductOption: React.FC<{
  product: PurchaseProductDetails;
  selected: boolean;
  onSelect: () => void;
  color: string;
  fullPrice: number | null;
}> = ({ product, selected, onSelect, color, fullPrice }) => {
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
  // ── Bottom Sheet Ref ──
  const sheetRef = useRef<BottomSheet>(null);

  // ── Purchase model ──
  const {
    productDetails,
    isSubscribed,
    isPurchasing,
    isFetchingProducts,
    purchaseSubscription,
    restorePurchases,
  } = usePurchaseModel({ onDismiss });

  // ── UI state ──
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [showNoneRestoredAlert, setShowNoneRestoredAlert] = useState(false);
  const [isWeeklyPlan, setIsWeeklyPlan] = useState<boolean>(true); // true = weekly, false = yearly
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);

  // ── Shared values for animations ──
  const shakeDegrees = useSharedValue(0);
  const shakeZoom = useSharedValue(0.9);

  // ── Computed values ──
  const fullPrice = useMemo(
    () => calculateFullPrice(productDetails),
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

  // Control the bottom sheet visibility based on isPresented
  useEffect(() => {
    if (isPresented) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [isPresented]);

  // Select weekly by default when switch is ON
  useEffect(() => {
    if (productDetails.length > 0) {
      const weekly = productDetails.find((p) => p.duration === "week");
      if (isWeeklyPlan && weekly) {
        setSelectedProductId(weekly.productId);
      } else {
        const lifeTime = productDetails.find((p) => p.duration === "life");
        if (lifeTime) setSelectedProductId(lifeTime.productId);
      }
    }
  }, [productDetails, isWeeklyPlan]);

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
  // Note: We do NOT return null here, because BottomSheet needs to be rendered to manage state.
  const handleCountdownComplete = useCallback(() => {
    setIsCountdownComplete(true);
    console.log("countdown finished!");
  }, []);
  const handleDismiss = useCallback(() => {
    onDismiss();
    console.log("countdown reset!");
    setIsCountdownComplete(false);
  }, []);

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={["98.5%"]}
      index={-1}
      onClose={handleDismiss}
      enablePanDownToClose={isCountdownComplete}
      backgroundStyle={{ backgroundColor: "#08071A" }}
      handleIndicatorStyle={{ backgroundColor: Brand.textSecondary }}
    >
      <BottomSheetView style={styles.bottomSheetContent}>
        <SafeAreaView style={styles.container}>
          <View style={styles.closeContainer}>
            <CountdownCloseButton
              duration={5000}
              active={isPresented}
              onComplete={handleCountdownComplete} // <-- New prop
              onPress={handleDismiss}
            />
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
                  title="Unlimited Deletion"
                  icon="trash-can"
                  color={Brand.primary}
                />
                <PurchaseFeatureView
                  title="AI Smart Select"
                  icon="sparkles"
                  color={Brand.primary}
                />
                <PurchaseFeatureView
                  title="One-Tap Clean Up"
                  icon="lightning-bolt"
                  color={Brand.primary}
                />
                <PurchaseFeatureView
                  title="Seamless Experience"
                  icon="gem"
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
                  fullPrice={fullPrice}
                />
              ))}
            </View>

            {/* Free Trial Toggle */}
            <View style={styles.trialContainer}>
              <Text style={styles.trialText}>Free Trial Enabled</Text>
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
            <View style={{ marginTop: 5 }}>
              <GradientButton
                textStyle={{ fontSize: 19, fontWeight: 700 }}
                title={callToActionText + "  ›"}
                onPress={() => {
                  if (!isPurchasing && selectedProductId) {
                    purchaseSubscription(selectedProductId);
                  }
                }}
                // Icon={WandSparkles}
                disabled={isPurchasing}
              />
            </View>

            {/* Footer Links */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleRestore}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Restore</Text>
                <View style={styles.underline} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerLink}>
                <Link href="https://unpile.vercel.app/legal">
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
            <Modal
              transparent
              animationType="fade"
              visible={showNoneRestoredAlert}
            >
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
      </BottomSheetView>
    </BottomSheet>
  );
};

// -----------------------------------------------------------------------------
// 6. Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
  },
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
    borderWidth: 1,
    borderRadius: 12,
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
