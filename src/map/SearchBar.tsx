import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SearchFeature {
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    label?: string;
    name?: string;
    city?: string;
  };
}

interface SearchBarProps {
  onLocationSelect: (lon: number, lat: number) => void;
}

export const SearchBar = ({ onLocationSelect }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchFeature[]>([]);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }

    // Bias hacia Mendoza para que el Parque San Martín aparezca primero
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5&lat=-32.89&lon=-68.84`;

    try {
      const response = await fetch(url);
      const json = await response.json();
      setResults(json.features as SearchFeature[]);
    } catch (e) {
      console.error("Error en búsqueda:", e);
    }
  };

  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.input}
        placeholder="Buscar lugar o parada..."
        placeholderTextColor="#666"
        value={query}
        onChangeText={handleSearch}
      />
      {results.length > 0 && (
        <View style={styles.resultsList}>
          {results.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                const [lon, lat] = item.geometry.coordinates;
                console.log("Seleccionado:", lon, lat); // Para debug en consola
                onLocationSelect(lon, lat);
                setResults([]);
                setQuery(item.properties.name || item.properties.label || '');
              }}
              style={styles.resultItem}
            >
              <Text style={styles.mainText}>{item.properties.name || item.properties.label}</Text>
              <Text style={styles.cityText}>{item.properties.city || 'Mendoza'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    position: 'absolute',
    top: 50,
    width: '92%',
    alignSelf: 'center',
    zIndex: 999, // Asegura que esté por encima del mapa
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    color: 'black'
  },
  resultsList: {
    backgroundColor: 'white',
    marginTop: 5,
    borderRadius: 10,
    elevation: 5,
    maxHeight: 300,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  mainText: { fontSize: 16, color: '#333' },
  cityText: { fontSize: 12, color: '#999' }
});