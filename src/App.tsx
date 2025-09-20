import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Location, NavigationItem, AudioTrack, CivicAction } from './types';
import HomeScreen from './screens/HomeScreen';
import POIDetailScreen from './screens/POIDetailScreen';
import AudioPlayerScreen from './screens/AudioPlayerScreen';
import CivicActionsScreen from './screens/CivicActionsScreen';
import './App.css';

const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'Home', icon: 'home', path: '/' },
  { id: 'audio', label: 'Audio', icon: 'audio', path: '/audio' },
  { id: 'video', label: 'Video', icon: 'video', path: '/video' },
  { id: 'civic', label: 'Civic', icon: 'civic', path: '/civic' },
  { id: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
];

// Interface for the API response
interface NearbyPOIResponse {
  poi_id: string;
  canonical_name: string;
  short_description: string;
  city: string;
  state: string;
  country: string;
  tags: string;
  published: boolean;
  distance_meters: number;
  content_id: string | null;
  content_variant: string | null;
  content_text: string | null;
  audio_id: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  audio_language: string | null;
  video_id: string | null;
  video_url: string | null;
  video_duration_seconds: number | null;
  video_language: string | null;
  parent_poi_id: string | null; // Added parent_poi_id field
}

// Convert API response to our Location interface
const convertPOIToLocation = (poi: NearbyPOIResponse): Location => {
  return {
    id: poi.poi_id,
    name: poi.canonical_name,
    description: poi.short_description,
    latitude: 17.3848, // From hardcoded coordinates
    longitude: 78.4024, // From hardcoded coordinates
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', // Default image
    audioUrl: poi.audio_url || undefined,
    audioTitle: poi.audio_id ? `Audio Guide - ${poi.canonical_name}` : undefined,
    audioDuration: poi.audio_duration_seconds ? `${Math.floor(poi.audio_duration_seconds / 60)}:${String(poi.audio_duration_seconds % 60).padStart(2, '0')}` : undefined,
    category: 'heritage', // Default category
    distance: `${Math.round(poi.distance_meters)}m`
  };
};

