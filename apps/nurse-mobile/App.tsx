import React, { useState, useEffect, useRef } from "react";
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
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import { ApiClient, TokenStorage } from "@NursingPracticer/api-client";
import { IService, IBooking, BookingStatus, SocketEvent } from "@NursingPracticer/types";

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
  const [screen, setScreen] = useState<"AUTH" | "ONBOARDING" | "DASHBOARD" | "ACTIVE_JOB">("AUTH");
  const [loading, setLoading] = useState(false);

  // Auth state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Onboarding fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [certUrl, setCertUrl] = useState("https://b2.files/nursing-license.pdf");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [locationText, setLocationText] = useState("Downtown Hospital Circle");

  // Dashboard & availability states
  const [isOnline, setIsOnline] = useState(false);
  const [services, setServices] = useState<IService[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<any | null>(null);
  const [activeJob, setActiveJob] = useState<IBooking | null>(null);
  
  // Real-time elements
  const [socket, setSocket] = useState<Socket | null>(null);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check login state
  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        setIsLoggedIn(true);
        // Check if verified or needs onboarding
        try {
          const profile = await api.getProfile();
          if (profile.data.role === "nurse") {
            setScreen("DASHBOARD");
          } else {
            setScreen("ONBOARDING");
          }
          fetchServices();
        } catch {
          setScreen("AUTH");
        }
      }
    };
    checkLogin();
  }, []);

  // WebSockets & Location simulation loop
  useEffect(() => {
    if (!isLoggedIn) return;

    const initSocket = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const newSocket = io(BACKEND_URL, {
        auth: { token },
      });

      newSocket.on("connect", () => {
        console.log("🔌 Nurse socket connected");
      });

      // Listen for incoming booking requests
      newSocket.on("booking:request", (data: any) => {
        setIncomingRequest(data);
        // Automatically dismiss request after 30 seconds
        setTimeout(() => {
          setIncomingRequest(null);
        }, 30000);
      });

      newSocket.on("booking:status_change", (data: { bookingId: string; status: BookingStatus }) => {
        if (activeJob && activeJob._id === data.bookingId) {
          setActiveJob((prev) => prev ? { ...prev, status: data.status } : null);
          if (data.status === BookingStatus.CANCELLED) {
            Alert.alert("Job Cancelled", "This job has been cancelled by the patient.");
            setActiveJob(null);
            setScreen("DASHBOARD");
          }
        }
      });

      setSocket(newSocket);
    };

    initSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isLoggedIn, activeJob?._id]);

  // Periodic location simulation when online
  useEffect(() => {
    if (isOnline && socket) {
      // Simulate nurse movement around [34.0522, -118.2437]
      let step = 0;
      locationInterval.current = setInterval(async () => {
        step += 0.001;
        const lat = 34.0522 + step;
        const lng = -118.2437 + step;

        // Update via REST
        try {
          await api.updateLocation({ latitude: lat, longitude: lng, heading: 90 });
          // Also emit live location via sockets
          socket.emit(SocketEvent.LOCATION_UPDATE, {
            latitude: lat,
            longitude: lng,
          });
        } catch (err) {
          console.log("Failed simulation location update", err);
        }
      }, 5000);
    } else {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
    }

    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
    };
  }, [isOnline, socket]);

  const fetchServices = async () => {
    try {
      const res = await api.getServices();
      setServices(res.data);
    } catch (err) {
      console.log("Error loading services", err);
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
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await api.verifyOtp({ email, phone, emailOtp, phoneOtp });
      await tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      setIsLoggedIn(true);

      const profile = await api.getProfile();
      if (profile.data.role === "nurse") {
        setScreen("DASHBOARD");
      } else {
        setScreen("ONBOARDING");
      }
      fetchServices();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async () => {
    if (!licenseNumber || selectedServices.length === 0) {
      Alert.alert("Error", "Please fill in all verification fields");
      return;
    }
    setLoading(true);
    try {
      await api.submitNurseVerification({
        licenseNumber,
        certificateFile: certUrl,
        services: selectedServices,
        location: locationText,
      });
      Alert.alert(
        "Verification Submitted",
        "Your profile is pending admin approval. You will be logged out until approved.",
        [
          {
            text: "OK",
            onPress: handleLogout,
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Onboarding Error", err?.message || "Verification submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices((prev) => prev.filter((id) => id !== serviceId));
    } else {
      setSelectedServices((prev) => [...prev, serviceId]);
    }
  };

  const handleAcceptBooking = async () => {
    if (!incomingRequest) return;
    setLoading(true);
    try {
      const res = await api.updateBookingStatus(incomingRequest.bookingId, BookingStatus.ACCEPTED);
      setActiveJob(res.data);
      setIncomingRequest(null);
      setScreen("ACTIVE_JOB");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to accept booking");
      setIncomingRequest(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNextJobState = async () => {
    if (!activeJob || !activeJob._id) return;
    setLoading(true);
    try {
      let nextStatus = BookingStatus.ARRIVED;
      if (activeJob.status === BookingStatus.ACCEPTED) nextStatus = BookingStatus.ARRIVED;
      else if (activeJob.status === BookingStatus.ARRIVED) nextStatus = BookingStatus.IN_PROGRESS;
      else if (activeJob.status === BookingStatus.IN_PROGRESS) nextStatus = BookingStatus.COMPLETED;

      const res = await api.updateBookingStatus(activeJob._id, nextStatus);
      setActiveJob(res.data);

      if (nextStatus === BookingStatus.COMPLETED) {
        Alert.alert("Care Complete", "You have finished this service booking!");
        setActiveJob(null);
        setScreen("DASHBOARD");
      }
    } catch (err: any) {
      Alert.alert("Status Update Error", err?.message || "Failed to update state");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await tokenStorage.clearTokens();
    setIsLoggedIn(false);
    setIsOnline(false);
    setScreen("AUTH");
    setOtpSent(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NursePracticer</Text>
        {isLoggedIn && (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      {screen === "AUTH" && (
        <View style={styles.content}>
          <Text style={styles.title}>Practitioner Authentication</Text>
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

      {screen === "ONBOARDING" && (
        <ScrollView style={styles.scrollView}>
          <Text style={styles.sectionTitle}>Nurse Onboarding</Text>
          <Text style={styles.subLabel}>License Number</Text>
          <TextInput
            placeholder="e.g. RN-9827364-US"
            placeholderTextColor="#8e8e93"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            style={styles.input}
          />

          <Text style={styles.subLabel}>Practice Location</Text>
          <TextInput
            placeholder="e.g. City Central, Sector 4"
            placeholderTextColor="#8e8e93"
            value={locationText}
            onChangeText={setLocationText}
            style={styles.input}
          />

          <Text style={styles.subLabel}>Select Services You Provide</Text>
          {services.map((item) => {
            const isSelected = selectedServices.includes(item._id || "");
            return (
              <TouchableOpacity
                key={item._id}
                onPress={() => handleToggleService(item._id || "")}
                style={[styles.serviceCheck, isSelected && styles.serviceCheckActive]}
              >
                <Text style={[styles.serviceCheckText, isSelected && styles.serviceCheckTextActive]}>
                  {item.name.toUpperCase()} (${item.basePrice}/hr)
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={handleOnboardingSubmit} style={styles.button} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit Verification Dossier</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {screen === "DASHBOARD" && (
        <View style={styles.content}>
          <View style={styles.onlineToggleCard}>
            <Text style={styles.toggleText}>
              Duty Status: {isOnline ? "🟢 ONLINE" : "⚪️ OFFLINE"}
            </Text>
            <Switch value={isOnline} onValueChange={setIsOnline} />
          </View>

          {incomingRequest ? (
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>🚨 INCOMING CARE REQUEST</Text>
              <Text style={styles.alertDetails}>Service: {incomingRequest.serviceName.toUpperCase()}</Text>
              <Text style={styles.alertDetails}>Patient: {incomingRequest.patientName}</Text>
              <Text style={styles.alertDetails}>Payout Offer: ${incomingRequest.totalPrice}</Text>
              <Text style={styles.alertTimer}>Dismisses in 30s...</Text>
              
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => setIncomingRequest(null)} style={[styles.actionBtn, styles.declineBtn]}>
                  <Text style={styles.actionBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAcceptBooking} style={[styles.actionBtn, styles.acceptBtn]}>
                  <Text style={styles.actionBtnText}>Accept Job</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.waitingCard}>
              <Text style={styles.waitingText}>
                {isOnline
                  ? "Waiting for dispatch alerts nearby..."
                  : "Go online to receive incoming patient requests"}
              </Text>
            </View>
          )}
        </View>
      )}

      {screen === "ACTIVE_JOB" && activeJob && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Active Patient Dispatch</Text>
          <View style={styles.jobCard}>
            <Text style={styles.jobLabel}>Patient Location:</Text>
            <Text style={styles.jobValue}>{activeJob.address}</Text>

            <Text style={styles.jobLabel}>Payout:</Text>
            <Text style={styles.jobValue}>${activeJob.pricing.totalPrice}</Text>

            <Text style={styles.jobLabel}>Current Status:</Text>
            <Text style={[styles.statusTag, styles[activeJob.status.toLowerCase() as keyof typeof styles]]}>
              {activeJob.status}
            </Text>
          </View>

          <TouchableOpacity onPress={handleNextJobState} style={styles.button} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {activeJob.status === BookingStatus.ACCEPTED && "I have Arrived at Patient Location"}
                {activeJob.status === BookingStatus.ARRIVED && "Start Care Service"}
                {activeJob.status === BookingStatus.IN_PROGRESS && "Complete Care Service"}
              </Text>
            )}
          </TouchableOpacity>
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
    color: "#af52de", // Practitioner Theme Color
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
  subLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8e8e93",
    marginBottom: 6,
    textTransform: "uppercase",
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
  button: {
    backgroundColor: "#af52de",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  serviceCheck: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  serviceCheckActive: {
    backgroundColor: "#f5e6fe",
    borderColor: "#af52de",
  },
  serviceCheckText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#3a3a3c",
  },
  serviceCheckTextActive: {
    color: "#af52de",
    fontWeight: "bold",
  },
  onlineToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    marginBottom: 24,
  },
  toggleText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1c1c1e",
  },
  waitingCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  waitingText: {
    fontSize: 16,
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 22,
  },
  alertCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#ff9500",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff9500",
    marginBottom: 16,
    textAlign: "center",
  },
  alertDetails: {
    fontSize: 15,
    color: "#3a3a3c",
    marginBottom: 10,
    lineHeight: 20,
  },
  alertTimer: {
    color: "#ff3b30",
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionBtn: {
    flex: 0.48,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  declineBtn: {
    backgroundColor: "#e5e5ea",
  },
  acceptBtn: {
    backgroundColor: "#af52de",
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
  },
  jobCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    marginBottom: 24,
  },
  jobLabel: {
    fontSize: 13,
    color: "#8e8e93",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  jobValue: {
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
});
