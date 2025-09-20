// Google Places API client-side utilities
// For frontend usage with proper CORS handling

import { Location } from '../types';

// Interface for Google Places API response
export interface GooglePlaceResponse {
  place_id: string;
  name: string;
  types: string[];
  business_status?: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  photos?: Array<{
    height: number;
    width: number;
    photo_reference: string;
  }>;
  opening_hours?: {
    open_now: boolean;
  };
}

export interface GooglePlacesApiResponse {
  results: GooglePlaceResponse[];
  status: string;
  error_message?: string;
  next_page_token?: string;
}

// Calculate distance using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // Distance in meters
  return Math.round(distance);
};

// Convert Google Places API response to our Location interface with enhanced data
export const convertGooglePlaceToLocation = (place: GooglePlaceResponse, userLat: number, userLng: number): Location => {
  const distance = calculateDistance(userLat, userLng, place.geometry.location.lat, place.geometry.location.lng);

  // Create a proper description for the place
  const buildPlaceDescription = (place: GooglePlaceResponse): string => {
    // Use a proper description based on place type and name
    const placeTypes = place.types || [];
    
    let description = '';
    
    if (placeTypes.includes('tourist_attraction') || placeTypes.includes('museum')) {
      description = `${place.name} is a renowned heritage site and tourist destination. `;
    } else if (placeTypes.includes('place_of_worship') || placeTypes.includes('hindu_temple')) {
      description = `${place.name} is a sacred place of worship with rich cultural and spiritual significance. `;
    } else if (placeTypes.includes('historical_landmark')) {
      description = `${place.name} is a historical landmark that showcases the architectural heritage and cultural legacy of the region. `;
    } else {
      description = `${place.name} is a significant heritage site that represents the cultural and historical importance of this area. `;
    }
    
    // Add location context
    if (place.vicinity) {
      description += `Located in ${place.vicinity}, `;
    } else if (place.formatted_address) {
      const addressParts = place.formatted_address.split(',');
      if (addressParts.length > 1) {
        description += `Located in ${addressParts[addressParts.length - 2].trim()}, `;
      }
    }
    
    description += `this site offers visitors a glimpse into the rich history and cultural traditions that have shaped this region over centuries.`;
    
    return description;
  };

  // Handle Google Places photos with CORS proxy - synchronous approach
  const getImageUrl = (place: GooglePlaceResponse): string => {
    if (place.photos && place.photos.length > 0) {
      const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
      if (apiKey) {
        // Use CORS proxy directly for photos - synchronous approach
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`;
        
        // Use cors-anywhere as primary proxy for images (works well for direct image URLs)
        return `https://cors-anywhere.herokuapp.com/${photoUrl}`;
      }
    }
    
    // Fallback to contextual Unsplash images if no Google photo available
    const placeTypes = place.types || [];
    
    if (placeTypes.includes('museum')) {
      return 'https://images.unsplash.com/photo-1578495555443-d134c52754e7?w=400&h=300&fit=crop';
    } else if (placeTypes.includes('place_of_worship') || placeTypes.includes('hindu_temple')) {
      return 'https://images.unsplash.com/photo-1583224964938-0c17db9e623a?w=400&h=300&fit=crop';
    } else if (placeTypes.includes('historical_landmark') || place.name.toLowerCase().includes('fort')) {
      return 'https://images.unsplash.com/photo-1566127952889-bf906f4e4c5d?w=400&h=300&fit=crop';
    } else if (place.name.toLowerCase().includes('palace')) {
      return 'https://images.unsplash.com/photo-1545042746-d0a8b69e5e22?w=400&h=300&fit=crop';
    } else if (place.name.toLowerCase().includes('charminar')) {
      return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=300&fit=crop';
    } else {
      return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
    }
  };

  return {
    id: place.place_id,
    name: place.name,
    description: buildPlaceDescription(place),
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    imageUrl: getImageUrl(place),
    audioUrl: undefined,
    audioTitle: undefined,
    audioDuration: undefined,
    category: 'heritage',
    distance: distance > 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`,
    // Store additional Google Places data for potential use
    googlePlacesData: {
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      businessStatus: place.business_status,
      openNow: place.opening_hours?.open_now,
      types: place.types,
      formattedAddress: place.formatted_address,
      vicinity: place.vicinity
    }
  };
};

// Filter places for historic/cultural significance
const filterHistoricPlaces = (places: GooglePlaceResponse[]): GooglePlaceResponse[] => {
  return places.filter(place => {
    const historicTypes = [
      'tourist_attraction',
      'museum',
      'place_of_worship',
      'establishment',
      'point_of_interest'
    ];
    
    const historicKeywords = [
      'temple', 'fort', 'palace', 'monument', 'heritage', 'historic',
      'archaeological', 'ancient', 'cultural', 'tomb', 'mosque', 'church',
      'castle', 'cathedral', 'shrine', 'memorial'
    ];

    // Check if place has historic types
    const hasHistoricType = place.types.some(type => historicTypes.includes(type));
    
    // Check if place name contains historic keywords
    const hasHistoricKeyword = historicKeywords.some(keyword => 
      place.name.toLowerCase().includes(keyword) ||
      (place.vicinity && place.vicinity.toLowerCase().includes(keyword))
    );

    return hasHistoricType || hasHistoricKeyword;
  });
};

// Client-side function to fetch historic places with CORS proxy (development only)
export const fetchHistoricPlacesWithCORS = async (
  latitude: number, 
  longitude: number
): Promise<Location[]> => {
  //console.log('??? Starting fetchHistoricPlacesWithCORS...', { latitude, longitude });
  
  try {
    const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
    
    //console.log('?? API Key check:', apiKey ? 'Found' : 'NOT FOUND');
    
    if (!apiKey) {
      console.warn('?? Google Places API key not found. Using fallback data.');
      const fallbackData = getFallbackHistoricPlaces(latitude, longitude);
      //console.log('?? Returning fallback data:', fallbackData);
      return fallbackData;
    }

    // Try multiple CORS proxy services
    const corsProxies = [
      'https://api.allorigins.win/get?url=',
      'https://corsproxy.io/?',
      'https://thingproxy.freeboard.io/fetch/',
      'https://cors-anywhere.herokuapp.com/', // Keep as fallback
    ];
    
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: '50000', // 50km radius
      type: 'tourist_attraction',
      keyword: 'historic heritage monument museum archaeological temple fort palace',
      key: apiKey
    });

    const targetUrl = `${baseUrl}?${params}`;
    
    // Try each proxy until one works
    for (let i = 0; i < corsProxies.length; i++) {
      const corsProxy = corsProxies[i];
      
      try {
        //console.log(`?? Trying proxy ${i + 1}/${corsProxies.length}: ${corsProxy}`);
        
        let fullUrl: string;
        let fetchOptions: RequestInit = {};

        // Handle different proxy formats
        if (corsProxy.includes('allorigins.win')) {
          fullUrl = `${corsProxy}${encodeURIComponent(targetUrl)}`;
        } else {
          fullUrl = `${corsProxy}${targetUrl}`;
          fetchOptions = {
            headers: {
              'X-Requested-With': 'XMLHttpRequest'
            }
          };
        }

        //console.log(`?? Fetching from: ${fullUrl}`);
        const response = await fetch(fullUrl, fetchOptions);
        
        //console.log(`?? Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          console.warn(`?? Proxy ${i + 1} failed with status ${response.status}, trying next...`);
          continue;
        }

        let data: GooglePlacesApiResponse;
        
        // Handle allorigins format
        if (corsProxy.includes('allorigins.win')) {
          const allOriginsResponse = await response.json();
          if (allOriginsResponse.status?.http_code === 200) {
            data = JSON.parse(allOriginsResponse.contents);
          } else {
            console.warn(`?? AllOrigins proxy failed, trying next...`);
            continue;
          }
        } else {
          data = await response.json();
        }

        //console.log('?? Google Places API Response:', data);

        if (data.status !== 'OK') {
          console.error('? Google Places API error:', data.error_message || data.status);
          continue; // Try next proxy
        }

        // Filter for historic/cultural places
        const historicPlaces = filterHistoricPlaces(data.results);
        //console.log(`?? Found ${historicPlaces.length} historic places out of ${data.results.length} total results`);

        // Convert to our Location format
        const locations = historicPlaces.map(place => convertGooglePlaceToLocation(place, latitude, longitude));
        //console.log('? Converted locations:', locations);
        
        return locations;

      } catch (proxyError) {
        console.warn(`?? Proxy ${i + 1} failed:`, proxyError);
        continue; // Try next proxy
      }
    }
    
    // If all proxies failed, use fallback data
    console.warn('?? All CORS proxies failed, using fallback data');
    const fallbackData = getFallbackHistoricPlaces(latitude, longitude);
    //console.log('?? Returning fallback data due to proxy errors:', fallbackData);
    return fallbackData;

  } catch (error) {
    console.error('?? Error fetching historic places:', error);
    const fallbackData = getFallbackHistoricPlaces(latitude, longitude);
    //console.log('?? Returning fallback data due to error:', fallbackData);
    return fallbackData;
  }
};

