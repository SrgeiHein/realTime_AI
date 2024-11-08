import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import axios from "axios";

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [transcribedText, setTranscribedText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  const getMicrophonePermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      alert(
        "Please grant microphone permissions inside your system's settings"
      );
      return false;
    }
    return true;
  };

  const RECORDING_INTERVAL = 5000; // 5 seconds

  const startRecording = async () => {
    const permission = await getMicrophonePermission();
    if (!permission) return;

    setIsRecording(true);
    recordSegment();
  };

  const recordSegment = async () => {
    if (!isRecording) return;

    const recording = new Audio.Recording();
    try {
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recording.startAsync();
      setRecording(recording);

      // Wait for the recording interval
      setTimeout(async () => {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        // Transcribe the audio
        await transcribeAudio(uri);

        // Clean up and start the next segment
        setRecording(null);
        recordSegment();
      }, RECORDING_INTERVAL);
    } catch (err) {
      console.error("Recording error", err);
    }
  };

  console.log("recording", recording);

  const stopRecording = () => {
    setIsRecording(false);
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // const transcribeAudio = async (uri) => {
  //   try {
  //     setIsTranscribing(true);
  //     // const apiKey = "OPEM_API_KEY";

  //     const formData = new FormData();
  //     formData.append("file", {
  //       uri: uri,
  //       name: "audio.wav",
  //       type: "audio/wav",
  //     });
  //     formData.append("model", "whisper-1");

  //     const response = await axios.post(
  //       "https://api.openai.com/v1/audio/transcriptions",
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //           Authorization: `Bearer ${apiKey}`,
  //         },
  //       }
  //     );

  //     setTranscribedText((prevText) => prevText + " " + response.data.text);
  //   } catch (err) {
  //     console.error("Error transcribing audio", err);
  //   } finally {
  //     setIsTranscribing(false);
  //   }
  // };

  return (
    <View style={styles.container}>
      <Text style={styles.transcribedText}>{transcribedText}</Text>
      {isTranscribing && <ActivityIndicator size="large" color="#0000ff" />}
      <TouchableOpacity style={styles.micButton} onPress={handleMicPress}>
        <MaterialIcons
          name={isRecording ? "stop" : "mic"}
          size={50}
          color="white"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Same styles as before
  container: {
    flex: 1,
    paddingTop: 50,
    justifyContent: "center", // Vertical alignment
    alignItems: "center", // Horizontal alignment
  },
  transcribedText: {
    fontSize: 20,
    margin: 20,
    textAlign: "center",
  },
  micButton: {
    position: "absolute",
    bottom: 20, // Adjust as needed
    alignSelf: "center",
    backgroundColor: "#2196F3",
    borderRadius: 50,
    padding: 15,
  },
});
