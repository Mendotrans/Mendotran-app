import React, {useEffect, useRef} from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Camera, UserLocation } from '@maplibre/maplibre-react-native';
import { StopsLayer } from './src/map/Stops';
import { SearchBar } from "./src/map/SearchBar";
import * as Location from 'expo-location';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/fiord';

async function requestLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('Permission to access location was denied');
    return;
  }
  // Proceed with accessing location
}

export default function App() {
  const cameraRef = useRef<any>(null);

  const handleLocationSelect = (lon: number, lat: number) => {

      cameraRef.current?.easeTo({
          center: [lon, lat],
          duration: 1000,
          zoom: 13,
        });
  };

  useEffect(() => {
      requestLocation();
  })

  return (
    <View style={styles.container}>
      {/* UI layer sits on top of Map layer */}
      <SearchBar onLocationSelect={handleLocationSelect} />

      <Map
        style={styles.map}
        mapStyle={MAP_STYLE}
        androidView="texture"
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            zoom: 14,
          }}
          trackUserLocation={"default"}
        />
          <UserLocation animated={true} />


        <StopsLayer />
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});