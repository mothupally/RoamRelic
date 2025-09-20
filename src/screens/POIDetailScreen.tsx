import React, { useState, useEffect } from 'react';
import { Location, HistoricalInsights } from '../types';
import Header from '../components/Header';
import MediaCapture from '../components/MediaCapture';
import GuideComponent from '../components/GuideComponent';
import { fetchHistoricalInsights } from '../services/azureOpenAI';

interface POIDetailScreenProps {
  location: Location;
  onBack: () => void;
  onPlayAudio: (location: Location) => void;
  onReportDamage: () => void;
  onJoinPetition: () => void;
  onViewKeyLocations?: (location: Location) => void;
}

const POIDetailScreen: React.FC<POIDetailScreenProps> = ({
  location,
  onBack,
  onPlayAudio,
  onReportDamage,
  onJoinPetition,
  onViewKeyLocations,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{
    photos: Blob[];
    recordings: Blob[];
  }>({ photos: [], recordings: [] });
  const [keyLocationsExpanded, setKeyLocationsExpanded] = useState(false);
  const [historicalInsights, setHistoricalInsights] = useState<HistoricalInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Debug logging for image URLs
  //console.log('🖼️ POI Detail Screen - Image URL:', location.imageUrl);
  //console.log('📊 Google Places Data:', location.googlePlacesData);

  // Function to fetch image with CORS headers
  const fetchImageWithCORS = async (imageUrl: string): Promise<string> => {
    try {
      //console.log('🔄 Fetching image with CORS headers:', imageUrl);
      
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Convert response to blob and create object URL
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      //console.log('✅ Image fetched successfully, created object URL');
      return objectUrl;

    } catch (error) {
      console.error('❌ Failed to fetch image with CORS:', error);
        return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop';
    }
  };

  // Load image with CORS handling on component mount
  useEffect(() => {
    const loadImage = async () => {
      try {
        setImageError(false);
        setImageLoaded(false);
        
        // Try to fetch the image with CORS headers
        const objectUrl = await fetchImageWithCORS(location.imageUrl);
        setImageSrc(objectUrl);
        setImageLoaded(true);
        
      } catch (error) {
        console.warn('⚠️ CORS fetch failed, trying direct image load:', error);
        // Fallback to direct image URL if CORS fetch fails
        setImageSrc('https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop');
        setImageError(false);
      }
    };

    loadImage();

    // Cleanup object URL when component unmounts or image changes
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [location.imageUrl]);

  // Fetch historical insights on component mount
  useEffect(() => {
    const loadHistoricalInsights = async () => {
      setLoadingInsights(true);
      //console.log('🏛️ Loading historical insights for:', location.name);
      
      try {
        const insights = await fetchHistoricalInsights(location.name);
        setHistoricalInsights(insights);
        //console.log('✅ Historical insights loaded:', insights);
      } catch (error) {
        console.error('❌ Failed to load historical insights:', error);
      } finally {
        setLoadingInsights(false);
      }
    };

    loadHistoricalInsights();
  }, [location.name]);

  // Handle photo capture
  const handlePhotoCapture = (photoBlob: Blob) => {
    setCapturedMedia(prev => ({
      ...prev,
      photos: [...prev.photos, photoBlob]
    }));
    
    // Create a URL for preview
    const photoUrl = URL.createObjectURL(photoBlob);
    //console.log('Photo captured:', photoUrl);
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
    //console.log('Audio captured:', audioUrl);
    alert('Audio recording saved! This would typically be processed and uploaded.');
  };

  // Handle media capture errors
  const handleMediaError = (error: string) => {
    alert(`Media Error: ${error}`);
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
          {/* Loading indicator for image */}
          {!imageLoaded && !imageError && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '20px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 2
            }}>
              <div className="spinner" style={{ width: '16px', height: '16px', borderColor: 'white', borderTopColor: 'transparent' }}></div>
              Loading image...
            </div>
          )}
          
          <img
            src={imageSrc} // Use fetched image source or fallback to original
            alt={location.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: imageLoaded ? 'none' : 'blur(5px)',
              transition: 'filter 0.3s ease',
            }}
            onLoad={() => {
              //console.log('✅ Image loaded successfully:', imageSrc);
              setImageLoaded(true);
            }}
            onError={(e) => {
              //console.log('❌ Image load failed, using fallback:', location.imageUrl);
              if (!imageError) {
                setImageError(true);
                // Fallback to a heritage-themed image if all else fails
                const fallbackUrl = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop';
                setImageSrc(fallbackUrl);
                e.currentTarget.src = fallbackUrl;
              }
            }}
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

          {/* Interactive Guide section */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600' }}>
              🏛️ Interactive Historical Guide
            </h3>
            <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '16px' }}>
              Get personalized historical insights and stories about {location.name} through our AI guide.
            </div>
            <GuideComponent touristPlace={location.name} />
          </div>

          {/* Enhanced Key Locations from Azure OpenAI */}
          {historicalInsights && historicalInsights.keyLocations && historicalInsights.keyLocations.length > 0 && (
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
                    Key Locations
                  </h3>
                  <div style={{ color: '#666', fontSize: '0.875rem' }}>
                    {historicalInsights.keyLocations.length === 1 
                      ? `1 significant location within this heritage site`
                      : `${historicalInsights.keyLocations.length} significant locations within this heritage site`
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
                  {historicalInsights.keyLocations.map((keyLocation, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 8px',
                        borderBottom: index < historicalInsights.keyLocations.length - 1 ? '1px solid #f8f8f8' : 'none',
                        borderRadius: '8px',
                      }}
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
                          marginTop: '2px'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>🏛️</span>
                      </div>

                      {/* Location Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ 
                          margin: '0 0 6px 0', 
                          fontSize: '0.9rem', 
                          fontWeight: '600',
                          color: '#333',
                          lineHeight: '1.3'
                        }}>
                          {keyLocation.name}
                        </h4>
                        <div style={{ 
                          color: '#666', 
                          fontSize: '0.8rem',
                          lineHeight: '1.4'
                        }}>
                          {keyLocation.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Current Civic Actions - Enhanced with Azure OpenAI data */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '1.125rem', fontWeight: '600' }}>
              Current Civic Engagement Opportunities
            </h3>
            
            {/* Azure OpenAI Current Opportunities */}
            {historicalInsights && historicalInsights.currentOpportunities && historicalInsights.currentOpportunities.length > 0 && (
              <>
                {historicalInsights.currentOpportunities.map((opportunity, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px 0',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (opportunity.link && opportunity.link !== 'Contact site management' && opportunity.link !== 'Contact local heritage organizations') {
                        alert(`${opportunity.title}\n\n${opportunity.description}\n\nFor more information: ${opportunity.link}`);
                      } else {
                        alert(`${opportunity.title}\n\n${opportunity.description}\n\n${opportunity.link || 'Contact local authorities for more information.'}`);
                      }
                    }}
                  >
                    <div
                      style={{
                        background: opportunity.type === 'volunteer' ? '#27ae60' : 
                                   opportunity.type === 'petition' ? '#f39c12' :
                                   opportunity.type === 'event' ? '#3498db' : '#9b59b6',
                        borderRadius: '8px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>
                        {opportunity.type === 'volunteer' ? '🤝' : 
                         opportunity.type === 'petition' ? '📝' :
                         opportunity.type === 'event' ? '📅' : '🎯'}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '500' }}>
                        {opportunity.title}
                      </h4>
                      <div style={{ color: '#666', fontSize: '0.875rem' }}>
                        {opportunity.description}
                      </div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="#666" width="20" height="20">
                      <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                    </svg>
                  </div>
                ))}
              </>
            )}
            
            {/* Default Civic Actions */}
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


            {/* Historical Civic Engagements Section */}
            {historicalInsights && historicalInsights.civicEngagements && historicalInsights.civicEngagements.length > 0 && (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🏛️ Historical Civic Legacy
                    </h3>
                    <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '16px' }}>
                        Discover the rich history of civic engagement and community movements associated with {location.name}.
                    </div>

                    {historicalInsights.civicEngagements.map((engagement, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '16px',
                                padding: '12px 0',
                                borderBottom: index < historicalInsights.civicEngagements.length - 1 ? '1px solid #f0f0f0' : 'none',
                            }}
                        >
                            <div
                                style={{
                                    background: engagement.type === 'protest' ? '#e74c3c' :
                                        engagement.type === 'cultural' ? '#9b59b6' :
                                            engagement.type === 'education' ? '#3498db' :
                                                engagement.type === 'development' ? '#27ae60' : '#95a5a6',
                                    borderRadius: '8px',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '2px'
                                }}
                            >
                                <span style={{ fontSize: '18px' }}>
                                    {engagement.type === 'protest' ? '✊' :
                                        engagement.type === 'cultural' ? '🎭' :
                                            engagement.type === 'education' ? '📚' :
                                                engagement.type === 'development' ? '🏗️' : '📜'}
                                </span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {engagement.title}
                                    <span style={{
                                        background: '#f8f9fa',
                                        color: '#666',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: '400'
                                    }}>
                                        {engagement.year}
                                    </span>
                                </h4>
                                <div style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.4' }}>
                                    {engagement.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}


          {/* Loading indicator for historical insights */}
          {loadingInsights && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '16px',
                color: '#666' 
              }}>
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                <span>Loading historical insights and key locations...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POIDetailScreen;