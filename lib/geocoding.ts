// Free geocoding using OpenStreetMap Nominatim API
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  city: string;
  district: string;
  full_address: string;
  state?: string;
  country?: string;
}

export async function geocodeCity(city: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`,
      {
        headers: {
          'User-Agent': 'BloodDonationApp/1.0' // Required by Nominatim API
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Reverse geocoding: Get city and district from coordinates
export async function reverseGeocode(lat: number, lng: number): Promise<LocationData | null> {
  try {
    console.log(`🔍 Reverse geocoding coordinates: ${lat}, ${lng}`);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'BloodDonationApp/1.0' // Required by Nominatim API
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.error) {
      console.log('❌ No location data found for coordinates');
      return null;
    }
    
    // Extract location information with fallbacks
    const address = data.address || {};
    
    // Try multiple fields for city (priority order)
    const city = 
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      data.name ||
      'Unknown';
    
    // Try multiple fields for district
    const district = 
      address.state_district ||
      address.district ||
      address.county ||
      address.suburb ||
      city; // Fallback to city name
    
    // Build full address
    const full_address = data.display_name || `${city}, ${district}`;
    
    const locationData: LocationData = {
      city,
      district,
      full_address,
      state: address.state,
      country: address.country
    };
    
    console.log(`✅ Reverse geocoding successful:`, locationData);
    return locationData;
    
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    return null;
  }
}

// Calculate distance between two coordinates in kilometers
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
