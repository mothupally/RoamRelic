// Type definitions for the RoamRelic app

export interface Location {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  audioUrl?: string;
  audioTitle?: string;
  audioDuration?: string;
  category: 'heritage' | 'monument' | 'museum' | 'park' | 'other';
  distance?: string;
  // Enhanced Google Places data
  googlePlacesData?: {
    rating?: number;
    userRatingsTotal?: number;
    businessStatus?: string;
    openNow?: boolean;
    types?: string[];
    formattedAddress?: string;
    vicinity?: string;
  };
}

export interface CivicAction {
  id: string;
  title: string;
  description: string;
  type: 'report' | 'volunteer' | 'petition' | 'survey';
  icon: string;
  actionUrl?: string;
  deadline?: string;
  participantCount?: number;
}

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration: string;
  locationId: string;
  isPlaying?: boolean;
  currentTime?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  active?: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}