# ?? CORS Error Solutions for Google Places API

## Problem
Getting `403 Forbidden` error from `cors-anywhere.herokuapp.com` when trying to access Google Places API.

```
GET https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json 403 (Forbidden)
```

## ? Solutions (Ranked by Ease)

### **Solution 1: Multiple CORS Proxies** (Already Implemented)
The code now tries multiple proxy services:
1. `allorigins.win` - Usually most reliable
2. `corsproxy.io` - Good alternative
3. `thingproxy.freeboard.io` - Another backup
4. `cors-anywhere.herokuapp.com` - Original (as fallback)

### **Solution 2: Request CORS-Anywhere Access** (5 minutes)
1. Go to: https://cors-anywhere.herokuapp.com/corsdemo
2. Click **"Request temporary access to the demo server"**
3. This gives you ~2 hours of access
4. Your app will work immediately after

### **Solution 3: Browser Extension** (1 minute)
Install a CORS browser extension:
- **Chrome**: "CORS Unblock" or "Disable CORS"
- **Firefox**: "CORS Everywhere"
- Enable it only for development
- ?? Remember to disable for normal browsing

### **Solution 4: Local Development Server** (Best for Production)
Create a simple proxy server:

```javascript
// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.use('/api/places', createProxyMiddleware({
  target: 'https://maps.googleapis.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/places': '/maps/api/place'
  },
}));

app.listen(3001);
```

### **Solution 5: Use Your Backend** (Production Ready)
Implement the Google Places API call in your backend:

```javascript
// backend/routes/places.js
app.post('/api/places/historic', async (req, res) => {
  const { latitude, longitude } = req.body;
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=50000&type=tourist_attraction&key=${process.env.GOOGLE_PLACES_API_KEY}`
  );
  
  const data = await response.json();
  res.json(data);
});
```

## ?? Immediate Fix
The app has been updated to automatically try multiple proxies. You should see:

```
?? Trying proxy 1/4: https://api.allorigins.win/get?url=
?? Trying proxy 2/4: https://corsproxy.io/?
```

## ?? Current Behavior
- App tries each proxy in order
- Falls back to demo data if all fail
- You still see the heritage markers (they're just demo data)
- Everything works, just with sample locations

## ?? Quick Test
1. Refresh your page
2. Check console for proxy attempts
3. If you see real places data, a proxy worked!
4. If you see demo data, try Solution 2 above

## ?? For Production
Use Solution 5 - move the API call to your backend to avoid CORS entirely and keep your API key secure.