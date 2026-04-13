import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  private readonly API_KEY = '5b3ce3b27151a20039f51e9ff9f43331';
  private readonly API_URL = 'https://api.openrouteservice.org/v2/directions';
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  async getRoute(
    from: string,
    to: string,
    transportType: string,
  ): Promise<{
    success: boolean;
    coordinates: any[];
    distance: number;
    duration: number;
  }> {
    try {
      // Geocode die Stadtnamen zu Koordinaten
      const fromCoords = await this.geocodeCity(from);
      const toCoords = await this.geocodeCity(to);

      if (!fromCoords || !toCoords) {
        throw new Error('Could not geocode cities');
      }

      const coordinates = [fromCoords, toCoords];

      try {
        const profile = this.getProfile(transportType);
        const url = `${this.API_URL}/${profile}`;

        const response: any = await this.http
          .post(
            url,
            {
              coordinates: coordinates,
            },
            {
              headers: {
                Authorization: this.API_KEY,
                'Content-Type': 'application/json',
              },
            },
          )
          .toPromise();

        if (response?.routes && response.routes[0]) {
          const distance = Math.round((response.routes[0].summary.distance / 1000) * 10) / 10;
          const duration = Math.round(response.routes[0].summary.duration / 60);
          const geometry = response.routes[0].geometry;

          // Dekodiere die Geometrie wenn sie als Polyline kodiert ist
          const decodedCoordinates = this.decodePolyline(geometry) || [
            [fromCoords[1], fromCoords[0]],
            [toCoords[1], toCoords[0]],
          ];

          return {
            success: true,
            coordinates: decodedCoordinates,
            distance: distance,
            duration: duration,
          };
        }
      } catch (apiError) {
        console.warn('OpenRouteService API Error, using fallback:', apiError);
      }

      // Fallback: berechne mit einfacher Formel
      const distance = this.calculateDistance(
        fromCoords as [number, number],
        toCoords as [number, number],
      );
      const speeds: { [key: string]: number } = { car: 80, bike: 20, foot: 5 };
      const speed = speeds[transportType] || 80;
      const duration = Math.round((distance / speed) * 60);

      // Erstelle eine simple gerade Linie als Fallback
      const fallbackCoordinates = [
        [fromCoords[1], fromCoords[0]],
        [toCoords[1], toCoords[0]],
      ];

      return {
        success: true,
        coordinates: fallbackCoordinates,
        distance: Math.round(distance * 10) / 10,
        duration: duration,
      };
    } catch (error) {
      console.error('Error getting route:', error);
      return {
        success: false,
        coordinates: [],
        distance: 0,
        duration: 0,
      };
    }
  }

  private async geocodeCity(cityName: string): Promise<[number, number] | null> {
    try {
      // Versuche zuerst mit dem genauen Namen
      let response: any = await this.http
        .get(this.NOMINATIM_URL, {
          params: {
            q: cityName,
            format: 'json',
            limit: 5,
            addressdetails: 1,
            dedupe: 1,
          },
        })
        .toPromise();

      // Wenn nichts gefunden, versuche es mit Wildcard-Suche
      if (!response || response.length === 0) {
        response = await this.http
          .get(this.NOMINATIM_URL, {
            params: {
              q: `${cityName}*`,
              format: 'json',
              limit: 5,
              addressdetails: 1,
              dedupe: 1,
            },
          })
          .toPromise();
      }

      // Wenn immer noch nichts, versuche fuzzy search
      if (!response || response.length === 0) {
        response = await this.http
          .get(this.NOMINATIM_URL, {
            params: {
              q: cityName,
              format: 'json',
              limit: 10,
              addressdetails: 1,
              dedupe: 0,
              featuretype: 'city,town,village,hamlet',
            },
          })
          .toPromise();
      }

      if (response && response.length > 0) {
        // Filtere nach Priorität: Cities zuerst, dann Towns, dann Villages
        const priorityOrder = ['city', 'town', 'village', 'hamlet', 'locality'];
        let result = response[0];

        // Versuche, einen besseren Match zu finden
        for (const item of response) {
          const type = item.type || item.osm_type;
          const itemPriority = priorityOrder.indexOf(type);
          const resultPriority = priorityOrder.indexOf(result.type || result.osm_type);

          if (itemPriority !== -1 && (resultPriority === -1 || itemPriority < resultPriority)) {
            result = item;
          }
        }

        const coords: [number, number] = [parseFloat(result.lon), parseFloat(result.lat)];
        console.log(
          `✓ Geocoded "${cityName}" to [${coords[0]}, ${coords[1]}] (${result.display_name})`,
        );
        return coords;
      }

      console.warn(`✗ Could not geocode city: ${cityName}`);
      return null;
    } catch (error) {
      console.warn(`Error geocoding "${cityName}":`, error);
      return null;
    }
  }

  private decodePolyline(encoded: string): any[] | null {
    try {
      const coordinates = [];
      let index = 0,
        lat = 0,
        lng = 0;

      while (index < encoded.length) {
        let result = 0,
          shift = 0;
        let c;
        do {
          c = encoded.charCodeAt(index++) - 63;
          result |= (c & 0x1f) << shift;
          shift += 5;
        } while (c >= 0x20);
        const dlat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        result = 0;
        shift = 0;
        do {
          c = encoded.charCodeAt(index++) - 63;
          result |= (c & 0x1f) << shift;
          shift += 5;
        } while (c >= 0x20);
        const dlng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        coordinates.push([lat / 1e5, lng / 1e5]);
      }
      return coordinates;
    } catch (e) {
      return null;
    }
  }

  private calculateDistance(from: [number, number], to: [number, number]): number {
    // Haversine-Formel für Entfernung
    const R = 6371; // Erdradius in km
    const dLat = ((to[1] - from[1]) * Math.PI) / 180;
    const dLon = ((to[0] - from[0]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from[1] * Math.PI) / 180) *
        Math.cos((to[1] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private getProfile(transportType: string): string {
    switch (transportType) {
      case 'car':
        return 'driving-car';
      case 'bike':
        return 'cycling-regular';
      case 'foot':
        return 'foot-walking';
      default:
        return 'driving-car';
    }
  }
}