// Fetch key locations from the real API
const fetchKeyLocationsFromAPI = async (currentPOIId?: string): Promise<Location[]> => {
  try {
    // Hardcoded payload as requested
    const payload = {
      latitude: "17.3848",
      longitude: "78.4024", 
      radiusMeters: "500",
      maxResults: 10
    };

    console.log('Fetching key locations with payload:', payload);

    const response = await fetch('https://roamrelicaapi.politeground-71fcc535.eastus2.azurecontainerapps.io/poi/getNearByPOI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NearbyPOIResponse[] = await response.json();
    console.log('API Response:', data);
    
    // Filter out the current POI if its poi_id matches parent_poi_id in any of the results
    // Also filter out any POI that has the same poi_id as the current POI we're viewing
    const filteredData = data.filter(poi => {
      // Skip if this POI's ID matches the current POI we're viewing
      if (currentPOIId && poi.poi_id === currentPOIId) {
        console.log(`Filtering out current POI: ${poi.canonical_name} (${poi.poi_id})`);
        return false;
      }
      
      // Skip if this POI's parent_poi_id matches the current POI we're viewing
      if (currentPOIId && poi.parent_poi_id === currentPOIId) {
        console.log(`Filtering out POI with parent_poi_id matching current POI: ${poi.canonical_name} (parent: ${poi.parent_poi_id})`);
        return false;
      }
      
      return true;
    });
    
    console.log('Filtered POIs:', filteredData);
    
    // Convert API response to our Location format
    const locations = filteredData.map(convertPOIToLocation);
    console.log('Converted locations:', locations);
    
    return locations;

  } catch (error) {
    console.error('Error fetching key locations:', error);
    // Return empty array as fallback
    return [];
  }
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [keyLocations, setKeyLocations] = useState<Location[]>([]);
  const [loadingKeyLocations, setLoadingKeyLocations] = useState(false);

  // Get current active navigation item
  const getActiveNavItem = (pathname: string): string => {
    const item = navigationItems.find(item => item.path === pathname);
    return item?.id || 'home';
  };

  // Handle navigation
  const handleNavigation = (item: NavigationItem) => {
    navigate(item.path);
  };

  // Handle location selection from map
  const handleLocationSelect = async (location: Location) => {
    setSelectedLocation(location);
    setLoadingKeyLocations(true);
    
    try {
      // Fetch key locations from the real API, passing the current POI ID to filter it out
      const keyLocs = await fetchKeyLocationsFromAPI(location.id);
      setKeyLocations(keyLocs);
      console.log('Key locations loaded (filtered):', keyLocs);
    } catch (error) {
      console.error('Failed to load key locations:', error);
      setKeyLocations([]); // Fallback to empty array
    } finally {
      setLoadingKeyLocations(false);
    }
    
    navigate(`/location/${location.id}`);
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Handle audio play
  const handlePlayAudio = (location: Location) => {
    const track: AudioTrack = {
      id: location.id,
      title: location.audioTitle || 'Audio Guide',
      url: location.audioUrl || '',
      duration: location.audioDuration || '0:00',
      locationId: location.id,
    };
    setCurrentTrack(track);
    navigate('/audio');
  };

  // Handle key locations view
  const handleViewKeyLocations = (location: Location) => {
    // In a real app, this would navigate to a key locations screen
    console.log('Viewing key locations for:', location.name);
    alert(`Viewing key locations within ${location.name}. Found ${keyLocations.length} nearby POIs from the API.`);
  };

  // Handle civic action selection
  const handleCivicActionSelect = (action: CivicAction) => {
    // In a real app, this would handle the specific action
    console.log('Civic action selected:', action);
    
    // For demo purposes, show an alert
    switch (action.type) {
      case 'report':
        alert(`Thank you for reporting: ${action.title}. Your report has been submitted to the heritage department.`);
        break;
      case 'volunteer':
        alert(`Thank you for volunteering for: ${action.title}. You will receive further details via email.`);
        break;
      case 'petition':
        alert(`Thank you for signing the petition: ${action.title}. Your voice matters!`);
        break;
      case 'survey':
        alert(`Thank you for participating in: ${action.title}. Your feedback is valuable.`);
        break;
      default:
        alert(`Thank you for your interest in: ${action.title}`);
    }
  };

  // Placeholder screens for navigation items
  const PlaceholderScreen: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
    <div className="app-container">
      <div className="header">
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="screen">
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#666'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>{icon}</div>
          <h2 style={{ marginBottom: '12px', color: '#333' }}>{title} Coming Soon</h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
            This feature is under development and will be available in the next update.
          </p>
        </div>
      </div>
    </div>
  );

  // Show bottom navigation on main screens only - REMOVED FOR CLEANER INTERFACE
  const showBottomNav = false; // Disabled bottom navigation entirely

  return (
    <div className="app-container">
      <Routes>
        <Route 
          path="/" 
          element={<HomeScreen onLocationSelect={handleLocationSelect} />} 
        />
        <Route 
          path="/location/:id" 
          element={
            selectedLocation ? (
              <POIDetailScreen
                location={selectedLocation}
                onBack={handleBack}
                onPlayAudio={handlePlayAudio}
                onReportDamage={() => handleCivicActionSelect({
                  id: 'report-damage',
                  title: 'Report Damaged Signage',
                  description: 'Report damage to heritage signage',
                  type: 'report',
                  icon: '📋'
                })}
                onJoinPetition={() => handleCivicActionSelect({
                  id: 'heritage-petition',
                  title: 'Heritage Petition',
                  description: 'Support heritage preservation',
                  type: 'petition',
                  icon: '📝'
                })}
                onViewKeyLocations={handleViewKeyLocations}
                keyLocations={keyLocations}
              />
            ) : loadingKeyLocations ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
              }}>
                Loading location details and nearby POIs...
              </div>
            ) : (
              <div>Location not found</div>
            )
          } 
        />
        <Route 
          path="/audio" 
          element={
            currentTrack ? (
              <AudioPlayerScreen
                track={currentTrack}
                onBack={handleBack}
                onCivicAction={handleCivicActionSelect}
              />
            ) : (
              <PlaceholderScreen title="Audio" icon="🎵" />
            )
          } 
        />
        <Route 
          path="/video" 
          element={<PlaceholderScreen title="Video" icon="🎬" />} 
        />
        <Route 
          path="/civic" 
          element={
            <CivicActionsScreen 
              onActionSelect={handleCivicActionSelect}
            />
          } 
        />
        <Route 
          path="/profile" 
          element={<PlaceholderScreen title="Profile" icon="👤" />} 
        />
      </Routes>

      {/* Bottom Navigation - REMOVED FOR CLEANER INTERFACE
      {showBottomNav && (
        <BottomNavigation
          items={navigationItems}
          activeItem={getActiveNavItem(location.pathname)}
          onItemClick={handleNavigation}
        />
      )}
      */}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
