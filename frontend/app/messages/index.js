import {
  View,
  ScrollView,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Dimensions,
  ToastAndroid,
  TextInput,
} from "react-native";
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import styles from "../../styles/styles";
import checkTokenExpiration from "../../util/checkToken";
import { useRouter } from "expo-router";
const screenHeight = Dimensions.get("window").height;
import { PUBLIC_BACKEND_URL, LOCAL_BACKEND_URL } from "@env";

const Messages = () => {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [receiver, setReceiver] = useState("");
  const [loading, setLoading] = useState(false);
  const backendUrl =
    PUBLIC_BACKEND_URL || LOCAL_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    const checkToken = async () => {
      const tokenValid = await checkTokenExpiration();
      if (!tokenValid) {
        setLoading(false);
        router.replace("/");
      }
    };
    checkToken();
  }, []);

  const getMessages = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const tokenValid = await checkTokenExpiration();
      if (!tokenValid) {
        setLoading(false);
        router.replace("/");
      }
      const token = await SecureStore.getItemAsync("token");
      const response = await axios.get(`${backendUrl}/messages/get`, {
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${token}`,
        },
      });
      const messages = response.data.data;
      setMessages(messages);
      setLoading(false);
    } catch (error) {
      console.log(error);
      ToastAndroid.show("Error getting messages", ToastAndroid.SHORT);
      setLoading(false);
    }
  };

  const attemptMessageSend = async () => {
    if (loading) return;
    setLoading(true);
    if (!subject || !message || !receiver || !username) {
      ToastAndroid.show("Please fill in all fields", ToastAndroid.SHORT);
      setLoading(false);
      return;
    }
    try {
      const tokenValid = await checkTokenExpiration();
      if (!tokenValid) {
        setLoading(false);
        router.replace("/");
      }
      const token = await SecureStore.getItemAsync("token");
      const response = await axios.post(
        `${backendUrl}/messages/send`,
        {
          subject: subject,
          receiver: receiver,
          message: message,
          date: new Date(),
        },
        {
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const responseMessage = response.data.message;
      console.log(responseMessage);
      ToastAndroid.show(responseMessage, ToastAndroid.SHORT);
      if (responseMessage === "Message successfully sent") {
        getMessages(username);
        setSubject("");
        setMessage("");
        setReceiver("");
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      ToastAndroid.show("Error sending message", ToastAndroid.SHORT);
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUserMessages = async () => {
      const username = await SecureStore.getItemAsync("username");
      setUsername(username);
      getMessages(username);
    };
    getUserMessages();
  }, []);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Stack.Screen
        options={{
          headerShadowVisible: false,
          headerTitle: "",
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ justifyContent: "center", alignItems: "center" }}>
        <TextInput
          placeholder="Subject"
          style={styles.defaultInput}
          value={subject}
          onChangeText={setSubject}
        />
        <TextInput
          placeholder="Message"
          value={message}
          onChangeText={setMessage}
          style={[
            styles.defaultInput,
            {
              marginVertical: 12,
              height: screenHeight * 0.1,
              textAlignVertical: "top",
            },
          ]}
        />
        <TextInput
          placeholder="Send to"
          value={receiver}
          onChangeText={setReceiver}
          style={[
            styles.defaultInput,
            {
              marginBottom: 12,
            },
          ]}
        />
        <TouchableOpacity style={styles.defaultBtn} onPress={attemptMessageSend}>
          <Text
            style={{
              fontSize: 18,
            }}>
            Send Message
          </Text>
        </TouchableOpacity>
        <View
          style={[
            styles.hospitalContainer,
            {
              height: screenHeight * 0.5,
            },
          ]}>
          <ScrollView>
            {messages &&
              messages.map((message, index) => {
                const messageDate = new Date(message.date);
                return (
                  <View key={index} style={styles.resultContainer}>
                    <Text style={{ fontSize: 18 }}>{message.subject}</Text>
                    <Text style={{ fontSize: 16 }}>From: {message.sender}</Text>
                    <Text style={{ fontSize: 16 }}>To: {message.receiver}</Text>
                    <Text style={{ fontSize: 16 }}>{message.message}</Text>
                    <Text style={{ fontSize: 16 }}>
                      {messageDate.toLocaleDateString() + " " + messageDate.toLocaleTimeString()}
                    </Text>
                  </View>
                );
              })}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Messages;
