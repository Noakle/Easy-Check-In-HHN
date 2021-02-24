// Calculates the distance between user's current position and position of any of the listed universities
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function getClosestLocationInRange(position) {
    // Coordinates for HHN Sontheim latitude(49,121520-49,123550) and longitude(9,206640-9,212750)
    const sontheimLat = 49.122155;
    const sontheimLon = 9.210513;

    // Coordinates for HHN Bildungscampus latitude(49,147915-49,149500) and longitude(9,215180-9,217810)
    const bildungscampusLat = 49.148305;
    const bildungscampusLon = 9.216469;

    // Coordinates for HHN Schwaebischhall latitude(49,110150-49,112950) and longitude(9,743380-9,752900)
    const schwaebischhallLat = 49.112242;
    const schwaebischhallLon = 9.747212;

    // Coordinates for HHN Kuenzelsau latitude(49,274480-49,275830) and longitude(9,710800-9,715222)
    const kuenzelsauLat = 49.275181;
    const kuenzelsauLon = 9.712367;

    // Maximum distance between the user and the location in km
    const maxDistance = 0.4;

    // User's current position
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Calculate the distance to the locations
    const distanceToSontheim = exportFunctions.calculateDistance(lat, lon, sontheimLat, sontheimLon);
    const distanceToBildungscampus = exportFunctions.calculateDistance(lat, lon, bildungscampusLat, bildungscampusLon);
    const distanceToSchwaebischHall = exportFunctions.calculateDistance(lat, lon, schwaebischhallLat, schwaebischhallLon);
    const distanceToKuenzelsau = exportFunctions.calculateDistance(lat, lon, kuenzelsauLat, kuenzelsauLon);

    // Smallest distance
    const minDistance = Math.min(distanceToSontheim, distanceToBildungscampus, distanceToSchwaebischHall, distanceToKuenzelsau);

    if (distanceToSontheim === minDistance && distanceToSontheim <= maxDistance) {
        return "Sontheim";
    } else if (distanceToBildungscampus === minDistance && distanceToBildungscampus <= maxDistance) {
        return "Bildungscampus";
    } else if (distanceToKuenzelsau === minDistance && distanceToKuenzelsau <= maxDistance) {
        return "Künzelsau";
    } else if (distanceToSchwaebischHall === minDistance && distanceToSchwaebischHall <= maxDistance) {
        return "Schwäbisch Hall";
    } else {
        //The user is not near any of the locations
        return null;
    }
}

const exportFunctions = {
    calculateDistance,
    getClosestLocationInRange
}

module.exports.geo = exportFunctions;