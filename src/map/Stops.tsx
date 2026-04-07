import React from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { useStops } from '../db/hooks/useStops';

export const StopsLayer = () => {
    const { data, isLoading } = useStops();

    // 1. Log to check if data is actually reaching this component
    console.log("StopsLayer Data:", data?.features?.length);

    if (isLoading || !data?.features || data.features.length === 0) {
        return null;
    }

    return (
        <GeoJSONSource id="mendo-source" data={data} cluster={true} clusterRadius={35}>
            {/* CLUSTERS */}
            <Layer
                id="mendo-clusters"
                type="circle"
                filter={['has', 'point_count']}
                paint={{
                    'circle-radius':7,
                    'circle-color': '#1b8d00',
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                }}
            />

            {/* 2. THE ID TAG (Text on top) */}
            <Layer
                id="mendo-points-labels"
                type="symbol" // Symbol type allows text
                filter={['!', ['has', 'point_count']]}
                layout={{
                    // This pulls the 'code' field from your properties
                    'text-field': ['get', 'code'],
                    'text-size': 12,
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top',
                    'text-font': ['Noto Sans Regular'],
                }}
                paint={{
                    'text-color': '#ffffff',
                    'text-halo-color': '#000000',
                    'text-halo-width': 1,
                }}
            />

            {/* INDIVIDUAL POINTS */}
            <Layer
                id="mendo-points"
                type="circle"
                filter={['!', ['has', 'point_count']]}
                paint={{
                    'circle-radius': 7, // Made larger to be seen
                    'circle-color': '#22c000', // RED so we can distinguish from default icons
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                }}
            />
        </GeoJSONSource>
    );
};