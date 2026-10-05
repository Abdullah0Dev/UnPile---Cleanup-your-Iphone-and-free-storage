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
  TouchableOpacity,
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
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientButton } from "./gradient-button";
import { Gem, Lightbulb, Sparkles, Trash } from "lucide-react-native";
import { Link } from "expo-router";
import CountdownCloseButton from "./countdown-close-button";
import BottomSheet, { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { useCredits } from "@/context/CreditsContext";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import { useTranslation } from "react-i18next";

// -----------------------------------------------------------------------------
// 1. Types
// -----------------------------------------------------------------------------

type PlanKey = "lifetime_plan" | "trial_plan";

interface PurchaseProductDetails {
  id: string;
  price: string;
  productId: string;
  duration: string;
  planKey: PlanKey;
  hasTrial: boolean;
  rcPackage: PurchasesPackage;
}

export const ENTITLEMENT_ID = "premium_clean";

// -----------------------------------------------------------------------------
// 2. Purchase Model
// -----------------------------------------------------------------------------

function packageToProductDetails(pkg: PurchasesPackage) {
  const product = pkg.product;
  const isWeekly = pkg.packageType === "WEEKLY";
  const isLifetime = pkg.packageType === "LIFETIME";

  return {
    id: pkg.identifier,
    price: product.priceString,
    productId: product.identifier,
    duration: isWeekly
      ? "week"
      : isLifetime
        ? "life"
        : pkg.packageType.toLowerCase(),
    planKey: (isLifetime
      ? "lifetime_plan"
      : "trial_plan") as PlanKey,
    hasTrial: !!product.introPrice,
    rcPackage: pkg,
  };
}

export function usePurchaseModel({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const [offering, setOffering] =
    useState<PurchasesOffering | null>(null);

  const [productDetails, setProductDetails] =
    useState<ReturnType<typeof packageToProductDetails>[]>([]);

  const [isFetchingProducts, setIsFetchingProducts] =
    useState(true);

  const [isPurchasing, setIsPurchasing] = useState(false);

  const {
    isSubscribed,
    setSubscriptionStatus,
  } = useCredits();

  useEffect(() => {
    (async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings.current;

        if (current) {
          setOffering(current);

          setProductDetails(
            current.availablePackages.map(
              packageToProductDetails,
            ),
          );
        }
      } catch (e) {
        console.error("Failed to fetch offerings", e);
      } finally {
        setIsFetchingProducts(false);
      }
    })();
  }, []);

  const purchaseSubscription = useCallback(
    async (productId: string) => {
      if (isPurchasing) return;

      const details = productDetails.find(
        (p) => p.productId === productId,
      );

      if (!details) return;

      setIsPurchasing(true);

      try {
        const { customerInfo } =
          await Purchases.purchasePackage(
            details.rcPackage,
          );

        const isEntitled =
          typeof customerInfo.entitlements.active[
            ENTITLEMENT_ID
          ] !== "undefined";

        await setSubscriptionStatus(isEntitled);

        if (isEntitled) {
          onDismiss();
        }
      } catch (e: any) {
        if (!e.userCancelled) {
          console.error("Purchase failed", e);
        }
      } finally {
        setIsPurchasing(false);
      }
    },
    [
      isPurchasing,
      productDetails,
      setSubscriptionStatus,
      onDismiss,
    ],
  );

  const restorePurchases = useCallback(async () => {
    try {
      const customerInfo =
        await Purchases.restorePurchases();

      const isEntitled =
        typeof customerInfo.entitlements.active[
          ENTITLEMENT_ID
        ] !== "undefined";

      await setSubscriptionStatus(isEntitled);

      return isEntitled;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  }, [setSubscriptionStatus]);

  return {
    productDetails,
    isSubscribed,
    isPurchasing,
    isFetchingProducts,
    purchaseSubscription,
    restorePurchases,
  };
}

// -----------------------------------------------------------------------------
// 3. Helpers
// -----------------------------------------------------------------------------

function currencyStringToNumber(
  currencyString: string,
): number | null {
  const cleaned = currencyString.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

function toLocalCurrencyString(value: number): string {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  });

  return formatter.format(value);
}

