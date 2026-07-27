import * as Device from "expo-device";
import {
  Button,
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image"; // ✅ Use expo-image

import { AnimatedIcon } from "@/components/animated-icon";
import { HintRow } from "@/components/hint-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import ExpoPhotoAnalyzerModule from "../../modules/expo-photo-analyzer/src/ExpoPhotoAnalyzerModule";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

interface DuplicateGroup {
  bestAssetId: string;
  duplicateAssetIds: string[];
}

interface AnalysisResult {
  screenshots: string[];
  screenshotCandidates: string[];
  duplicateGroups: DuplicateGroup[];
  clutter: string[];
  blurry: string[];
  livePhotos: string[];
  livePhotoCandidates: string[];
  totalSavingsBytes: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Format bytes
// ─────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Thumbnail Component (using expo-image with ph:// URI)
// ─────────────────────────────────────────────────────────────────────────

function AssetThumbnail({ assetId, size }: { assetId: string; size: number }) {
  return (
    <Image
      source={{ uri: `ph://${assetId}` }}
      style={{ width: size, height: size }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Summary Section
// ─────────────────────────────────────────────────────────────────────────

function SummarySection({ result }: { result: AnalysisResult }) {
  const totalDuplicateAssets = result.duplicateGroups.reduce(
    (sum, g) => sum + g.duplicateAssetIds.length,
    0
  );
  const totalBestPhotos = result.duplicateGroups.length;

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.sectionTitle}>Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>📸 Screenshots:</Text>
        <Text style={styles.summaryValue}>{result.screenshots.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>⏰ Screenshot candidates:</Text>
        <Text style={styles.summaryValue}>{result.screenshotCandidates.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>📁 Clutter:</Text>
        <Text style={styles.summaryValue}>{result.clutter.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>🔄 Duplicate groups:</Text>
        <Text style={styles.summaryValue}>{result.duplicateGroups.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>⭐ Best photos:</Text>
        <Text style={styles.summaryValue}>{totalBestPhotos}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>🗑️ Duplicates to delete:</Text>
        <Text style={styles.summaryValue}>{totalDuplicateAssets}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>👁️ Blurry photos:</Text>
        <Text style={styles.summaryValue}>{result.blurry.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>🎬 Live Photos:</Text>
        <Text style={styles.summaryValue}>{result.livePhotos.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>💾 Total savings:</Text>
        <Text style={[styles.summaryValue, styles.savingsText]}>
          {formatBytes(result.totalSavingsBytes)}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Grid Section
// ─────────────────────────────────────────────────────────────────────────

function GridSection({
  title,
  subtitle,
  items,
  badge,
  badgeColor,
  borderColor,
  numColumns = 4,
}: {
  title: string;
  subtitle: string;
  items: string[];
  badge?: string;
  badgeColor?: string;
  borderColor?: string;
  numColumns?: number;
}) {
  if (items.length === 0) return null;

  const data = items.map((id) => ({ id }));

  const renderItem = ({ item }: { item: { id: string } }) => (
    <View style={styles.gridItem}>
      <AssetThumbnail assetId={item.id} size={80} />
      {badge && (
        <View
          style={[
            styles.badgeOverlay,
            { backgroundColor: badgeColor || "#666" },
          ]}
        >
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {borderColor && (
        <View
          style={[
            styles.borderOverlay,
            { borderColor: borderColor },
          ]}
        />
      )}
    </View>
  );

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        scrollEnabled={false}
        contentContainerStyle={styles.gridContainer}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Duplicate Groups Section
// ─────────────────────────────────────────────────────────────────────────

function DuplicateGroupsSection({ groups }: { groups: DuplicateGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Duplicates</Text>
        <Text style={styles.sectionSubtitle}>{groups.length} groups</Text>
      </View>
      {groups.map((group, index) => (
        <View key={index} style={styles.duplicateGroup}>
          <View style={styles.bestLabelRow}>
            <Text style={styles.bestLabelIcon}>👑</Text>
            <Text style={styles.bestLabelText}>Best</Text>
          </View>
          <View style={styles.duplicateGroupRow}>
            {/* Best */}
            <View style={[styles.thumbnailWrapper, { width: 80, height: 80 }]}>
              <AssetThumbnail assetId={group.bestAssetId} size={80} />
              <View style={[styles.borderOverlay, { borderColor: "green" }]} />
            </View>
            {/* Duplicates */}
            {group.duplicateAssetIds.map((id) => (
              <View key={id} style={[styles.thumbnailWrapper, { width: 80, height: 80 }]}>
                <AssetThumbnail assetId={id} size={80} />
                <View style={[styles.borderOverlay, { borderColor: "red" }]} />
                <View
                  style={[
                    styles.badgeOverlay,
                    { backgroundColor: "rgba(255,0,0,0.7)" },
                  ]}
                >
                  <Text style={styles.badgeText}>🗑️</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setPermissionGranted(status === "granted");
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setPermissionGranted(status === "granted");
  };

  const runAnalysis = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const data = await ExpoPhotoAnalyzerModule.analyzePhotos();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <AnimatedIcon />
            <ThemedText type="title" style={styles.title}>
              Photo Analyzer
            </ThemedText>
          </View>

          {/* Action Button */}
          {!permissionGranted ? (
            <Button title="Request Photo Access" onPress={requestPermission} />
          ) : isScanning ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Scanning photos...</Text>
            </View>
          ) : result ? (
            <View style={styles.resultContainer}>
              <SummarySection result={result} />

              {/* Screenshots */}
              <GridSection
                title="Screenshots"
                subtitle={`${result.screenshots.length} total, ${result.screenshotCandidates.length} candidates`}
                items={result.screenshots}
                badge="🗑️"
                badgeColor="rgba(255,0,0,0.7)"
                borderColor="red"
              />

              {/* Clutter */}
              <GridSection
                title="Clutter"
                subtitle={`${result.clutter.length} items`}
                items={result.clutter}
                badge="🧹"
                badgeColor="rgba(128,128,128,0.7)"
                borderColor="gray"
              />

              {/* Duplicates */}
              <DuplicateGroupsSection groups={result.duplicateGroups} />

              {/* Blurry */}
              <GridSection
                title="Blurry Photos"
                subtitle={`${result.blurry.length} photos`}
                items={result.blurry}
                badge="⚠️"
                badgeColor="rgba(255,165,0,0.7)"
                borderColor="orange"
              />

              {/* Live Photos */}
              <GridSection
                title="Live Photos"
                subtitle={`${result.livePhotos.length} photos`}
                items={result.livePhotos}
                badge="LIVE"
                badgeColor="rgba(0,122,255,0.8)"
              />
            </View>
          ) : (
            <Button title="Start Scanning" onPress={runAnalysis} />
          )}

          {error && (
            <Text style={styles.errorText}>Error: {error}</Text>
          )}

          {/* Dev Hints */}
          <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <HintRow
              title="Try editing"
              hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
            />
            <HintRow title="Dev tools" hint={getDevMenuHint()} />
          </ThemedView>
        </ScrollView>

        {Platform.OS === "web" && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helper: getDevMenuHint
// ─────────────────────────────────────────────────────────────────────────

function getDevMenuHint() {
  if (Platform.OS === "web") {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === "android" ? "cmd+m (or ctrl+m)" : "cmd+d";
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    gap: Spacing.four,
    paddingVertical: Spacing.four,
  },
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.four,
  },
  title: {
    textAlign: "center",
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: "stretch",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  loadingContainer: {
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.four,
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
  },
  resultContainer: {
    gap: Spacing.four,
    alignSelf: "stretch",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: Spacing.two,
  },
  summaryContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#ccc",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  savingsText: {
    color: "#4CAF50",
  },
  sectionContainer: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  gridContainer: {
    gap: 4,
  },
  gridItem: {
    width: 80,
    height: 80,
    margin: 2,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  thumbnailWrapper: {
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeOverlay: {
    position: "absolute",
    top: 4,
    right: 4,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  badgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  borderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 4,
  },
  duplicateGroup: {
    marginBottom: Spacing.two,
  },
  bestLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.one,
  },
  bestLabelIcon: {
    fontSize: 14,
  },
  bestLabelText: {
    fontSize: 12,
    color: "#E8B84B",
    fontWeight: "bold",
  },
  duplicateGroupRow: {
    flexDirection: "row",
    gap: 4,
  },
});