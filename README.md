# Interactive Asia Pacific Earthquake Map - Final Delivery

## Project Overview
This project creates an interactive map of the Asia Pacific region showing:
- Terrain base map
- Major earthquake belts (Ring of Fire and Alpide Belt)
- Historical earthquakes from the last 200 years with magnitude ≥ 6.0
- Magnitude-proportional markers
- Interactive tooltips with earthquake details

## Features Implemented
- **Terrain Base Map**: Using OpenTopoMap for detailed topographical visualization
- **Earthquake Belt Overlays**: 
  - Ring of Fire (red line)
  - Alpide Belt (orange line)
- **Dynamic Earthquake Visualization**:
  - Real-time data from USGS Earthquake Catalog API
  - Automatic fallback to static CSV data if API is unavailable
  - Major earthquakes (magnitude ≥ 6.0) from the last 200 years
  - Marker size proportional to earthquake magnitude
  - Color-coding based on earthquake depth
  - Automatic data updates from live API
- **Interactive Elements**:
  - Tooltips showing detailed earthquake information on mouseover
  - Pan and zoom functionality
  - Legends for magnitude and depth
  - Loading indicators and error handling

## Technical Implementation
- **Frontend**: HTML, CSS, JavaScript
- **Libraries**:
  - Leaflet.js for interactive mapping
  - D3.js for data visualization
- **Data Sources**:
  - USGS Earthquake Catalog API (real-time data)
  - Geographic coordinates for earthquake belts
- **API Integration**:
  - Fetch API for HTTP requests
  - GeoJSON format for earthquake data
  - Automatic pagination for large datasets
  - Error handling and retry mechanisms
  - Automatic fallback to static CSV if API fails

## Project Structure
```
earthquake_map_project/
├── index.html           # Main HTML file
├── css/
│   └── styles.css       # Styling for the map and UI elements
├── js/
│   └── map.js           # JavaScript for map functionality and API integration
└── data/
    └── usgs/
        └── major_earthquakes.csv  # Fallback earthquake data (used if API fails)
```

## Usage Instructions
1. Open the map in a web browser
2. Use mouse wheel or touch gestures to zoom in/out
3. Click and drag to pan across the map
4. Hover over earthquake markers to see detailed information
5. Refer to the legends for understanding marker sizes and colors

## Future Enhancements
Potential improvements that could be added:
- Time slider to visualize earthquakes chronologically
- Filtering options by magnitude, depth, or date range
- Additional data layers (population density, tectonic plates)
- Mobile-optimized interface
- Caching mechanism for improved performance
- Real-time earthquake notifications
- Historical earthquake animation
- Export functionality for filtered data
