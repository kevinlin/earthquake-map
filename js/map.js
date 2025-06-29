// Initialize the map centered on Asia Pacific region
let map = L.map('map').setView([20, 130], 3);

// Global variables for earthquake data and layer
let allEarthquakes = [];
let earthquakeLayer;
let currentYearFilter = 200; // Default to show all 200 years

// USGS API configuration
const USGS_API_BASE = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const MIN_MAGNITUDE = 6.0;

// Define two regions to avoid crossing the International Date Line
const ASIA_PACIFIC_BOUNDS_WEST = {
    minlatitude: -60,
    maxlatitude: 70,
    minlongitude: 60,
    maxlongitude: 180  // Western Pacific (Asia to Date Line)
};

const ASIA_PACIFIC_BOUNDS_EAST = {
    minlatitude: -60,
    maxlatitude: 70,
    minlongitude: -180,
    maxlongitude: -120  // Eastern Pacific (Date Line to Americas)
};

// Add terrain base layer
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 18
}).addTo(map);

// Define earthquake belt coordinates
const ringOfFireCoordinates = [
    // North America West Coast
    [60, -150], [55, -135], [50, -125], [45, -125], [40, -125], [35, -120], [30, -115], [25, -110],
    // Central America
    [20, -105], [15, -95], [10, -85],
    // South America West Coast
    [5, -80], [0, -80], [-5, -80], [-10, -75], [-15, -75], [-20, -70], [-25, -70], [-30, -70], [-35, -70], [-40, -75], [-45, -75], [-50, -75],
    // Antarctica to New Zealand
    [-55, -70], [-60, -65], [-65, 170], [-60, 175], [-45, 170], [-40, 175],
    // New Zealand to Papua New Guinea
    [-35, 175], [-30, 170], [-25, 165], [-20, 160], [-15, 155], [-10, 150], [-5, 145],
    // Indonesia, Philippines
    [0, 140], [5, 135], [10, 125], [15, 120],
    // Japan, Kuril Islands, Kamchatka
    [20, 125], [25, 125], [30, 130], [35, 140], [40, 145], [45, 150], [50, 155], [55, 160], [60, 165],
    // Aleutian Islands, Alaska
    [55, 170], [55, 180], [55, -170], [55, -160], [60, -150]
];

const alpideBeltCoordinates = [
    // Mediterranean to Middle East
    [35, -5], [37, 0], [38, 5], [38, 10], [38, 15], [37, 20], [37, 25], [38, 30], [38, 35], [37, 40], [37, 45],
    // Iran, Afghanistan, Pakistan
    [35, 50], [33, 55], [32, 60], [30, 65], [28, 70],
    // Himalayas
    [27, 75], [28, 80], [28, 85], [28, 90], [27, 95],
    // Myanmar, Thailand
    [25, 97], [20, 98], [15, 99], [10, 100],
    // Indonesia (connecting to Ring of Fire)
    [5, 105], [0, 110], [-5, 115], [-10, 120]
];

// Function to draw earthquake belts
function drawEarthquakeBelts() {
    // Draw Ring of Fire
    const ringOfFire = L.polyline(ringOfFireCoordinates, {
        color: 'red',
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1
    }).addTo(map);
    
    // Draw Alpide Belt
    const alpideBelt = L.polyline(alpideBeltCoordinates, {
        color: 'orange',
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1
    }).addTo(map);
    
    // Add legend for earthquake belts
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = 
            '<h4>Earthquake Belts</h4>' +
            '<i style="background: red"></i> Ring of Fire<br>' +
            '<i style="background: orange"></i> Alpide Belt<br>';
        return div;
    };
    legend.addTo(map);
}

// Function to determine marker size based on magnitude
function getMarkerSize(magnitude) {
    return Math.max(3, magnitude * 1.5);
}

// Function to determine marker color based on depth
function getMarkerColor(depth) {
    if (depth < 10) return '#ff0000';       // Red (shallow)
    else if (depth < 50) return '#ff6600';  // Orange
    else if (depth < 100) return '#ffcc00'; // Yellow
    else if (depth < 300) return '#00cc00'; // Green
    else return '#0000ff';                  // Blue (deep)
}

