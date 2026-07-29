// Paywall.tsx
import { FontSizes } from "@/constants/theme";
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
    price: "$4.99",
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
  icon: string;
  color: string;
}> = ({ title, icon, color }) => {
  return (
    <View style={styles.featureRow}>
      <Text style={[styles.featureIcon, { color }]}>{icon}</Text>
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
    };
  });

  return (
    <Svg width={size} height={size} style={styles.progressSvg}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(0,0,0,0.1)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#007AFF" // blue color
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        style={animatedStyle}
        strokeLinecap="round"
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
          <Text style={{ fontSize: FontSizes.title, fontWeight: "800" }}>
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

  // ── Shared values for animations ──
  const shakeDegrees = useSharedValue(0);
  const shakeZoom = useSharedValue(0.9);
  const progress = useSharedValue(0); // 0..1 for cooldown ring

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

  // Placeholder products when fetching
  const displayProducts = isFetchingProducts
    ? [
        {
          id: "pl1",
          price: "-",
          productId: "demo",
          duration: "week",
          durationPlanName: "week",
          hasTrial: false,
        },
        {
          id: "pl2",
          price: "-",
          productId: "demo",
          duration: "week",
          durationPlanName: "week",
          hasTrial: false,
        },
      ]
    : productDetails;

  // ── Effects ──

  // Select last product by default
  useEffect(() => {
    if (productDetails.length > 0) {
      const last = productDetails[productDetails.length - 1];
      setSelectedProductId(last.productId);
    }
  }, [productDetails]);

  // Start cooldown progress and show close button after 5s
  useEffect(() => {
    if (isPresented) {
      // Reset progress
      progress.value = 0;
      setShowCloseButton(false);
      // Animate progress from 0 to 1 over 5 seconds
      progress.value = withTiming(1, {
        duration: 5000,
        easing: Easing.inOut(Easing.ease),
      });
      // After 5 seconds, show close button
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
        // 1. Scale Sequence (Syncs perfectly to the shake timings)
        shakeZoom.value = withRepeat(
          withSequence(
            // Growing (200ms)
            withTiming(1.06, { duration: 200 }),
            // Even while its big (Hold for 100ms)
            withDelay(100, withTiming(1.06, { duration: 0 })),
            // Getting small (300ms)
            withTiming(0.94, { duration: 300 }),
            // When it's back (Instantly reset to original)
            withTiming(1, { duration: 0 }),
            // Pause fully (1400ms)
            withDelay(1400, withTiming(1, { duration: 0 })),
          ),
          -1, // Infinite loop
          false,
        );

        // 2. Shake Sequence (Your exact specified timings)
        shakeDegrees.value = withRepeat(
          withSequence(
            // Active shaking (600ms total - perfectly overlapping grow, big, and shrink)
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            withTiming(6, { duration: 50 }),
            withTiming(-6, { duration: 100 }),
            // Stop shaking instantly when it's back to normal
            withTiming(0, { duration: 0 }),
            // Stop shaking entirely during the pause (1400ms)
            withDelay(1400, withTiming(0, { duration: 0 })),
          ),
          -1, // Infinite loop
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
  // Handle restore alert after 7s if not subscribed
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

  // ── Render ──

  if (!isPresented) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button (top-right) */}
      <View style={styles.closeContainer}>
        {showCloseButton ? (
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        ) : (
          <ProgressCircle progress={progress} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Hero Image */}
        <View style={styles.heroWrapper}>
          <Animated.Image
            source={require("@/assets/images/logo.png")} // replace with your image
            style={[styles.heroImage, heroAnimatedStyle]}
            resizeMode="contain"
          />
        </View>

        {/* Title & Features */}
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}> Premium Access</Text>
          <View style={styles.featuresContainer}>
            <PurchaseFeatureView
              title="Free Up your storage"
              icon="⭐"
              color="#007AFF"
            />
            <PurchaseFeatureView
              title="Unlimit Photos Scans"
              icon="⭐"
              color="#007AFF"
            />
            <PurchaseFeatureView
              title="Support me Improving The App"
              icon="⭐"
              color="#007AFF"
            />
            <PurchaseFeatureView
              title="Remove annoying paywalls"
              icon="🔒"
              color="#007AFF"
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
          {displayProducts.map((product) => (
            <ProductOption
              key={product.id}
              product={product}
              selected={selectedProductId === product.productId}
              onSelect={() => setSelectedProductId(product.productId)}
              color="#007AFF"
              percentageSaved={percentageSaved}
              fullPrice={fullPrice}
            />
          ))}
        </View>
        {/* free trail enabled */}
        <View style={styles.trialContainer}>
          <Text style={styles.trialText}>Free Trial Enabled</Text>
          <Switch
            trackColor={{ false: "#E5E5EA", true: "#34C759" }} // iOS-style green when enabled
            thumbColor={"#FFFFFF"}
            ios_backgroundColor="#E5E5EA"
            onValueChange={() => {}}
            value={true}
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }} // Slightly shrink to match the exact look of the image
          />
        </View>
        {/* no payment text */}
        <Text style={[styles.title, { fontSize: 16, fontWeight: 600 }]}>
          {" "}
          NO PAYMENT REQUIRED TODAY
        </Text>

        {/* Purchase Button & Loading */}
        <View style={styles.purchaseContainer}>
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
            <Text style={styles.footerLinkText}>
              Terms of Use & Privacy Policy
            </Text>
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

      {/* Terms Modal */}
      <Modal transparent animationType="slide" visible={showTermsModal}>
        <View style={styles.termsOverlay}>
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>View Terms & Conditions</Text>
            <TouchableOpacity
              style={styles.termsOption}
              onPress={() => {
                // Open URL
                Alert.alert("Open Terms of Use", "https://example.com");
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.termsOptionText}>Terms of Use</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.termsOption}
              onPress={() => {
                Alert.alert("Open Privacy Policy", "https://example.com");
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.termsOptionText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.termsOption, styles.termsCancel]}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.termsCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// -----------------------------------------------------------------------------
// 6. Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    flex: 1,
    paddingHorizontal: 20,
    // paddingTop: 20,
    // paddingBottom: 30,
    // width: "90%",
    // maxWidth: 400,
    // height: "95%",
    // shadowColor: "#131212",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    // elevation: 5,
  },
  closeContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: "300",
    color: "rgba(0,0,0,0.4)",
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
    fontWeight: "600",
    textAlign: "center",
    marginTop: 15,
  },
  featuresContainer: {
    marginBottom: 10,
    // alignItems: 'center'
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  featureIcon: {
    fontSize: 22,
    marginRight: 5,
    width: 26,
  },
  featureText: {
    fontSize: 17,
    fontWeight: "400",
  },
  // Free Trial Toggle Styles
  trialContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F7F9", // Matches the light gray pill background
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  trialText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
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
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  productOptionSelected: {
    backgroundColor: "rgba(0,122,255,0.05)",
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
  },
  productPriceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  productPriceDetail: {
    fontSize: 14,
    opacity: 0.8,
  },
  productStrikethrough: {
    fontSize: 14,
    textDecorationLine: "line-through",
    opacity: 0.4,
  },
  saveBadge: {
    backgroundColor: "red",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: 10,
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
    borderColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 6,
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
    color: "gray",
  },
  underline: {
    height: 1,
    width: "100%",
    backgroundColor: "gray",
    marginTop: 1,
  },
  // Alert Modal
  alertOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  alertBox: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  alertButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
  alertButtonText: {
    color: "white",
    fontWeight: "600",
  },
  // Terms Modal
  termsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  termsBox: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  termsOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  termsOptionText: {
    fontSize: 18,
    textAlign: "center",
  },
  termsCancel: {
    borderBottomWidth: 0,
  },
  termsCancelText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default Paywall;
