import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import { ApiClient, TokenStorage } from "@NursingPracticer/api-client";
import { IService, IBooking, BookingStatus } from "@NursingPracticer/types";

// Setup storage wrapper for API client
const tokenStorage: TokenStorage = {
  getAccessToken: () => AsyncStorage.getItem("accessToken"),
  getRefreshToken: () => AsyncStorage.getItem("refreshToken"),
  setTokens: async (access, refresh) => {
    await AsyncStorage.setItem("accessToken", access);
    await AsyncStorage.setItem("refreshToken", refresh);
  },
  clearTokens: async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
  },
};

// Base configuration
const BACKEND_URL = "http://localhost:4567";
const api = new ApiClient(BACKEND_URL, tokenStorage);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreen] = useState<"AUTH" | "HOME" | "BOOK" | "ACTIVE">("AUTH");
  const [loading, setLoading] = useState(false);

  // Auth form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Business state
  const [services, setServices] = useState<IService[]>([]);
  const [selectedService, setSelectedService] = useState<IService | null>(null);
  const [nearbyNurses, setNearbyNurses] = useState<any[]>([]);
  const [activeBooking, setActiveBooking] = useState<IBooking | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Booking fields
  const [address, setAddress] = useState("123 Health Ave, Medical District");
  const [notes, setNotes] = useState("");

  // Check login state
  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        setIsLoggedIn(true);
        setScreen("HOME");
        fetchServices();
      }
    };
    checkLogin();
  }, []);

  // Socket.IO hook for live updates
  useEffect(() => {
    if (!isLoggedIn) return;

    const initSocket = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const newSocket = io(BACKEND_URL, {
        auth: { token },
      });

      newSocket.on("connect", () => {
        console.log("🔌 Connected to live websocket");
      });

      newSocket.on("booking:status_change", (data: { bookingId: string; status: BookingStatus }) => {
        Alert.alert("Booking Update", `Your booking status is now: ${data.status}`);
        if (activeBooking && activeBooking._id === data.bookingId) {
          setActiveBooking((prev) => prev ? { ...prev, status: data.status } : null);
          if (data.status === BookingStatus.COMPLETED) {
            setScreen("HOME");
            setActiveBooking(null);
          }
        }
      });

      setSocket(newSocket);
    };

    initSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isLoggedIn, activeBooking?._id]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.getServices();
      setServices(res.data);
    } catch (err) {
      console.log("Error fetching services", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email || !phone) {
      Alert.alert("Error", "Please input both email and phone number");
      return;
    }
    setLoading(true);
    try {
      await api.sendOtp({ email, phone, ToCreateProfile: true });
      setOtpSent(true);
      Alert.alert("OTP Sent", "Validation codes sent to email and phone");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!emailOtp || !phoneOtp) {
      Alert.alert("Error", "Please input both validation codes");
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyOtp({ email, phone, emailOtp, phoneOtp });
      await tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      setIsLoggedIn(true);
      setScreen("HOME");
      fetchServices();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await tokenStorage.clearTokens();
    setIsLoggedIn(false);
    setScreen("AUTH");
    setOtpSent(false);
    setEmailOtp("");
    setPhoneOtp("");
  };

  const handleSelectService = async (service: IService) => {
    setSelectedService(service);
    setScreen("BOOK");
    
    // Query nearby nurses (simulating patient coordinate at [34.0522, -118.2437])
    try {
      const res = await api.getNearbyNurses({
        latitude: 34.0522,
        longitude: -118.2437,
        radius: 10,
        serviceId: service._id,
      });
      setNearbyNurses(res.data);
    } catch (err) {
      console.log("Error querying nurses", err);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedService._id) return;
    setLoading(true);
    try {
      const res = await api.createBooking({
        serviceId: selectedService._id,
        scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        address,
        latitude: 34.0522,
        longitude: -118.2437,
        notes,
      });
      setActiveBooking(res.data);
      setScreen("ACTIVE");
      Alert.alert("Success", "Booking requested! Looking for nearest nurse.");
    } catch (err: any) {
      Alert.alert("Booking Failed", err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NursingPracticer</Text>
        {isLoggedIn && (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      {screen === "AUTH" && (
        <View style={styles.content}>
          <Text style={styles.title}>Patient Authentication</Text>
          {!otpSent ? (
            <>
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#8e8e93"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor="#8e8e93"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TouchableOpacity onPress={handleSendOtp} style={styles.button} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP Verification</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                placeholder="Enter Email OTP"
                placeholderTextColor="#8e8e93"
                value={emailOtp}
                onChangeText={setEmailOtp}
                keyboardType="number-pad"
                style={styles.input}
              />
              <TextInput
                placeholder="Enter Phone OTP"
                placeholderTextColor="#8e8e93"
                value={phoneOtp}
                onChangeText={setPhoneOtp}
                keyboardType="number-pad"
                style={styles.input}
              />
              <TouchableOpacity onPress={handleVerifyOtp} style={styles.button} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP & Login</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {screen === "HOME" && (
        <ScrollView style={styles.scrollView}>
          <Text style={styles.sectionTitle}>Home Care Services</Text>
          <FlatList
            data={services}
            keyExtractor={(item) => item._id || ""}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectService(item)}
                style={styles.card}
              >
                <Text style={styles.cardTitle}>{item.name.toUpperCase()}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.cardPrice}>Base Rate: ${item.basePrice}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator color="#007aff" />
              ) : (
                <Text style={styles.emptyText}>No services available</Text>
              )
            }
          />
        </ScrollView>
      )}

      {screen === "BOOK" && selectedService && (
        <ScrollView style={styles.scrollView}>
          <TouchableOpacity onPress={() => setScreen("HOME")} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back to Services</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Confirm Your Booking</Text>
          <View style={styles.priceBreakdown}>
            <Text style={styles.breakdownItem}>Service: {selectedService.name.toUpperCase()}</Text>
            <Text style={styles.breakdownItem}>Base Price: ${selectedService.basePrice}</Text>
            <Text style={styles.breakdownItem}>Estimated Tax (18%): ${(selectedService.basePrice * 0.18).toFixed(2)}</Text>
            <Text style={styles.breakdownItem}>Platform Fee (5%): ${(selectedService.basePrice * 0.05).toFixed(2)}</Text>
            <Text style={styles.totalPrice}>
              Total Estimate: ${(selectedService.basePrice * 1.23).toFixed(2)}
            </Text>
          </View>

          <TextInput
            placeholder="Care Delivery Address"
            placeholderTextColor="#8e8e93"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
          />

          <TextInput
            placeholder="Special instructions or notes for the nurse..."
            placeholderTextColor="#8e8e93"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.multiline]}
          />

          <Text style={styles.nurseCount}>
            👩‍⚕️ {nearbyNurses.length} available nurses within 10 km
          </Text>

          <TouchableOpacity onPress={handleConfirmBooking} style={styles.button} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Request Care Now</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {screen === "ACTIVE" && activeBooking && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Active Booking Tracking</Text>
          <View style={styles.trackingCard}>
            <Text style={styles.trackingLabel}>Booking ID:</Text>
            <Text style={styles.trackingValue}>{activeBooking._id}</Text>

            <Text style={styles.trackingLabel}>Care Status:</Text>
            <Text style={[styles.statusTag, styles[activeBooking.status.toLowerCase() as keyof typeof styles]]}>
              {activeBooking.status}
            </Text>

            <Text style={styles.trackingLabel}>Destination Address:</Text>
            <Text style={styles.trackingValue}>{activeBooking.address}</Text>

            <Text style={styles.trackingLabel}>Scheduled Care Time:</Text>
            <Text style={styles.trackingValue}>
              {new Date(activeBooking.scheduledTime).toLocaleTimeString()}
            </Text>
          </View>

          <Text style={styles.updatesLabel}>🔴 Live updates enabled via WebSockets</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  header: {
    height: 60,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5ea",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007aff",
  },
  logoutBtn: {
    backgroundColor: "#ff3b30",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoutBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#1c1c1e",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1c1c1e",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#c7c7cc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: "#1c1c1e",
  },
  multiline: {
    height: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#007aff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5ea",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007aff",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: "#8e8e93",
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#34c759",
  },
  emptyText: {
    textAlign: "center",
    color: "#8e8e93",
    marginTop: 32,
  },
  backBtn: {
    marginBottom: 16,
  },
  backBtnText: {
    color: "#007aff",
    fontSize: 16,
    fontWeight: "500",
  },
  priceBreakdown: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e5ea",
  },
  breakdownItem: {
    fontSize: 15,
    color: "#3a3a3c",
    marginBottom: 6,
  },
  totalPrice: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#34c759",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e5ea",
    paddingTop: 10,
  },
  nurseCount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3a3a3c",
    marginBottom: 16,
    textAlign: "center",
  },
  trackingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e5ea",
  },
  trackingLabel: {
    fontSize: 13,
    color: "#8e8e93",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  trackingValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1c1c1e",
    marginBottom: 16,
  },
  statusTag: {
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    color: "#ffffff",
    marginBottom: 16,
  },
  pending: {
    backgroundColor: "#ff9500",
  },
  accepted: {
    backgroundColor: "#007aff",
  },
  arrived: {
    backgroundColor: "#5856d6",
  },
  in_progress: {
    backgroundColor: "#af52de",
  },
  completed: {
    backgroundColor: "#34c759",
  },
  cancelled: {
    backgroundColor: "#ff3b30",
  },
  updatesLabel: {
    textAlign: "center",
    color: "#ff9500",
    fontSize: 14,
    marginTop: 16,
    fontWeight: "600",
  },
});
