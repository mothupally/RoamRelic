import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Location, UserLocation } from '../types';
import Header from '../components/Header';
import { fetchHistoricPlacesWithCORS, getFallbackHistoricPlaces } from '../services/googlePlacesApi';

// Interface for dropped pins
interface DroppedPin {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  note?: string;
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Legend Component - Redesigned to be more compact
const MapLegend: React.FC<{ 
  isVisible: boolean; 
  onToggle: () => void;
  historicPlacesCount: number;
  droppedPinsCount: number;
}> = ({ isVisible, onToggle, historicPlacesCount, droppedPinsCount }) => {
  return (
    <>
      {/* Legend Toggle Button - More compact */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          right: '16px',
          zIndex: 1001,
        }}
      >
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            color: '#333',
            fontSize: '0.75rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Toggle map legend"
        >
          🗂️ {isVisible ? 'Hide' : 'Legend'}
        </button>
      </div>

      {/* Legend Panel - Much more compact */}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            top: '110px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '140px',
            maxWidth: '180px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
            zIndex: 1001,
          }}
        >
          <h4 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            color: '#333',
          }}>
            Map Legend
          </h4>
          
          {/* User Location - Compact */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '6px',
            fontSize: '0.75rem'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#5dade2',
              border: '2px solid white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              marginRight: '8px',
              flexShrink: 0
            }} />
            <span style={{ color: '#333' }}>Your Location</span>
          </div>

          {/* Heritage Sites - Compact */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '6px',
            fontSize: '0.75rem'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#e74c3c',
              border: '2px solid white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              marginRight: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              flexShrink: 0
            }}>
              🏛️
            </div>
            <span style={{ color: '#333' }}>
              Heritage ({historicPlacesCount})
            </span>
          </div>

          {/* Dropped Pins - Compact */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '6px',
            fontSize: '0.75rem'
          }}>
            <div style={{
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              background: '#f39c12',
              border: '2px solid white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              marginRight: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              flexShrink: 0
            }}>
              📌
            </div>
            <span style={{ color: '#333' }}>
              Pins ({droppedPinsCount})
            </span>
          </div>

          {/* Quick tip - Very compact */}
          <div style={{
            marginTop: '8px',
            padding: '4px 6px',
            background: 'rgba(93, 173, 226, 0.1)',
            borderRadius: '4px',
            fontSize: '0.65rem',
            color: '#555',
            lineHeight: '1.2'
          }}>
            💡 Tap markers for details
          </div>
        </div>
      )}
    </>
  );
};

// Custom hook for location services
const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return { location, error, loading, getCurrentLocation };
};

// Component to handle map centering
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);

  return null;
};

