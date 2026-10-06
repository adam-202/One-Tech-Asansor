import { BuildingSite, RouteStop } from '../types';

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Solves Traveling Salesperson problem using Nearest-Neighbor + 2-Opt heuristic
 * to eliminate backtracking and criss-cross routes.
 */
export function optimizeRouteSequence(
  sites: BuildingSite[],
  startLat?: number,
  startLng?: number
): RouteStop[] {
  if (sites.length === 0) return [];
  if (sites.length === 1) {
    return [
      {
        stopNumber: 1,
        site: sites[0],
        distanceFromPrevKm: 0,
        estimatedTravelMin: 0,
      },
    ];
  }

  // 1. Initial Nearest-Neighbor greedy construction
  const remaining = [...sites];
  const route: BuildingSite[] = [];

  // Determine starting point: closest to start coords or first item
  let currentLat = startLat ?? sites[0].latitude;
  let currentLng = startLng ?? sites[0].longitude;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistanceKm(
        currentLat,
        currentLng,
        remaining[i].latitude,
        remaining[i].longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const nextSite = remaining.splice(nearestIndex, 1)[0];
    route.push(nextSite);
    currentLat = nextSite.latitude;
    currentLng = nextSite.longitude;
  }

  // 2. 2-Opt heuristic refinement to uncross paths
  let improved = true;
  let iterations = 0;
  const maxIterations = 30;

  function calculateTotalDistance(path: BuildingSite[]): number {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      total += calculateDistanceKm(
        path[i].latitude,
        path[i].longitude,
        path[i + 1].latitude,
        path[i + 1].longitude
      );
    }
    return total;
  }

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < route.length - 1; i++) {
      for (let k = i + 1; k < route.length; k++) {
        // Swap sub-segment
        const newRoute = [...route.slice(0, i), ...route.slice(i, k + 1).reverse(), ...route.slice(k + 1)];
        if (calculateTotalDistance(newRoute) < calculateTotalDistance(route) - 0.01) {
          route.splice(0, route.length, ...newRoute);
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  // 3. Assemble final RouteStop structures with distances and estimated travel times
  return route.map((site, index) => {
    let dist = 0;
    if (index > 0) {
      dist = calculateDistanceKm(
        route[index - 1].latitude,
        route[index - 1].longitude,
        site.latitude,
        site.longitude
      );
    }
    // Assume average urban speed of 25 km/h + 2 min parking buffer
    const estimatedMinutes = Math.round((dist / 25) * 60) + (index === 0 ? 0 : 2);

    return {
      stopNumber: index + 1,
      site,
      distanceFromPrevKm: Number(dist.toFixed(2)),
      estimatedTravelMin: Math.max(1, estimatedMinutes),
    };
  });
}

/**
 * Builds a direct Google Maps multi-stop directions URL
 * Suitable for launching in browser or mobile Google Maps app for GPS turn-by-turn navigation.
 */
export function buildGoogleMapsRouteUrl(stops: RouteStop[]): string {
  if (stops.length === 0) return 'https://www.google.com/maps';

  if (stops.length === 1) {
    const s = stops[0].site;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${s.latitude},${s.longitude}`
    )}`;
  }

  const origin = `${stops[0].site.latitude},${stops[0].site.longitude}`;
  const destination = `${stops[stops.length - 1].site.latitude},${stops[stops.length - 1].site.longitude}`;

  const waypoints = stops
    .slice(1, stops.length - 1)
    .map((stop) => `${stop.site.latitude},${stop.site.longitude}`)
    .join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  return url;
}

/**
 * Build single site Google Maps search/navigation link
 */
export function buildSingleSiteMapUrl(site: BuildingSite): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${site.name}, ${site.address}`
  )}`;
}

/**
 * Evaluates route optimization metrics comparing unorganized order vs 2-opt sequence
 */
export function evaluateRouteOptimizationMetrics(sites: BuildingSite[]) {
  if (sites.length < 2) {
    return {
      unoptimizedKm: 0,
      optimizedKm: 0,
      savedKm: 0,
      savedPercent: 0,
      savedMinutes: 0,
      optimizedStops: optimizeRouteSequence(sites),
    };
  }

  let unoptimizedKm = 0;
  for (let i = 0; i < sites.length - 1; i++) {
    unoptimizedKm += calculateDistanceKm(
      sites[i].latitude,
      sites[i].longitude,
      sites[i + 1].latitude,
      sites[i + 1].longitude
    );
  }

  const optimizedStops = optimizeRouteSequence(sites);
  const optimizedKm = optimizedStops.reduce((sum, s) => sum + s.distanceFromPrevKm, 0);
  const savedKm = Math.max(0, unoptimizedKm - optimizedKm);
  const savedPercent = unoptimizedKm > 0 ? Math.round((savedKm / unoptimizedKm) * 100) : 0;
  const savedMinutes = Math.round((savedKm / 25) * 60);

  return {
    unoptimizedKm: Number(unoptimizedKm.toFixed(2)),
    optimizedKm: Number(optimizedKm.toFixed(2)),
    savedKm: Number(savedKm.toFixed(2)),
    savedPercent,
    savedMinutes,
    optimizedStops,
  };
}
