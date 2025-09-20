import React, { useRef, useState, useEffect, useCallback } from "react";

// Type definitions
interface ApiResponse {
  id?: string;
  client_secret?: {
    value: string;
  };
}

interface SessionUpdateEvent {
  type: string;
  session: {
    instructions: string;
  };
}

interface GuideComponentProps {
  touristPlace?: string;
}

const GuideComponent: React.FC<GuideComponentProps> = ({ touristPlace = "" }) => {
  const WEBRTC_URL: string = "https://swedencentral.realtimeapi-preview.ai.azure.com/v1/realtimertc";
  const DEPLOYMENT: string = "gpt-realtime";
  const API_URL: string = "https://roamrelicaapi.politeground-71fcc535.eastus2.azurecontainerapps.io/oi/getEphermalKey";

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localTrackRef = useRef<MediaStreamTrack | null>(null);

  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState<boolean>(false);

  const system_instructions: string = `You are a personal tourist guide specialized in history. 
#####
Behavior Rules:
#####
When given the name or location of a place (e.g., Statue of Liberty, Qutub Minar, Central Park), provide only historical information about that place.
Focus on:
Origins and construction (who built it, when, why).
Key historical events associated with it.
Cultural or political significance over time.
Interesting historical facts and anecdotes.
Do not provide unrelated information (e.g., hotels, food, travel itineraries, modern-day visitor details) unless explicitly asked.
Keep the explanation concise, engaging, and informative—like a human tourist guide would narrate.

If the place has no notable history, politely respond with:
'I could not find significant historical details about this location.'

#####
Example Input → Output
Input: Qutub Minar

Output:
Qutub Minar, built in 1193 by Qutb-ud-din Aibak, is one of the tallest brick minarets in the world. It marked the beginning of Muslim rule in India and symbolized the triumph of Islam over Delhi’s last Hindu kingdom. Successive rulers added to its structure, making it a layered timeline of Indo-Islamic architecture."
######

Greet the user and start providing details about "${touristPlace}"`;

  const logMessage = useCallback((message: string): void => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    //console.log(message);
  }, []);

  const StartSession = async (): Promise<void> => {
    try {
      logMessage("Requesting ephemeral key...");
      const response: Response = await fetch(API_URL, { method: "GET" });
      if (!response.ok) throw new Error("API request failed");
      const data: ApiResponse = await response.json();
      const sid: string | undefined = data.id;
      const ephemeralKey: string | undefined = data.client_secret?.value;
      logMessage("Ephemeral Key Received: ***");
      logMessage("WebRTC Session Id = " + (sid || "(no id)"));
      if (ephemeralKey) {
        await init(ephemeralKey);
        setRunning(true);
      } else {
        throw new Error("No ephemeral key received");
      }
    } catch (error) {
      console.error("Error fetching ephemeral key:", error);
      logMessage("Error fetching ephemeral key: " + ((error as Error).message || error));
    }
  };

  const init = async (ephemeralKey: string): Promise<void> => {
    stopSession();
    const pc: RTCPeerConnection = new RTCPeerConnection();
    pcRef.current = pc;
    
    if (!audioRef.current) {
      const audioEl: HTMLAudioElement = document.createElement("audio");
      audioEl.autoplay = true;
      audioRef.current = audioEl;
      document.body.appendChild(audioEl);
    }
    
    pc.ontrack = (event: RTCTrackEvent): void => {
      if (audioRef.current) audioRef.current.srcObject = event.streams[0];
      logMessage("Remote audio track received");
    };
    
    try {
      const clientMedia: MediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack: MediaStreamTrack | undefined = clientMedia.getAudioTracks()[0];
      if (audioTrack) {
        localTrackRef.current = audioTrack;
        pc.addTrack(audioTrack);
        logMessage("Added local audio track");
      }
    } catch (err) {
      logMessage("Error accessing microphone: " + (err as Error).message);
    }
    
    const dataChannel: RTCDataChannel = pc.createDataChannel("realtime-channel");
    dataChannelRef.current = dataChannel;
    
    dataChannel.addEventListener("open", (): void => {
      logMessage("Data channel is open");
      updateSession();
    });
    
    const offer: RTCSessionDescriptionInit = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    const sdpResponse: Response = await fetch(`${WEBRTC_URL}?model=${DEPLOYMENT}`, {
      method: "POST",
      body: offer.sdp,
      headers: { 
        Authorization: `Bearer ${ephemeralKey}`, 
        "Content-Type": "application/sdp" 
      },
    });
    
    const answer: RTCSessionDescriptionInit = { 
      type: "answer", 
      sdp: await sdpResponse.text() 
    };
    await pc.setRemoteDescription(answer);
    logMessage("SDP handshake completed");
  };

  const updateSession = (): void => {
    const dc = dataChannelRef.current;
    if (!dc || dc.readyState !== "open") return;
    //console.log("Updating session with instructions:", system_instructions);    
    const event: SessionUpdateEvent = { 
      type: "session.update", 
      session: { instructions: system_instructions } 
    };
    dc.send(JSON.stringify(event));
    logMessage("Sent client event: session.update");
  };

  const stopSession = useCallback((): void => {
    try {
      if (dataChannelRef.current) dataChannelRef.current.close();
      if (pcRef.current) pcRef.current.close();
      setRunning(false);
      logMessage("Session closed.");
    } catch (err) {
      console.error(err);
    }
  }, [logMessage]);

  useEffect(() => {
    return () => {
      stopSession();
      if (audioRef.current && audioRef.current.parentElement === document.body) {
        try {
          document.body.removeChild(audioRef.current);
        } catch (e) {
          // Ignore errors when removing element
        }
      }
    };
  }, [stopSession]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'pointer',
      }}
      onClick={running ? stopSession : StartSession}
    >
      <div
        style={{
          background: running ? '#e74c3c' : '#f39c12',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 0.2s ease',
        }}
      >
        {running ? (
          <span style={{ fontSize: '20px', color: 'white' }}>⏹️</span>
        ) : (
          <span style={{ fontSize: '24px' }}>🏛️</span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600' }}>
          {running ? 'Stop Guide' : 'Start Interactive Guide'}
        </h3>
        <div style={{ color: '#666', fontSize: '0.875rem' }}>
          {running 
            ? 'AI guide is active - tap to stop and end session' 
            : 'Get AI-powered historical insights about this location'
          }
        </div>
      </div>
      <svg 
        viewBox="0 0 24 24" 
        fill={running ? '#e74c3c' : '#f39c12'} 
        width="20" 
        height="20"
      >
        {running ? (
          <path d="M6,18L18,6M6,6L18,18" />
        ) : (
          <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
        )}
      </svg>
    </div>
  );
};

export default GuideComponent;