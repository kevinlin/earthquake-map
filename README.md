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
- **Earthquake Visualization**:
  - 14,266 major earthquakes (magnitude ≥ 6.0) from 1825 to present
  - Marker size proportional to earthquake magnitude
  - Color-coding based on earthquake depth
- **Interactive Elements**:
  - Tooltips showing detailed earthquake information on mouseover
  - Pan and zoom functionality
  - Legends for magnitude and depth

## Technical Implementation
- **Frontend**: HTML, CSS, JavaScript
- **Libraries**:
  - Leaflet.js for interactive mapping
  - D3.js for data visualization
  - PapaParse for CSV data processing
- **Data Sources**:
  - USGS Earthquake Catalog (14,266 earthquakes)
  - Geographic coordinates for earthquake belts

## Project Structure
```
earthquake_map_project/
├── index.html           # Main HTML file
├── css/
│   └── styles.css       # Styling for the map and UI elements
├── js/
│   └── map.js           # JavaScript for map functionality
└── data/
    └── usgs/
        └── major_earthquakes.csv  # Earthquake data
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