// Function to build USGS API URL
function buildUSGSApiUrl(startDate, endDate, bounds, offset = 1) {
    const params = new URLSearchParams({
        format: 'geojson',
        minmagnitude: MIN_MAGNITUDE,
        starttime: startDate,
        endtime: endDate,
        minlatitude: bounds.minlatitude,
        maxlatitude: bounds.maxlatitude,
        minlongitude: bounds.minlongitude,
        maxlongitude: bounds.maxlongitude,
        orderby: 'time',
        limit: 20000,
        offset: offset
    });
    
    return `${USGS_API_BASE}?${params.toString()}`;
}

// Function to fetch earthquake data from a specific region
async function fetchEarthquakeDataFromRegion(startDate, endDate, bounds, regionName) {
    const earthquakes = [];
    let offset = 1;
    let hasMoreData = true;
    
    console.log(`Fetching earthquake data from ${regionName}...`);
    
    while (hasMoreData) {
        const url = buildUSGSApiUrl(startDate, endDate, bounds, offset);
        console.log(`Fetching ${regionName} data: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error for ${regionName}! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            earthquakes.push(...data.features);
            
            // Check if we got the maximum number of results (20000)
            // If so, there might be more data
            if (data.features.length === 20000) {
                offset += 20000;
            } else {
                hasMoreData = false;
            }
        } else {
            hasMoreData = false;
        }
        
        // Update loading progress
        updateLoadingProgress(earthquakes.length, regionName);
    }
    
    console.log(`Loaded ${earthquakes.length} earthquakes from ${regionName}`);
    return earthquakes;
}

// Function to fetch earthquake data from USGS API (both regions)
async function fetchEarthquakeData(startDate, endDate) {
    const allEarthquakes = [];
    
    // Show loading indicator
    showLoadingIndicator();
    
    try {
        // Fetch from Western Pacific region (Asia to Date Line)
        const westEarthquakes = await fetchEarthquakeDataFromRegion(
            startDate, endDate, ASIA_PACIFIC_BOUNDS_WEST, "Western Pacific"
        );
        allEarthquakes.push(...westEarthquakes);
        
        // Fetch from Eastern Pacific region (Date Line to Americas)
        const eastEarthquakes = await fetchEarthquakeDataFromRegion(
            startDate, endDate, ASIA_PACIFIC_BOUNDS_EAST, "Eastern Pacific"
        );
        allEarthquakes.push(...eastEarthquakes);
        
        // Update final progress
        updateLoadingProgress(allEarthquakes.length, "Both regions complete");
        
        console.log(`Total loaded: ${allEarthquakes.length} earthquakes from both regions`);
        return allEarthquakes;
        
    } catch (error) {
        console.error('Error fetching earthquake data:', error);
        showErrorMessage('Failed to load earthquake data from USGS API. Please try again later.');
        return [];
    } finally {
        hideLoadingIndicator();
    }
}

// Function to show loading indicator
function showLoadingIndicator() {
    // Create loading overlay if it doesn't exist
    if (!document.getElementById('loading-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <h3>Loading Earthquake Data</h3>
                <p>Fetching data from USGS Earthquake Catalog...</p>
                <div id="loading-progress">0 earthquakes loaded</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    document.getElementById('loading-overlay').style.display = 'flex';
}

// Function to update loading progress
function updateLoadingProgress(count, regionInfo = '') {
    const progressElement = document.getElementById('loading-progress');
    if (progressElement) {
        const regionText = regionInfo ? ` (${regionInfo})` : '';
        progressElement.textContent = `${count.toLocaleString()} earthquakes loaded${regionText}`;
    }
}

// Function to hide loading indicator
function hideLoadingIndicator() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Function to show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 10000);
}

// Function to load earthquake data from CSV (fallback)
function loadEarthquakeDataFromCSV() {
    console.log('Falling back to static CSV data...');
    showLoadingIndicator();
    
    // Update loading message for CSV fallback
    const loadingProgress = document.getElementById('loading-progress');
    if (loadingProgress) {
        loadingProgress.textContent = 'Loading from static CSV file...';
    }
    
    // Check if Papa Parse is available
    if (typeof Papa === 'undefined') {
        console.error('PapaParse library not loaded for CSV fallback');
        hideLoadingIndicator();
        showErrorMessage('Unable to load earthquake data. Both API and CSV fallback failed.');
        return;
    }
    
    Papa.parse('data/usgs/major_earthquakes.csv', {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            try {
                allEarthquakes = processCSVEarthquakeData(results.data);
                displayEarthquakes(allEarthquakes);
                setupYearFilter();
                
                // Update the data source info for CSV fallback
                updateDataSourceInfo(allEarthquakes.length, true);
                
            } catch (error) {
                console.error('Failed to process CSV data:', error);
                showErrorMessage('Failed to process earthquake data from CSV file.');
            } finally {
                hideLoadingIndicator();
            }
        },
        error: function(error) {
            console.error('Failed to load CSV file:', error);
            hideLoadingIndicator();
            showErrorMessage('Failed to load earthquake data from both API and CSV file.');
        }
    });
}

// Function to process CSV earthquake data (legacy format)
function processCSVEarthquakeData(earthquakes) {
    const currentYear = new Date().getFullYear();
    
    return earthquakes.map(quake => {
        // Skip if missing essential data
        if (!quake.latitude || !quake.longitude || !quake.mag || !quake.time) return null;
        
        const quakeDate = new Date(quake.time);
        const quakeYear = quakeDate.getFullYear();
        const yearsFromPresent = currentYear - quakeYear;
        
        return {
            lat: parseFloat(quake.latitude),
            lng: parseFloat(quake.longitude),
            magnitude: parseFloat(quake.mag),
            depth: quake.depth ? parseFloat(quake.depth) : 0,
            place: quake.place || 'Unknown location',
            time: quakeDate,
            timeString: quakeDate.toLocaleString(),
            year: quakeYear,
            yearsFromPresent: yearsFromPresent,
            id: quake.id || null,
            url: null
        };
    }).filter(quake => quake !== null);
}

// Function to load earthquake data (updated to use API with CSV fallback)
async function loadEarthquakeData() {
    // Calculate date range for the last 200 years
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 200);
    
    // Format dates for API (ISO 8601)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    try {
        console.log('Attempting to load data from USGS API...');
        const earthquakeFeatures = await fetchEarthquakeData(startDateStr, endDateStr);
        
        // Check if we got any data from the API
        if (earthquakeFeatures && earthquakeFeatures.length > 0) {
            allEarthquakes = processEarthquakeData(earthquakeFeatures);
            displayEarthquakes(allEarthquakes);
            setupYearFilter();
            
            // Update the data source info in the UI
            updateDataSourceInfo(allEarthquakes.length, false);
            console.log(`Successfully loaded ${allEarthquakes.length} earthquakes from API`);
        } else {
            throw new Error('No data received from API');
        }
        
    } catch (error) {
        console.error('API failed, attempting CSV fallback:', error);
        
        // Try to load from CSV as fallback
        try {
            loadEarthquakeDataFromCSV();
        } catch (csvError) {
            console.error('CSV fallback also failed:', csvError);
            hideLoadingIndicator();
            showErrorMessage('Failed to load earthquake data from both API and CSV file. Please check your internet connection and try again.');
        }
    }
}

// Function to process earthquake data from GeoJSON features
function processEarthquakeData(earthquakeFeatures) {
    const currentYear = new Date().getFullYear();
    
    return earthquakeFeatures.map(feature => {
        // Skip if missing essential data
        if (!feature.geometry || !feature.geometry.coordinates || !feature.properties) {
            return null;
        }
        
        const coords = feature.geometry.coordinates;
        const props = feature.properties;
        
        // Skip if missing essential properties
        if (coords.length < 2 || !props.mag || !props.time) {
            return null;
        }
        
        const quakeDate = new Date(props.time);
        const quakeYear = quakeDate.getFullYear();
        const yearsFromPresent = currentYear - quakeYear;
        
        return {
            lat: coords[1], // GeoJSON format: [longitude, latitude, depth]
            lng: coords[0],
            magnitude: props.mag,
            depth: coords[2] || 0, // Depth in km, default to 0 if not provided
            place: props.place || 'Unknown location',
            time: quakeDate,
            timeString: quakeDate.toLocaleString(),
            year: quakeYear,
            yearsFromPresent: yearsFromPresent,
            id: feature.id,
            url: props.url || null
        };
    }).filter(quake => quake !== null);
}

// Function to update data source information
function updateDataSourceInfo(count, isCSVFallback = false) {
    // Update the legend or add a data source indicator
    const dataSourceInfo = document.getElementById('data-source-info');
    
    const sourceType = isCSVFallback ? 'Static CSV File (Fallback)' : 'Real-time API';
    const sourceDetail = isCSVFallback ? 'USGS Earthquake Catalog (Static)' : 'USGS Earthquake Catalog (Real-time)';
    
    if (dataSourceInfo) {
        // Update existing info
        const dataInfo = dataSourceInfo.querySelector('.data-info');
        if (dataInfo) {
            dataInfo.innerHTML = `
                <strong>Data Source:</strong> ${sourceDetail}<br>
                <strong>Total Events:</strong> ${count.toLocaleString()} earthquakes (M≥6.0, last 200 years)<br>
                <strong>Region:</strong> Asia Pacific<br>
                <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
                ${isCSVFallback ? '<strong style="color: #e67e22;">⚠️ Using fallback data (API unavailable)</strong>' : ''}
            `;
        }
    } else {
        // Create data source info element
        const infoDiv = document.createElement('div');
        infoDiv.id = 'data-source-info';
        infoDiv.className = `data-source-info ${isCSVFallback ? 'fallback-mode' : ''}`;
        infoDiv.innerHTML = `
            <div class="data-info">
                <strong>Data Source:</strong> ${sourceDetail}<br>
                <strong>Total Events:</strong> ${count.toLocaleString()} earthquakes (M≥6.0, last 200 years)<br>
                <strong>Region:</strong> Asia Pacific<br>
                <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
                ${isCSVFallback ? '<strong style="color: #e67e22;">⚠️ Using fallback data (API unavailable)</strong>' : ''}
            </div>
        `;
        document.body.appendChild(infoDiv);
    }
}

// Function to filter earthquakes by years from present
function filterEarthquakesByYears(years) {
    return allEarthquakes.filter(quake => quake.yearsFromPresent <= years);
}

// Function to display earthquakes on the map
function displayEarthquakes(earthquakes) {
    // Clear existing layer if it exists
    if (earthquakeLayer) {
        map.removeLayer(earthquakeLayer);
    }
    
    // Create a new layer group for earthquakes
    earthquakeLayer = L.layerGroup().addTo(map);
    
    // Process each earthquake
    earthquakes.forEach(quake => {
        // Create marker with size based on magnitude
        const markerSize = getMarkerSize(quake.magnitude);
        const markerColor = getMarkerColor(quake.depth);
        
        const marker = L.circleMarker([quake.lat, quake.lng], {
            radius: markerSize,
            fillColor: markerColor,
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7,
            className: 'earthquake-marker'
        }).addTo(earthquakeLayer);
        
        // Add tooltip with earthquake information
        marker.bindTooltip(`
            <div class="earthquake-tooltip">
                <h3>M${quake.magnitude.toFixed(1)} Earthquake</h3>
                <p><strong>Location:</strong> ${quake.place}</p>
                <p><strong>Date & Time:</strong> ${quake.timeString}</p>
                <p><strong>Depth:</strong> ${quake.depth.toFixed(1)} km</p>
                <p><strong>Coordinates:</strong> ${quake.lat.toFixed(2)}, ${quake.lng.toFixed(2)}</p>
            </div>
        `, {
            sticky: true
        });
    });
    
    // Update earthquake count in the filter label
    document.getElementById('year-value').textContent = `${currentYearFilter} (${earthquakes.length} earthquakes)`;
    
    // Add legend for earthquake magnitudes if it doesn't exist
    if (!document.querySelector('.magnitude-legend')) {
        const magnitudeLegend = L.control({position: 'bottomleft'});
        magnitudeLegend.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'legend magnitude-legend');
            div.innerHTML = 
                '<h4>Magnitude</h4>' +
                '<i style="background: #fff; border-radius: 50%; width: 5px; height: 5px; border: 1px solid #000"></i> 6.0<br>' +
                '<i style="background: #fff; border-radius: 50%; width: 10px; height: 10px; border: 1px solid #000"></i> 7.0<br>' +
                '<i style="background: #fff; border-radius: 50%; width: 15px; height: 15px; border: 1px solid #000"></i> 8.0<br>' +
                '<i style="background: #fff; border-radius: 50%; width: 20px; height: 20px; border: 1px solid #000"></i> 9.0<br>' +
                '<h4>Depth</h4>' +
                '<i style="background: #ff0000"></i> < 10 km<br>' +
                '<i style="background: #ff6600"></i> 10-50 km<br>' +
                '<i style="background: #ffcc00"></i> 50-100 km<br>' +
                '<i style="background: #00cc00"></i> 100-300 km<br>' +
                '<i style="background: #0000ff"></i> > 300 km<br>';
            return div;
        };
        magnitudeLegend.addTo(map);
    }
}

// Function to set up year filter slider and button
function setupYearFilter() {
    const yearSlider = document.getElementById('year-slider');
    const yearValue = document.getElementById('year-value');
    const applyFilterBtn = document.getElementById('apply-filter');
    const refreshDataBtn = document.getElementById('refresh-data');
    
    // Update the displayed value when slider changes
    yearSlider.addEventListener('input', function() {
        yearValue.textContent = this.value;
    });
    
    // Apply filter when button is clicked
    applyFilterBtn.addEventListener('click', function() {
        currentYearFilter = parseInt(yearSlider.value);
        const filteredEarthquakes = filterEarthquakesByYears(currentYearFilter);
        displayEarthquakes(filteredEarthquakes);
    });
    
    // Refresh data when button is clicked
    refreshDataBtn.addEventListener('click', async function() {
        // Disable button during refresh
        refreshDataBtn.disabled = true;
        refreshDataBtn.textContent = 'Refreshing...';
        
        try {
            await loadEarthquakeData();
        } catch (error) {
            console.error('Failed to refresh data:', error);
        } finally {
            // Re-enable button
            refreshDataBtn.disabled = false;
            refreshDataBtn.textContent = 'Refresh Data';
        }
    });
}

// Mouse inactivity functionality
let inactivityTimer;
let showTimer;
const INACTIVITY_DELAY = 3000; // 3 seconds
const SHOW_DELAY = 1000; // 1 second delay before showing

function hideHeaderFooter() {
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    
    header.classList.add('hidden');
    footer.classList.add('hidden');
}

function showHeaderFooter() {
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    
    header.classList.remove('hidden');
    footer.classList.remove('hidden');
}

function resetInactivityTimer() {
    // Clear existing timers
    clearTimeout(inactivityTimer);
    
    // Show header and footer with delay
    showTimer = setTimeout(showHeaderFooter, SHOW_DELAY);
    
    // Set new inactivity timer
    inactivityTimer = setTimeout(hideHeaderFooter, INACTIVITY_DELAY);
}

// Add mouse move event listener to the entire document
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('mousedown', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('scroll', resetInactivityTimer);
document.addEventListener('touchstart', resetInactivityTimer);

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Draw earthquake belts
    drawEarthquakeBelts();
    
    // Load and display earthquake data
    loadEarthquakeData();
    
    // Start inactivity timer
    resetInactivityTimer();
});
