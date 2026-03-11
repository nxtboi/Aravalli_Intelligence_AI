import { MapContainer, TileLayer, Circle, Popup, useMap, Polyline, LayersControl } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';

// Aravalli approximate center
const CENTER = [26.9124, 75.7873] as [number, number]; // Jaipur/Aravalli region

function MapUpdater() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

interface LocationDetails {
  id: string;
  last_analyzed: string;
  historical_changes: { year: number; status: string }[];
  soil_moisture: number;
  canopy_cover: number;
  alerts: string[];
}

function LocationPopup({ id, type, intensity }: { id: string, type: string, intensity: number }) {
  const [details, setDetails] = useState<LocationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/location/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch location details');
        return res.json();
      })
      .then(data => {
        setDetails(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch location details", err);
        setError("Could not load location data.");
        setLoading(false);
      });
  }, [id]);

  return (
    <Popup>
      <div className="p-2 min-w-[200px]">
        <h3 className="font-bold capitalize text-base mb-1">{type} Zone</h3>
        <div className="text-xs text-zinc-500 mb-2">ID: {id}</div>
        
        <div className="space-y-1 mb-3">
          <p className="text-sm">Intensity: <span className="font-medium">{(intensity * 100).toFixed(0)}%</span></p>
          <p className="text-sm">Status: <span className={type === 'natural' ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
            {type === 'natural' ? 'Stable' : 'Alert'}
          </span></p>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-zinc-400" size={20} />
          </div>
        ) : error ? (
          <div className="bg-red-50 p-2 rounded border border-red-100 text-center">
            <p className="text-xs text-red-600 font-medium">{error}</p>
            <button 
              onClick={() => { setLoading(true); setError(null); /* Trigger re-fetch logic if needed, or just rely on effect */ }}
              className="text-[10px] text-red-500 underline mt-1"
            >
              Retry
            </button>
          </div>
        ) : details ? (
          <div className="border-t border-zinc-100 pt-2 mt-2 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-xs uppercase text-zinc-400">Deep Analysis</h4>
              <span className="text-[10px] text-zinc-400">
                {new Date(details.last_analyzed).toLocaleDateString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-50 p-1.5 rounded">
                <span className="block text-zinc-400">Moisture</span>
                <span className="font-mono font-medium">{details.soil_moisture}%</span>
              </div>
              <div className="bg-zinc-50 p-1.5 rounded">
                <span className="block text-zinc-400">Canopy</span>
                <span className="font-mono font-medium">{details.canopy_cover}%</span>
              </div>
            </div>

            {details.alerts.length > 0 && (
              <div className="bg-red-50 text-red-700 p-2 rounded text-xs border border-red-100">
                <strong>Warning:</strong> {details.alerts[0]}
              </div>
            )}

            <div>
              <span className="text-xs text-zinc-400 block mb-1">History</span>
              <div className="flex gap-1">
                {details.historical_changes.slice(-3).map(h => (
                  <div key={h.year} className="h-1.5 flex-1 rounded-full bg-zinc-200 overflow-hidden" title={`${h.year}: ${h.status}`}>
                    <div className={`h-full w-full ${
                      h.status === 'Healthy' ? 'bg-emerald-500' : 
                      h.status === 'Stable' ? 'bg-blue-500' : 
                      'bg-red-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-red-500">Failed to load details.</p>
        )}
      </div>
    </Popup>
  );
}

export function LiveMap() {
  // Mock data for hotspots
  const hotspots = [
    { id: 'loc_1', pos: [26.92, 75.80], type: 'degradation', intensity: 0.8 },
    { id: 'loc_2', pos: [26.88, 75.75], type: 'construction', intensity: 0.9 },
    { id: 'loc_3', pos: [26.95, 75.85], type: 'natural', intensity: 0.2 },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] w-full relative z-0">
      <MapContainer 
        center={CENTER} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street View">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Earth View (Satellite)">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapUpdater />
        
        {hotspots.map((spot, i) => (
          <Circle
            key={spot.id}
            center={spot.pos as [number, number]}
            pathOptions={{ 
              color: spot.type === 'degradation' ? 'red' : spot.type === 'construction' ? 'orange' : 'green',
              fillColor: spot.type === 'degradation' ? 'red' : spot.type === 'construction' ? 'orange' : 'green',
              fillOpacity: 0.5
            }}
            radius={1000 * spot.intensity}
          >
            <LocationPopup id={spot.id} type={spot.type} intensity={spot.intensity} />
          </Circle>
        ))}
      </MapContainer>
      
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-[1000] max-w-xs max-h-[80vh] overflow-y-auto">
        <h3 className="font-bold text-sm mb-2">Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-50"></div>
            <span>Degradation (NDVI Drop)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 opacity-50"></div>
            <span>Construction (High NTL)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-50"></div>
            <span>Natural Growth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
