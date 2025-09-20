// Google Places API service for backend implementation
// This should be implemented on your server to keep API keys secure

import { Location } from '../types';

// Interface for Google Places API response
interface GooglePlaceResponse {
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

interface GooglePlacesApiResponse {
  results: GooglePlaceResponse[];
  status: string;
  error_message?: string;
  next_page_token?: string;
}

// Convert Google Places API response to our Location interface
const convertGooglePlaceToLocation = (place: GooglePlaceResponse, userLat: number, userLng: number): Location => {
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

  const distance = calculateDistance(userLat, userLng, place.geometry.location.lat, place.geometry.location.lng);

  return {
    id: place.place_id,
    name: place.name,
    description: place.formatted_address || place.vicinity || 'Historic location discovered via Google Places',
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    imageUrl: place.photos && place.photos.length > 0 
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
      : 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    audioUrl: undefined,
    audioTitle: undefined,
    audioDuration: undefined,
    category: 'heritage',
    distance: distance > 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`
  };
};

// Server-side function to fetch historic places from Google Places API
export const fetchHistoricPlacesFromGoogleServer = async (
  latitude: number, 
  longitude: number,
  apiKey: string
): Promise<Location[]> => {
  try {
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    
    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: '50000', // 50km radius
      type: 'tourist_attraction',
      keyword: 'historic heritage monument museum archaeological temple fort palace',
      key: apiKey
    });

    console.log('Fetching historic places from Google Places API:', { latitude, longitude });

    const response = await fetch(`${baseUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GooglePlacesApiResponse = await response.json();
    console.log('Google Places API Response status:', data.status);

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.error_message || data.status);
      return [];
    }

    // Filter for historic/cultural places
    const historicPlaces = data.results.filter(place => {
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

    console.log(`Found ${historicPlaces.length} historic places out of ${data.results.length} total results`);

    // Convert to our Location format
    const locations = historicPlaces.map(place => convertGooglePlaceToLocation(place, latitude, longitude));
    
    return locations;

  } catch (error) {
    console.error('Error fetching historic places from Google Places API:', error);
    return [];
  }
};

// Client-side function to call your backend API
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
    return [];
  }
};

export default {
  fetchHistoricPlacesFromGoogleServer,
  fetchHistoricPlacesFromBackend
};