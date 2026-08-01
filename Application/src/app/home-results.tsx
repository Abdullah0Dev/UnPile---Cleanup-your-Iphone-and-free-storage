import React from "react";
import { Home } from "@/screens";

const HomePage = () => {
  return <Home />;
};

export default HomePage;

// import Paywall from '@/components/ui/paywall';
// import React, { useState } from 'react';
// import { View, Button, StyleSheet } from 'react-native';

// export default function App() {
//   const [showPaywall, setShowPaywall] = useState(false);

//   return (
//     <View style={styles.container}>
//       <Button title="Show Paywall" onPress={() => setShowPaywall(true)} />
      
//       {/* Pass the dynamic state into the Paywall */}
//       <Paywall 
//         isPresented={showPaywall} 
//         onDismiss={() => setShowPaywall(false)} 
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#08071A', // Match your app background
//   },
// });