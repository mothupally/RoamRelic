import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Location, NavigationItem, AudioTrack, CivicAction } from './types';
import BottomNavigation from './components/BottomNavigation';
import { LoadingSpinner } from './utils/performance';
import './App.css';

// Lazy load screens for better performance
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const POIDetailScreen = lazy(() => import('./screens/POIDetailScreen'));
const AudioPlayerScreen = lazy(() => import('./screens/AudioPlayerScreen'));
const CivicActionsScreen = lazy(() => import('./screens/CivicActionsScreen'));

// Mock data
const mockAudioTrack: AudioTrack = {
  id: '1',
  title: 'Welcome to the Old Fort Gate...',
  url: '/api/audio/old-fort-gate.mp3',
  duration: '0:42',
  locationId: '1',
};

const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'Home', icon: 'home', path: '/' },
  { id: 'audio', label: 'Audio', icon: 'audio', path: '/audio' },
  { id: 'video', label: 'Video', icon: 'video', path: '/video' },
  { id: 'civic', label: 'Civic', icon: 'civic', path: '/civic' },
  { id: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
];

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);

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
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
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

  // Handle civic action selection
  const handleCivicActionSelect = (action: CivicAction) => {
    // In a real app, this would handle the specific action
    //console.log('Civic action selected:', action);
    
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

  // Show bottom navigation on main screens only
  const showBottomNav = ['/', '/audio', '/video', '/civic', '/profile'].includes(location.pathname);

  return (
    <div className="app-container">
      <Suspense fallback={<LoadingSpinner />}>
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
                />
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
      </Suspense>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNavigation
          items={navigationItems}
          activeItem={getActiveNavItem(location.pathname)}
          onItemClick={handleNavigation}
        />
      )}
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