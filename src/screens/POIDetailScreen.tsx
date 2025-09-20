import React, { useState } from 'react';
import { Location } from '../types';
import Header from '../components/Header';
import MediaCapture from '../components/MediaCapture';

interface POIDetailScreenProps {
  location: Location;
  onBack: () => void;
  onPlayAudio: (location: Location) => void;
  onReportDamage: () => void;
  onJoinPetition: () => void;
  onViewKeyLocations?: (location: Location) => void; // New prop for key locations navigation
  keyLocations?: Location[]; // Array of key locations within this heritage site
}

const POIDetailScreen: React.FC<POIDetailScreenProps> = ({
  location,
  onBack,
  onPlayAudio,
  onReportDamage,
  onJoinPetition,
  onViewKeyLocations,
  keyLocations,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{
    photos: Blob[];
    recordings: Blob[];
  }>({ photos: [], recordings: [] });
  const [keyLocationsExpanded, setKeyLocationsExpanded] = useState(false);

  // Handle photo capture
  const handlePhotoCapture = (photoBlob: Blob) => {
    setCapturedMedia(prev => ({
      ...prev,
      photos: [...prev.photos, photoBlob]
    }));
    
    // Create a URL for preview
    const photoUrl = URL.createObjectURL(photoBlob);
    console.log('Photo captured:', photoUrl);
    alert('Photo captured successfully! This would typically be uploaded to the server.');
  };

  // Handle audio capture
  const handleAudioCapture = (audioBlob: Blob) => {
    setCapturedMedia(prev => ({
      ...prev,
      recordings: [...prev.recordings, audioBlob]
    }));
    
    // Create a URL for preview
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log('Audio captured:', audioUrl);
    alert('Audio recording saved! This would typically be processed and uploaded.');
  };

  // Handle media capture errors
  const handleMediaError = (error: string) => {
    alert(`Media Error: ${error}`);
  };

  // Handle individual key location click
  const handleKeyLocationClick = (keyLocation: Location) => {
    console.log('Key location selected:', keyLocation.name);
    alert(`Viewing details for: ${keyLocation.name}\n\nDescription: ${keyLocation.description}\nDistance: ${keyLocation.distance}`);
  };

  return (
    <div className="app-container">
      <Header 
        title="POI Detail" 
        showBackButton 
        onBackClick={onBack}
      />
      
      <div className="screen" style={{ padding: 0 }}>
        {/* Hero Image */}
        <div style={{ position: 'relative', height: '250px', overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
            alt={location.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: imageLoaded ? 'none' : 'blur(5px)',
              transition: 'filter 0.3s ease',
            }}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Play button overlay */}
          {location.audioUrl && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => onPlayAudio(location)}
            >
              <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
                <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
              </svg>
            </div>
          )}

          {/* Watch story text overlay */}
          {location.audioTitle && (
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
              </svg>
              {location.audioTitle}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Title and basic info */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
              {location.name}
            </h1>
            
            {/* Google Places Rating and Status */}
            {location.googlePlacesData && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                {/* Rating */}
                {location.googlePlacesData.rating && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    background: '#fff3cd',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem'
                  }}>
                    <span>⭐</span>
                    <span style={{ fontWeight: '600' }}>
                      {location.googlePlacesData.rating}
                    </span>
                    {location.googlePlacesData.userRatingsTotal && (
                      <span style={{ color: '#666' }}>
                        ({location.googlePlacesData.userRatingsTotal.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                
                {/* Open/Closed Status */}
                {location.googlePlacesData.openNow !== undefined && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    background: location.googlePlacesData.openNow ? '#d4edda' : '#f8d7da',
                    color: location.googlePlacesData.openNow ? '#155724' : '#721c24',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    <span>{location.googlePlacesData.openNow ? '🟢' : '🔴'}</span>
                    <span>{location.googlePlacesData.openNow ? 'Open Now' : 'Closed'}</span>
                  </div>
                )}
                
                {/* Business Status */}
                {location.googlePlacesData.businessStatus && location.googlePlacesData.businessStatus !== 'OPERATIONAL' && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    <span>⚠️</span>
                    <span>
                      {location.googlePlacesData.businessStatus === 'CLOSED_TEMPORARILY' ? 'Temp. Closed' :
                       location.googlePlacesData.businessStatus === 'CLOSED_PERMANENTLY' ? 'Permanently Closed' :
                       location.googlePlacesData.businessStatus}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Distance */}
            {location.distance && (
              <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '12px' }}>
                📍 {location.distance}
                {location.googlePlacesData?.formattedAddress && (
                  <span style={{ marginLeft: '8px', color: '#888' }}>
                    • {location.googlePlacesData.formattedAddress}
                  </span>
                )}
              </div>
            )}
            
            {/* Place Types as Tags */}
            {location.googlePlacesData?.types && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {location.googlePlacesData.types
                    .filter(type => 
                      !type.includes('establishment') && 
                      !type.includes('point_of_interest') &&
                      !type.includes('geocode')
                    )
                    .slice(0, 4)
                    .map(type => (
                      <span
                        key={type}
                        style={{
                          background: '#e8f4fd',
                          color: '#1e88e5',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                </div>
              </div>
            )}
            
            <p style={{ lineHeight: '1.6', color: '#444', fontSize: '1rem' }}>
              {location.description}
            </p>
          </div>

          {/* Audio section */}
          {location.audioUrl && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                }}
                onClick={() => onPlayAudio(location)}
              >
                <div
                  style={{
                    background: '#5dade2',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600' }}>
                    Play narration
                  </h3>
                  <div style={{ color: '#666', fontSize: '0.875rem' }}>
                    {location.audioDuration || '0:42'}
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="#5dade2" width="20" height="20">
                  <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                </svg>
              </div>
            </div>
          )}

          {/* Expandable Key Locations */}
          {keyLocations && keyLocations.length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              {/* Header - clickable to expand/collapse */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  padding: '12px 0',
                  borderBottom: keyLocationsExpanded ? '1px solid #f0f0f0' : 'none',
                }}
                onClick={() => setKeyLocationsExpanded(!keyLocationsExpanded)}
              >
                <div
                  style={{
                    background: '#8e44ad',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🏰</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600' }}>
                    Key Locations Nearby
                  </h3>
                  <div style={{ color: '#666', fontSize: '0.875rem' }}>
                    {keyLocations.length === 1 
                      ? `1 historic location within ${keyLocations[0].distance || '100m'}`
                      : `${keyLocations.length} historic locations within this area`
                    }
                  </div>
                </div>
                <svg 
                  viewBox="0 0 24 24" 
                  fill="#8e44ad" 
                  width="20" 
                  height="20"
                  style={{
                    transform: keyLocationsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                </svg>
              </div>

              {/* Expandable content */}
              {keyLocationsExpanded && (
                <div style={{ paddingTop: '12px' }}>
                  {keyLocations.map((keyLocation, index) => (
                    <div
                      key={keyLocation.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 8px',
                        borderBottom: index < keyLocations.length - 1 ? '1px solid #f8f8f8' : 'none',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s ease',
                      }}
                      onClick={() => handleKeyLocationClick(keyLocation)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Location Icon */}
                      <div
                        style={{
                          background: '#e8f4fd',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>🏛️</span>
                      </div>

                      {/* Location Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '0.9rem', 
                          fontWeight: '600',
                          color: '#333',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {keyLocation.name}
                        </h4>
                        <div style={{ 
                          color: '#666', 
                          fontSize: '0.75rem',
                          lineHeight: '1.3',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {keyLocation.description}
                        </div>
                        {keyLocation.distance && (
                          <div style={{ 
                            color: '#8e44ad', 
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            marginTop: '4px'
                          }}>
                            📍 {keyLocation.distance}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <svg viewBox="0 0 24 24" fill="#ccc" width="16" height="16">
                        <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Civic Actions */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '1.125rem', fontWeight: '600' }}>
              Civic Actions
            </h3>
            
            {/* Report Damage */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
              }}
              onClick={onReportDamage}
            >
              <div
                style={{
                  background: '#3498db',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '20px' }}>📋</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '500' }}>
                  Report damaged signage
                </h4>
                <div style={{ color: '#666', fontSize: '0.875rem' }}>
                  Notify city heritage department about damaged plaque.
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="#666" width="20" height="20">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
              </svg>
            </div>

            {/* Join Petition */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 0',
                cursor: 'pointer',
              }}
              onClick={onJoinPetition}
            >
              <div
                style={{
                  background: '#2ecc71',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '20px' }}>📝</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '500' }}>
                  Join heritage petition
                </h4>
                <div style={{ color: '#666', fontSize: '0.875rem' }}>
                  Support the preservation of this historical site.
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="#666" width="20" height="20">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
              </svg>
            </div>
          </div>

          {/* Monument Scanning */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.125rem', fontWeight: '600' }}>
              📸 Scan This Monument
            </h3>
            <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '16px' }}>
              Use your camera to capture details or record audio notes about this heritage site.
            </div>
            <MediaCapture
              onPhotoCapture={handlePhotoCapture}
              onAudioCapture={handleAudioCapture}
              onError={handleMediaError}
            />
          </div>

          {/* Share and Upload buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              style={{
                flex: 1,
                background: 'white',
                border: '2px solid #5dade2',
                color: '#5dade2',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '500',
              }}
            >
              📤 Upload photo
            </button>
            <button
              style={{
                flex: 1,
                background: '#5dade2',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '500',
              }}
            >
              📱 Share a story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POIDetailScreen;