// Fallback historic places for development/demo - Enhanced with proper descriptions
export const getFallbackHistoricPlaces = (latitude: number, longitude: number): Location[] => {
  //console.log('?? Generating fallback places for:', { latitude, longitude });
  
  const fallbackPlaces: Location[] = [
    {
      id: 'fallback-historic-1',
      name: 'Charminar Heritage Monument',
      description: 'Charminar is a magnificent monument and mosque built in 1591. This iconic structure stands as a symbol of Hyderabad with its four grand arches and minarets. The monument showcases Indo-Islamic architecture and offers visitors a glimpse into the rich history of the Qutb Shahi dynasty.',
      latitude: latitude + 0.01,
      longitude: longitude + 0.01,
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=300&fit=crop',
      category: 'heritage',
      distance: '1.2km',
      googlePlacesData: {
        rating: 4.5,
        userRatingsTotal: 8234,
        businessStatus: 'OPERATIONAL',
        openNow: true,
        types: ['tourist_attraction', 'historical_landmark', 'monument'],
        formattedAddress: 'Charminar Rd, Char Kaman, Ghansi Bazaar, Hyderabad, Telangana 500002, India',
        vicinity: 'Charminar'
      }
    },
    {
      id: 'fallback-heritage-2',
      name: 'State Archaeological Museum',
      description: 'The State Archaeological Museum houses an extensive collection of artifacts, sculptures, and relics that chronicle the rich cultural heritage of the region. Established to preserve and showcase archaeological treasures, the museum offers visitors an educational journey through centuries of art, culture, and history.',
      latitude: latitude - 0.01,
      longitude: longitude + 0.01,
      imageUrl: 'https://images.unsplash.com/photo-1578495555443-d134c52754e7?w=400&h=300&fit=crop',
      category: 'heritage',
      distance: '2.1km',
      googlePlacesData: {
        rating: 4.2,
        userRatingsTotal: 1456,
        businessStatus: 'OPERATIONAL',
        openNow: true,
        types: ['museum', 'tourist_attraction', 'cultural_center'],
        formattedAddress: 'Public Gardens, Nampally, Hyderabad, Telangana 500001, India',
        vicinity: 'Nampally'
      }
    },
    {
      id: 'fallback-temple-3',
      name: 'Birla Mandir Temple',
      description: 'Birla Mandir is a stunning Hindu temple constructed entirely of white marble and dedicated to Lord Venkateswara. Perched atop a hill, this temple combines traditional and modern architectural elements, offering devotees and visitors a serene spiritual experience along with panoramic views of the city.',
      latitude: latitude + 0.005,
      longitude: longitude - 0.005,
      imageUrl: 'https://images.unsplash.com/photo-1583224964938-0c17db9e623a?w=400&h=300&fit=crop',
      category: 'heritage',
      distance: '800m',
      googlePlacesData: {
        rating: 4.7,
        userRatingsTotal: 12089,
        businessStatus: 'OPERATIONAL',
        openNow: true,
        types: ['hindu_temple', 'place_of_worship', 'tourist_attraction'],
        formattedAddress: 'Hill Fort Rd, Ambedkar Colony, Mehdipatnam, Hyderabad, Telangana 500028, India',
        vicinity: 'Mehdipatnam'
      }
    },
    {
      id: 'fallback-fort-4',
      name: 'Golconda Fort',
      description: 'Golconda Fort is a medieval fortress built by the Kakatiya dynasty and later expanded by the Qutb Shahi rulers. This imposing citadel features ingenious architecture, intricate acoustic systems, and defensive mechanisms. The fort complex offers visitors a fascinating journey through military architecture and royal history.',
      latitude: latitude - 0.005,
      longitude: longitude - 0.01,
      imageUrl: 'https://images.unsplash.com/photo-1566127952889-bf906f4e4c5d?w=400&h=300&fit=crop',
      category: 'heritage',
      distance: '1.8km',
      googlePlacesData: {
        rating: 4.3,
        userRatingsTotal: 15678,
        businessStatus: 'OPERATIONAL',
        openNow: false,
        types: ['historical_landmark', 'fort', 'tourist_attraction'],
        formattedAddress: 'Khair Complex, Ibrahim Bagh, Hyderabad, Telangana 500008, India',
        vicinity: 'Ibrahim Bagh'
      }
    },
    {
      id: 'fallback-palace-5',
      name: 'Chowmahalla Palace',
      description: 'Chowmahalla Palace served as the official residence of the Nizams of Hyderabad and is renowned for its exquisite architecture and royal grandeur. The palace complex showcases a blend of Persian, Turkish, and European architectural styles, featuring ornate halls, beautiful courtyards, and a remarkable collection of vintage cars and artifacts.',
      latitude: latitude + 0.008,
      longitude: longitude - 0.008,
      imageUrl: 'https://images.unsplash.com/photo-1545042746-d0a8b69e5e22?w=400&h=300&fit=crop',
      category: 'heritage',
      distance: '2.5km',
      googlePlacesData: {
        rating: 4.4,
        userRatingsTotal: 3567,
        businessStatus: 'CLOSED_TEMPORARILY',
        openNow: false,
        types: ['palace', 'historical_landmark', 'museum'],
        formattedAddress: '20-4-236, Motigalli, Khilwat, Hyderabad, Telangana 500002, India',
        vicinity: 'Khilwat'
      }
    }
  ];
  
  //console.log('?? Generated enhanced fallback places:', fallbackPlaces);
  return fallbackPlaces;
};

// Alternative backend-based function (recommended for production)
export const fetchHistoricPlacesFromBackend = async (
  latitude: number, 
  longitude: number
): Promise<Location[]> => {
  try {
    const response = await fetch('/api/places/historic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude,
        longitude,
        radius: 50000 // 50km
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Location[] = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching historic places from backend:', error);
    return getFallbackHistoricPlaces(latitude, longitude);
  }
};

export default {
  fetchHistoricPlacesWithCORS,
  fetchHistoricPlacesFromBackend,
  getFallbackHistoricPlaces,
  convertGooglePlaceToLocation
};