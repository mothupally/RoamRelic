# Google Places API Integration for RoamRelic

## Overview

The HomeScreen has been updated to use Google Places API instead of the custom API for fetching historic places. This provides access to Google's comprehensive database of tourist attractions, monuments, museums, and other historic locations.

## Setup Instructions

### 1. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the "Places API" for your project
4. Go to "Credentials" and create an API key
5. Restrict the API key to your domain/IP for security

### 2. Configure Environment Variables

Create a `.env` file in your project root (copy from `.env.example`):

```bash
REACT_APP_GOOGLE_PLACES_API_KEY=your_api_key_here
```

### 3. API Usage

The app now fetches historic places using these parameters:

- **Radius**: 50km from user location
- **Type**: `tourist_attraction`
- **Keywords**: `historic heritage monument museum archaeological temple fort palace`
- **Filter**: Places containing historic keywords or types

## Implementation Details

### Key Changes Made

1. **Replaced Custom API** with Google Places API in `HomeScreen.tsx`
2. **Added Data Conversion** from Google Places format to app's Location format
3. **Implemented Filtering** for historic/cultural places
4. **Added Photo Support** using Google Places photo references
5. **Calculated Real Distances** using Haversine formula
6. **Provided Fallback Data** for development/demo

### API Response Conversion

Google Places response is converted to match the app's Location interface:

```typescript
interface Location {
  id: string;           // place_id from Google
  name: string;         // name from Google
  description: string;  // formatted_address or vicinity
  latitude: number;     // geometry.location.lat
  longitude: number;    // geometry.location.lng
  imageUrl: string;     // Google photo or fallback
  category: 'heritage'; // Fixed category
  distance: string;     // Calculated distance
}
```

### Filtering Logic

The app filters Google Places results for historic/cultural significance:

**Historic Types:**
- `tourist_attraction`
- `museum`
- `place_of_worship`
- `establishment`
- `point_of_interest`

**Historic Keywords:**
- temple, fort, palace, monument
- heritage, historic, archaeological
- ancient, cultural, tomb
- mosque, church, castle, cathedral
- shrine, memorial

## Security Considerations

### Current Implementation (Development)
- Uses CORS proxy (`cors-anywhere.herokuapp.com`)
- API key exposed in frontend (for demo only)

### Production Recommendations
1. **Move API calls to backend** to keep API key secure
2. **Implement server-side filtering** for better performance
3. **Add API key restrictions** in Google Cloud Console
4. **Set up billing limits** to avoid unexpected charges
5. **Use backend caching** to reduce API calls

## Files Modified

- `src/screens/HomeScreen.tsx` - Main implementation
- `.env.example` - Environment variable template
- `src/services/googlePlacesApi.ts` - Backend service template

## Backend Integration Template

For production, implement this endpoint in your backend:

```javascript
// Backend endpoint example (Express.js)
app.post('/api/places/historic', async (req, res) => {
  const { latitude, longitude, radius } = req.body;
  
  try {
    const places = await fetchHistoricPlacesFromGoogleServer(
      latitude, 
      longitude, 
      process.env.GOOGLE_PLACES_API_KEY
    );
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});
```

## Testing

1. **With API Key**: Set up environment variable and test with real data
2. **Without API Key**: App falls back to demo data automatically
3. **Error Handling**: CORS errors or API failures show appropriate messages

## Benefits of Google Places API

- ? **Comprehensive Data**: Millions of places worldwide
- ? **Real Photos**: High-quality images from Google
- ? **Accurate Locations**: GPS coordinates and addresses
- ? **Rich Metadata**: Ratings, reviews, opening hours
- ? **Regular Updates**: Google maintains data freshness
- ? **Global Coverage**: Works anywhere in the world

## Next Steps

1. Set up Google Cloud project and get API key
2. Add API key to environment variables
3. Test with real locations
4. Implement backend service for production
5. Add additional filtering/sorting options