// Component to handle map click events for pin dropping
const MapClickHandler: React.FC<{ 
  onMapClick: (lat: number, lng: number) => void;
  pinDropMode: boolean;
}> = ({ onMapClick, pinDropMode }) => {
  useMapEvents({
    click: (e) => {
      if (pinDropMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

interface HomeScreenProps {
  onLocationSelect: (location: Location) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onLocationSelect }) => {
  const { location: userLocation, error, loading, getCurrentLocation } = useUserLocation();
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default to center of India
  const [droppedPins, setDroppedPins] = useState<DroppedPin[]>([]);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [historicPlaces, setHistoricPlaces] = useState<Location[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [initialLocationRequested, setInitialLocationRequested] = useState(false);
  const [showLegend, setShowLegend] = useState(true); // Show legend by default

  // Custom icon for user location
  const userLocationIcon = L.divIcon({
    html: `<div style="background: #5dade2; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: 'user-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  // Custom icon for heritage locations
  const heritageIcon = L.divIcon({
    html: `<div style="background: #e74c3c; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">🏛️</div>`,
    className: 'heritage-location-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Custom icon for dropped pins
  const droppedPinIcon = L.divIcon({
    html: `<div style="background: #f39c12; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">📌</div>`,
    className: 'dropped-pin-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  // Function to load historic places based on location (now using service)
  const loadHistoricPlaces = async (latitude: number, longitude: number) => {
    console.log('🎯 HomeScreen: Starting to load historic places for:', { latitude, longitude });
    setLoadingPlaces(true);
    
    try {
      console.log('📞 HomeScreen: Calling fetchHistoricPlacesWithCORS...');
      const fetchedPlaces = await fetchHistoricPlacesWithCORS(latitude, longitude);
      console.log('✅ HomeScreen: Received places:', fetchedPlaces);
      
      setHistoricPlaces(fetchedPlaces);
      console.log(`📊 HomeScreen: Set ${fetchedPlaces.length} historic places in state`);
    } catch (error) {
      console.error('💥 HomeScreen: Failed to load historic places:', error);
      // Fallback to demo data if service fails
      console.log('🔄 HomeScreen: Using fallback data...');
      const fallbackPlaces = getFallbackHistoricPlaces(latitude, longitude);
      setHistoricPlaces(fallbackPlaces);
      console.log('📍 HomeScreen: Set fallback places:', fallbackPlaces);
    } finally {
      setLoadingPlaces(false);
      console.log('✅ HomeScreen: Finished loading places');
    }
  };

  // Request current location on component mount
  useEffect(() => {
    if (!initialLocationRequested) {
      setInitialLocationRequested(true);
      getCurrentLocation();
    }
  }, [getCurrentLocation, initialLocationRequested]);

  // Update map center and load places when user location is available
  useEffect(() => {
    console.log('🔄 HomeScreen: useEffect triggered with userLocation:', userLocation);
    if (userLocation) {
      console.log('📍 HomeScreen: Setting map center and loading places...');
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      loadHistoricPlaces(userLocation.latitude, userLocation.longitude);
    } else {
      console.log('⏳ HomeScreen: No user location yet, waiting...');
    }
  }, [userLocation]);

  const handleCurrentLocationClick = () => {
    getCurrentLocation();
  };

  // Handle pin dropping
  const handleMapClick = (lat: number, lng: number) => {
    if (pinDropMode) {
      const timestamp = new Date();
      const newPin: DroppedPin = {
        id: `pin-${Date.now()}`,
        latitude: lat,
        longitude: lng,
        timestamp: timestamp,
      };
      
      // Create a Location object for the dropped pin
      const pinLocation: Location = {
        id: newPin.id,
        name: 'My Dropped Pin',
        description: `Pin dropped on ${timestamp.toLocaleDateString()} at ${timestamp.toLocaleTimeString()}. Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        category: 'other',
        distance: 'Just dropped'
      };
      
      setDroppedPins(prev => [...prev, newPin]);
      setPinDropMode(false);
      
      // Automatically select the dropped pin location
      onLocationSelect(pinLocation);
    }
  };

  // Toggle pin drop mode
  const togglePinDropMode = () => {
    setPinDropMode(!pinDropMode);
  };

  // Remove a dropped pin
  const removePin = (pinId: string) => {
    setDroppedPins(prev => prev.filter(pin => pin.id !== pinId));
  };

  // Handle clicking on an existing dropped pin
  const handlePinClick = (pin: DroppedPin) => {
    const pinLocation: Location = {
      id: pin.id,
      name: 'My Dropped Pin',
      description: `Pin dropped on ${pin.timestamp.toLocaleDateString()} at ${pin.timestamp.toLocaleTimeString()}. Coordinates: ${pin.latitude.toFixed(6)}, ${pin.longitude.toFixed(6)}`,
      latitude: pin.latitude,
      longitude: pin.longitude,
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      category: 'other',
      distance: `Dropped ${pin.timestamp.toLocaleDateString()}`
    };
    onLocationSelect(pinLocation);
  };

  const getCurrentLocationButton = (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {/* Pin Drop Mode Toggle Button */}
      <button
        onClick={togglePinDropMode}
        style={{
          background: pinDropMode ? '#f39c12' : 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          color: pinDropMode ? 'white' : '#f39c12',
          fontSize: '16px',
        }}
        title={pinDropMode ? 'Exit pin drop mode' : 'Drop a pin'}
      >
        📌
      </button>
      
      {/* Current Location Button */}
      <button
        onClick={handleCurrentLocationClick}
        disabled={loading}
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          color: '#5dade2',
        }}
      >
        {loading ? (
          <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div className="app-container">
      <Header title="Home" rightAction={getCurrentLocationButton} />
      
      <div className="screen" style={{ padding: 0, position: 'relative' }}>
        {/* Map Container - Full height now that bottom navigation is removed */}
        <div className="map-container" style={{ height: 'calc(100vh - 140px)', borderRadius: 0 }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ 
              height: '100%', 
              width: '100%',
              cursor: pinDropMode ? 'crosshair' : 'grab'
            }}
            zoomControl={false}
          >
            <MapController center={mapCenter} />
            <MapClickHandler onMapClick={handleMapClick} pinDropMode={pinDropMode} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User location marker */}
            {userLocation && (
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={userLocationIcon}
              >
                <Popup>
                  <div>
                    <strong>Your Location</strong>
                    <br />
                    Accuracy: ±{userLocation.accuracy?.toFixed(0)}m
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Historic places markers from Google Places API */}
            {historicPlaces.map((place) => (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={heritageIcon}
                eventHandlers={{
                  click: () => onLocationSelect(place),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>
                      {place.name}
                    </h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>
                      {place.description.substring(0, 100)}...
                    </p>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {place.distance}
                    </div>
                    <button
                      onClick={() => onLocationSelect(place)}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        fontSize: '0.875rem',
                        minHeight: 'auto',
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Dropped pins */}
            {droppedPins.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.latitude, pin.longitude]}
                icon={droppedPinIcon}
                eventHandlers={{
                  click: () => handlePinClick(pin),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📌 My Pin
                    </h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#666' }}>
                      Dropped on {pin.timestamp.toLocaleDateString()} at {pin.timestamp.toLocaleTimeString()}
                    </p>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '8px' }}>
                      Lat: {pin.latitude.toFixed(6)}<br />
                      Lng: {pin.longitude.toFixed(6)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handlePinClick(pin)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          fontSize: '0.875rem',
                          minHeight: 'auto',
                          background: '#f39c12',
                          border: 'none',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => removePin(pin.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.875rem',
                          minHeight: 'auto',
                          background: '#e74c3c',
                          border: 'none',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Map Legend - Now compact */}
        <MapLegend 
          isVisible={showLegend}
          onToggle={() => setShowLegend(!showLegend)}
          historicPlacesCount={historicPlaces.length}
          droppedPinsCount={droppedPins.length}
        />

        {/* Current location button - Better positioned with more space */}
        <div
          style={{
            position: 'absolute',
            bottom: '140px', // Adjusted for new layout
            right: '16px',
            zIndex: 1000,
          }}
        >
          <button
            onClick={handleCurrentLocationClick}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              color: '#5dade2',
              fontSize: '20px',
            }}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
            ) : (
              '🎯'
            )}
          </button>
        </div>

        {/* Pin drop mode indicator - Adjusted for compact legend */}
        {pinDropMode && (
          <div
            style={{
              position: 'absolute',
              top: '80px',
              left: '16px',
              right: showLegend ? '200px' : '16px', // Dynamic right margin based on legend visibility
              background: 'rgba(243, 156, 18, 0.95)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              textAlign: 'center',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            📌 Tap anywhere on the map to drop a pin
          </div>
        )}

        {/* Loading places indicator - Adjusted for compact legend */}
        {loadingPlaces && (
          <div
            style={{
              position: 'absolute',
              top: '80px',
              left: '16px',
              right: showLegend ? '200px' : '16px', // Dynamic right margin based on legend visibility
              background: 'rgba(93, 173, 226, 0.95)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              textAlign: 'center',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            🏛️ Loading historic places via Google Places API...
          </div>
        )}

        {/* Error message - Adjusted for compact legend */}
        {error && (
          <div
            style={{
              position: 'absolute',
              top: '80px',
              left: '16px',
              right: showLegend ? '200px' : '16px', // Dynamic right margin based on legend visibility
              background: '#ff6b6b',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              zIndex: 1000,
            }}
          >
            Location Error: {error}
          </div>
        )}

        {/* Historic Places list - More space now without bottom navigation */}
        <div style={{ 
          position: 'absolute', 
          bottom: '0px', 
          left: '0px', 
          right: '0px',
          height: '120px', // Slightly reduced since we have more space
          background: 'rgba(255, 255, 255, 0.98)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          overflowY: 'auto',
          zIndex: 999
        }}>
          <div style={{ padding: '12px 16px' }}> {/* Reduced padding */}
            <h3 style={{ 
              marginBottom: '10px', 
              fontSize: '1rem', // Slightly smaller
              fontWeight: '600'
            }}>
              Historic Places Near You 
              {historicPlaces.length > 0 && (
                <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: '400' }}>
                  ({historicPlaces.length} found)
                </span>
              )}
            </h3>
            
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              overflowX: 'auto',
              paddingBottom: '6px'
            }}>
              {historicPlaces.slice(0, 5).map((place) => (
                <div
                  key={place.id}
                  onClick={() => onLocationSelect(place)}
                  style={{
                    minWidth: '180px', // Slightly smaller cards
                    background: 'white',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    padding: '10px', // Reduced padding
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontSize: '18px', flexShrink: 0 }}>🏛️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ 
                        margin: '0 0 3px 0', 
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {place.name}
                      </h4>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: '#666',
                        marginBottom: '3px'
                      }}>
                        {place.distance}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#888',
                        lineHeight: '1.2',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {place.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {historicPlaces.length === 0 && !loadingPlaces && userLocation && (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                fontSize: '0.8rem',
                padding: '15px' 
              }}>
                No historic places found via Google Places API.
              </div>
            )}
            
            {!userLocation && !loading && (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                fontSize: '0.8rem',
                padding: '15px'
              }}>
                📍 Allow location access to discover historic places near you.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;