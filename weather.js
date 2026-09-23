const error=message=>Object.assign(Error(message),{status:503});
// City centres, not the user's location. Useful when geocoding is unavailable.
const centres={johannesburg:[-26.2041,28.0473,'Johannesburg'],'cape town':[-33.9249,18.4241,'Cape Town'],durban:[-29.8587,31.0218,'Durban'],pretoria:[-25.7479,28.2293,'Pretoria'],tshwane:[-25.7479,28.2293,'Pretoria'],gqeberha:[-33.9608,25.6022,'Gqeberha'],'port elizabeth':[-33.9608,25.6022,'Gqeberha'],bloemfontein:[-29.0852,26.1596,'Bloemfontein'],polokwane:[-23.9045,29.4689,'Polokwane'],mbombela:[-25.4753,30.9694,'Mbombela'],george:[-33.963,22.4617,'George'],stellenbosch:[-33.9321,18.8602,'Stellenbosch'],'east london':[-33.0153,27.9116,'East London']};
export function createWeather(fetcher=fetch){
 const cache=new Map();
 async function get(url){const r=await fetcher(url,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw error('Weather is temporarily unavailable. Please try again.');return r.json();}
 return async city=>{city=String(city||'Johannesburg').trim().slice(0,80);const key=city.toLowerCase(),cached=cache.get(key);if(cached&&Date.now()-cached.updated<900000)return cached;
  try{let place;try{const geo=await get('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:city,count:'10',language:'en',format:'json',countryCode:'ZA'}));place=geo.results?.find(p=>p.country_code==='ZA');}catch(e){if(!centres[key])throw e;}if(!place&&centres[key]){const [latitude,longitude,name]=centres[key];place={latitude,longitude,name};}if(!place)throw error('City not found in South Africa. Update your city in Profile.');
   const result=await get('https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({latitude:place.latitude,longitude:place.longitude,current:'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',daily:'temperature_2m_max,temperature_2m_min,precipitation_probability_max',timezone:'Africa/Johannesburg',forecast_days:'1'}));const c=result.current,d=result.daily;if(!c||!Number.isFinite(c.temperature_2m))throw error('Weather data is unavailable right now.');
   const value={city:place.name,region:place.admin1||'',temperature:c.temperature_2m,feelsLike:c.apparent_temperature,code:c.weather_code,wind:c.wind_speed_10m,high:d?.temperature_2m_max?.[0],low:d?.temperature_2m_min?.[0],rain:d?.precipitation_probability_max?.[0],time:c.time,updated:Date.now()};if(cache.size>200)cache.clear();cache.set(key,value);return value;
  }catch(e){throw e.status?e:error('Weather is temporarily unavailable. Please try again.');}
 };
}
