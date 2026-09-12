import "react-native-gesture-handler";
import { View, Text } from "react-native";

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#ff0000", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#ffffff", fontSize: 24 }}>TEST: App is loading</Text>
    </View>
  );
}