function calculateFullPrice(
  productDetails: PurchaseProductDetails[],
): number | null {
  const weekly = productDetails.find(
    (p) => p.duration === "week",
  );

  if (!weekly) return null;

  const weeklyPrice = currencyStringToNumber(
    weekly.price,
  );

  if (weeklyPrice === null) return null;

  return weeklyPrice * 52;
}

// -----------------------------------------------------------------------------
// 4. Feature Row
// -----------------------------------------------------------------------------

const PurchaseFeatureView: React.FC<{
  title: string;
  icon:
    | "trash-can"
    | "sparkles"
    | "lightning-bolt"
    | "gem";
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
  }

  return (
    <View style={styles.featureRow}>
      <CustomIcon
        style={styles.featureIcon}
        color={color}
      />

      <Text style={styles.featureText}>
        {title}
      </Text>
    </View>
  );
};

// -----------------------------------------------------------------------------
// 5. Product Option
// -----------------------------------------------------------------------------

const ProductOption: React.FC<{
  product: PurchaseProductDetails;
  selected: boolean;
  onSelect: () => void;
  color: string;
  fullPrice: number | null;
}> = ({
  product,
  selected,
  onSelect,
  color,
  fullPrice,
}) => {
  const { t } = useTranslation();

  const {
    planKey,
    hasTrial,
    price,
  } = product;

  const planTitle = t(
    `premium_access_screen.plans.${planKey}.title`,
  );

  return (
    <TouchableOpacity
      style={[
        styles.productOption,
        selected && styles.productOptionSelected,
        {
          borderColor: selected
            ? color
            : "rgba(0,0,0,0.15)",
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.productOptionContent}>
        <View style={styles.productOptionText}>
          <Text style={styles.productPlanName}>
            {planTitle}
          </Text>

          {hasTrial ? (
            <Text style={styles.productPriceDetail}>
              {t(
                "premium_access_screen.plans.trial_plan.subtitle",
                {
                  price,
                },
              )}
            </Text>
          ) : (
            <View style={styles.productPriceRow}>
              {fullPrice !== null &&
                fullPrice > 0 && (
                  <Text
                    style={
                      styles.productStrikethrough
                    }
                  >
                    {toLocalCurrencyString(
                      fullPrice,
                    )}{" "}
                  </Text>
                )}

              <Text
                style={styles.productPriceDetail}
              >
                {price}
              </Text>
            </View>
          )}
        </View>

        {!hasTrial ? (
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>
              {t(
                "premium_access_screen.plans.lifetime_plan.badge",
              )}
            </Text>
          </View>
        ) : (
          <Text
            style={{
              fontSize: FontSizes.title,
              fontWeight: "800",
              color: "white",
            }}
          >
            {t(
              "premium_access_screen.plans.trial_plan.tag",
            )}
          </Text>
        )}

        <View style={styles.radioContainer}>
          <View
            style={[
              styles.radioOuter,
              selected && {
                borderColor: color,
              },
            ]}
          >
            {selected && (
              <View
                style={[
                  styles.radioInner,
                  {
                    backgroundColor: color,
                  },
                ]}
              >
                <Text style={styles.checkmark}>
                  ✓
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// -----------------------------------------------------------------------------
// 6. Main Paywall
// -----------------------------------------------------------------------------

interface PaywallProps {
  isPresented: boolean;
  onDismiss: () => void;
}

const Paywall: React.FC<PaywallProps> = ({
  isPresented,
  onDismiss,
}) => {
  const { t } = useTranslation();

  const sheetRef = useRef<BottomSheet>(null);

  const {
    productDetails,
    isSubscribed,
    isPurchasing,
    isFetchingProducts,
    purchaseSubscription,
    restorePurchases,
  } = usePurchaseModel({ onDismiss });

  const [selectedProductId, setSelectedProductId] =
    useState<string>("");

  const [showNoneRestoredAlert, setShowNoneRestoredAlert] =
    useState(false);

  const [isWeeklyPlan, setIsWeeklyPlan] =
    useState<boolean>(true);

  const [isCountdownComplete, setIsCountdownComplete] =
    useState(false);

  const shakeDegrees = useSharedValue(0);
  const shakeZoom = useSharedValue(0.9);

  const fullPrice = useMemo(
    () => calculateFullPrice(productDetails),
    [productDetails],
  );

  const selectedProduct = useMemo(
    () =>
      productDetails.find(
        (p) =>
          p.productId === selectedProductId,
      ),
    [productDetails, selectedProductId],
  );

  const callToActionText = useMemo(() => {
    if (selectedProduct?.hasTrial) {
      return t(
        "premium_access_screen.buttons.try_free",
      );
    }

    return t(
      "premium_access_screen.buttons.unlock_now",
    );
  }, [selectedProduct, t]);

  // Control Bottom Sheet
  useEffect(() => {
    if (isPresented) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [isPresented]);

  // Select weekly by default
  useEffect(() => {
    if (productDetails.length > 0) {
      const weekly = productDetails.find(
        (p) => p.duration === "week",
      );

      if (isWeeklyPlan && weekly) {
        setSelectedProductId(
          weekly.productId,
        );
      } else {
        const lifetime = productDetails.find(
          (p) => p.duration === "life",
        );

        if (lifetime) {
          setSelectedProductId(
            lifetime.productId,
          );
        }
      }
    }
  }, [productDetails, isWeeklyPlan]);

  // Shake animation
  useEffect(() => {
    if (isPresented) {
      const startShake = () => {
        shakeZoom.value = withRepeat(
          withSequence(
            withTiming(1.06, {
              duration: 200,
            }),
            withDelay(
              100,
              withTiming(1.06, {
                duration: 0,
              }),
            ),
            withTiming(0.94, {
              duration: 300,
            }),
            withTiming(1, {
              duration: 0,
            }),
            withDelay(
              1400,
              withTiming(1, {
                duration: 0,
              }),
            ),
          ),
          -1,
          false,
        );

        shakeDegrees.value = withRepeat(
          withSequence(
            withTiming(6, {
              duration: 50,
            }),
            withTiming(-6, {
              duration: 100,
            }),
            withTiming(6, {
              duration: 50,
            }),
            withTiming(-6, {
              duration: 100,
            }),
            withTiming(6, {
              duration: 50,
            }),
            withTiming(-6, {
              duration: 100,
            }),
            withTiming(6, {
              duration: 50,
            }),
            withTiming(-6, {
              duration: 100,
            }),
            withTiming(0, {
              duration: 0,
            }),
            withDelay(
              1400,
              withTiming(0, {
                duration: 0,
              }),
            ),
          ),
          -1,
          false,
        );
      };

      const delayTimer = setTimeout(
        startShake,
        1000,
      );

      return () => {
        clearTimeout(delayTimer);
        shakeDegrees.value = 0;
        shakeZoom.value = 0.9;
      };
    }
  }, [
    isPresented,
    shakeDegrees,
    shakeZoom,
  ]);

  const handleRestore = async () => {
    const restored = await restorePurchases();

    if (!restored) {
      setShowNoneRestoredAlert(true);
    }
  };

  const heroAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          rotate: `${shakeDegrees.value}deg`,
        },
        {
          scale: shakeZoom.value,
        },
      ],
    }),
  );

  const handleToggleSwitch = (
    value: boolean,
  ) => {
    setIsWeeklyPlan(value);
  };

  const handleProductSelect = (
    productId: string,
  ) => {
    const product = productDetails.find(
      (p) => p.productId === productId,
    );

    if (product) {
      setIsWeeklyPlan(
        product.duration === "week",
      );

      setSelectedProductId(productId);
    }
  };

  const handleCountdownComplete =
    useCallback(() => {
      setIsCountdownComplete(true);
      console.log(
        "countdown finished!",
      );
    }, []);

  const handleDismiss = useCallback(() => {
    onDismiss();
    setIsCountdownComplete(false);
  }, [onDismiss]);

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={["98.5%"]}
      index={-1}
      onClose={handleDismiss}
      enablePanDownToClose={
        isCountdownComplete
      }
      backgroundStyle={{
        backgroundColor: "#08071A",
      }}
      handleIndicatorStyle={{
        backgroundColor:
          Brand.textSecondary,
      }}
    >
      <BottomSheetView
        style={styles.bottomSheetContent}
      >
        <SafeAreaView
          style={styles.container}
        >
          <View style={styles.closeContainer}>
            <CountdownCloseButton
              duration={5000}
              active={isPresented}
              onComplete={
                handleCountdownComplete
              }
              onPress={handleDismiss}
            />
          </View>

          <View style={styles.content}>
            {/* Hero */}
            <View
              style={styles.heroWrapper}
            >
              <Animated.Image
                source={require("@/assets/images/logo.png")}
                style={[
                  styles.heroImage,
                  heroAnimatedStyle,
                ]}
                resizeMode="contain"
              />
            </View>

            {/* Title + Features */}
            <View
              style={{
                alignItems: "center",
              }}
            >
              <Text style={styles.title}>
                {t(
                  "premium_access_screen.title",
                )}
              </Text>

              <View
                style={
                  styles.featuresContainer
                }
              >
                <PurchaseFeatureView
                  title={t(
                    "premium_access_screen.features.unlimited_deletion",
                  )}
                  icon="trash-can"
                  color={Brand.primary}
                />

                <PurchaseFeatureView
                  title={t(
                    "premium_access_screen.features.ai_smart_select",
                  )}
                  icon="sparkles"
                  color={Brand.primary}
                />

                <PurchaseFeatureView
                  title={t(
                    "premium_access_screen.features.one_tap_clean_up",
                  )}
                  icon="lightning-bolt"
                  color={Brand.primary}
                />

                <PurchaseFeatureView
                  title={t(
                    "premium_access_screen.features.seamless_experience",
                  )}
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
                {
                  opacity:
                    isFetchingProducts
                      ? 0
                      : 1,
                },
              ]}
            >
              {productDetails.map(
                (product) => (
                  <ProductOption
                    key={product.id}
                    product={product}
                    selected={
                      selectedProductId ===
                      product.productId
                    }
                    onSelect={() =>
                      handleProductSelect(
                        product.productId,
                      )
                    }
                    color={
                      Brand.primary
                    }
                    fullPrice={
                      fullPrice
                    }
                  />
                ),
              )}
            </View>

            {/* Trial Toggle */}
            <View
              style={styles.trialContainer}
            >
              <Text
                style={styles.trialText}
              >
                {t(
                  "premium_access_screen.toggle.free_trial_enabled",
                )}
              </Text>

              <Switch
                trackColor={{
                  false: "#E5E5EA",
                  true: "#34C759",
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E5EA"
                onValueChange={
                  handleToggleSwitch
                }
                value={isWeeklyPlan}
                style={{
                  transform: [
                    {
                      scaleX: 0.9,
                    },
                    {
                      scaleY: 0.9,
                    },
                  ],
                }}
              />
            </View>

            {/* No payment label */}
            <Text
              style={[
                styles.title,
                {
                  fontSize: 16,
                  fontWeight: "600",
                },
              ]}
            >
              {isWeeklyPlan
                ? t(
                    "premium_access_screen.label.no_payment_text",
                  )
                : ""}
            </Text>

            {/* Purchase */}
            <View
              style={{ marginTop: 5 }}
            >
              <GradientButton
                textStyle={{
                  fontSize: 19,
                  fontWeight: 700,
                }}
                title={`${callToActionText}  ›`}
                onPress={() => {
                  if (
                    !isPurchasing &&
                    selectedProductId
                  ) {
                    purchaseSubscription(
                      selectedProductId,
                    );
                  }
                }}
                disabled={
                  isPurchasing
                }
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleRestore}
                style={styles.footerLink}
              >
                <Text
                  style={
                    styles.footerLinkText
                  }
                >
                  {t(
                    "premium_access_screen.footer.restore",
                  )}
                </Text>

                <View
                  style={
                    styles.underline
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.footerLink}
              >
                <Link href="https://unpile.vercel.app/legal">
                  <Text
                    style={
                      styles.footerLinkText
                    }
                  >
                    {t(
                      "premium_access_screen.footer.terms_privacy",
                    )}
                  </Text>
                </Link>

                <View
                  style={
                    styles.underline
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Restore Alert */}
          {showNoneRestoredAlert && (
            <Modal
              transparent
              animationType="fade"
              visible={
                showNoneRestoredAlert
              }
            >
              <View
                style={
                  styles.alertOverlay
                }
              >
                <View
                  style={styles.alertBox}
                >
                  <Text
                    style={
                      styles.alertTitle
                    }
                  >
                    {t(
                      "premium_access_screen.restore_purchases.title",
                    )}
                  </Text>

                  <Text
                    style={
                      styles.alertMessage
                    }
                  >
                    {t(
                      "premium_access_screen.restore_purchases.message",
                    )}
                  </Text>

                  <TouchableOpacity
                    style={
                      styles.alertButton
                    }
                    onPress={() =>
                      setShowNoneRestoredAlert(
                        false,
                      )
                    }
                  >
                    <Text
                      style={
                        styles.alertButtonText
                      }
                    >
                      {t(
                        "premium_access_screen.restore_purchases.button",
                      )}
                    </Text>
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
// 7. Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
  },
  container: {
    backgroundColor: "#08071A",
    flex: 1,
    paddingHorizontal: 20,
  },
  closeContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
    height: 30,
    alignItems: "center",
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.4)",
  },
  progressSvg: {},
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
    fontWeight: "700",
    textAlign: "center",
    marginTop: 15,
    color: "#FFFFFF",
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
    color: "rgba(255, 255, 255, 0.9)",
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: "#15131F",
    borderColor: "#3A2E6E",
  },
  productOptionSelected: {
    backgroundColor:
      "rgba(123, 79, 224, 0.15)",
    borderColor: "#9B6FF5",
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
    color: "rgba(255, 255, 255, 0.85)",
  },
  productStrikethrough: {
    fontSize: 14,
    textDecorationLine: "line-through",
    color: "rgba(255, 255, 255, 0.35)",
  },
  saveBadge: {
    backgroundColor: "#7B4FE0",
    borderRadius: 6,
    paddingVertical: 4,
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
    borderColor:
      "rgba(255, 255, 255, 0.3)",
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
    backgroundColor: "#7B4FE0",
    borderRadius: 12,
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
    color: "rgba(255, 255, 255, 0.4)",
  },
  underline: {
    height: 1,
    width: "100%",
    backgroundColor:
      "rgba(255, 255, 255, 0.4)",
    marginTop: 1,
  },
  alertOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(0,0,0,0.6)",
  },
  alertBox: {
    backgroundColor: "#15131F",
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
    backgroundColor: "#7B4FE0",
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
    backgroundColor:
      "rgba(0,0,0,0.6)",
  },
  termsBox: {
    backgroundColor: "#15131F",
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
    borderBottomColor: "#3A2E6E",
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
    color: "#FF453A",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default Paywall;