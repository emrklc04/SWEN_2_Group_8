import { Injectable } from '@angular/core';
import { Tour, TourLog } from '../models/tour.model';
import { TourLogService } from './tour-log.service';

export interface SearchResult {
  tours: (Tour & { matchedFields: string[] })[];
  totalResults: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private tourLogService: TourLogService) {}

  /**
   * Durchführt eine Full-Text-Suche in Tours und Tour-Logs
   * Berücksichtigt auch berechnete Attribute (Popularity, Child-Friendliness)
   */
  searchTours(query: string, tours: Tour[], logs: TourLog[]): SearchResult {
    if (!query || query.trim().length === 0) {
      return { tours: [], totalResults: 0 };
    }

    const searchQuery = query.toLowerCase().trim();
    const results: (Tour & { matchedFields: string[] })[] = [];

    tours.forEach(tour => {
      const matchedFields: string[] = [];

      // Berechne Attribute
      const popularity = this.calculatePopularity(tour.id, logs);
      const childFriendliness = this.calculateChildFriendliness(tour.id, logs, tour);

      // Durchsuche Text-Felder
      if (tour.name.toLowerCase().includes(searchQuery)) {
        matchedFields.push('name');
      }
      if (tour.description.toLowerCase().includes(searchQuery)) {
        matchedFields.push('description');
      }
      if (tour.from.toLowerCase().includes(searchQuery)) {
        matchedFields.push('from');
      }
      if (tour.to.toLowerCase().includes(searchQuery)) {
        matchedFields.push('to');
      }

      // Durchsuche Tour-Logs dieser Tour
      const tourLogsForThisTour = logs.filter(log => log.tourId === tour.id);
      let hasLogMatch = false;
      tourLogsForThisTour.forEach(log => {
        if (log.comment.toLowerCase().includes(searchQuery)) {
          hasLogMatch = true;
        }
      });
      if (hasLogMatch) {
        matchedFields.push('tourLogs');
      }

      // Durchsuche berechnete Attribute
      if (popularity.toString().includes(searchQuery)) {
        matchedFields.push('popularity');
      }
      if (childFriendliness.toString().includes(searchQuery)) {
        matchedFields.push('childFriendliness');
      }

      // Transport-Typ durchsuchen
      if (tour.transportType.toLowerCase().includes(searchQuery)) {
        matchedFields.push('transportType');
      }

      // Wenn mindestens ein Feld passt, zum Ergebnis hinzufügen
      if (matchedFields.length > 0) {
        results.push({
          ...tour,
          popularity,
          childFriendliness,
          matchedFields
        });
      }
    });

    // Sortiere Ergebnisse nach Relevanz (mehr gematchte Felder = höher)
    results.sort((a, b) => b.matchedFields.length - a.matchedFields.length);

    return { tours: results, totalResults: results.length };
  }

  /**
   * Berechnet die Popularität einer Tour basierend auf der Anzahl der Tour-Logs
   */
  calculatePopularity(tourId: string, logs: TourLog[]): number {
    return logs.filter(log => log.tourId === tourId).length;
  }

  /**
   * Berechnet die Kinderfreundlichkeit (0-100)
   * Basierend auf: Schwierigkeit (niedrig = besser), Gesamtzeit (kurz = besser), Distanz (kurz = besser)
   */
  calculateChildFriendliness(tourId: string, logs: TourLog[], tour: Tour): number {
    const tourLogs = logs.filter(log => log.tourId === tourId);

    if (tourLogs.length === 0) {
      // Wenn keine Logs: Bewerte basierend auf Tour-Attributen
      let score = 100;

      // Distanz: 0-10km = 100, 10-20km = 75, 20-50km = 50, >50km = 25
      if (tour.distance > 50) score -= 75;
      else if (tour.distance > 20) score -= 50;
      else if (tour.distance > 10) score -= 25;

      // Zeit: 0-1h = 100, 1-2h = 75, 2-4h = 50, >4h = 25
      if (tour.estimatedTime > 240) score -= 75;
      else if (tour.estimatedTime > 120) score -= 50;
      else if (tour.estimatedTime > 60) score -= 25;

      // Transport-Typ: Fuß = 100, Fahrrad = 75, Auto = 50
      if (tour.transportType === 'car') score -= 50;
      else if (tour.transportType === 'bike') score -= 25;

      return Math.max(0, Math.min(100, score));
    }

    // Berechne Durchschnitt aus Logs
    let difficultyScore = 0;
    let timeScore = 0;
    let distanceScore = 0;

    tourLogs.forEach(log => {
      // Schwierigkeit: easy = 100, medium = 60, hard = 20
      if (log.difficulty === 'easy') difficultyScore += 100;
      else if (log.difficulty === 'medium') difficultyScore += 60;
      else difficultyScore += 20;

      // Zeit pro Log: 0-1h = 100, 1-2h = 75, 2-4h = 50, >4h = 25
      if (log.totalTime > 240) timeScore += 25;
      else if (log.totalTime > 120) timeScore += 50;
      else if (log.totalTime > 60) timeScore += 75;
      else timeScore += 100;

      // Distanz pro Log: 0-5km = 100, 5-10km = 75, 10-20km = 50, >20km = 25
      if (log.totalDistance > 20) distanceScore += 25;
      else if (log.totalDistance > 10) distanceScore += 50;
      else if (log.totalDistance > 5) distanceScore += 75;
      else distanceScore += 100;
    });

    const avgDifficulty = difficultyScore / tourLogs.length;
    const avgTime = timeScore / tourLogs.length;
    const avgDistance = distanceScore / tourLogs.length;

    const childFriendliness = (avgDifficulty * 0.4 + avgTime * 0.3 + avgDistance * 0.3);

    return Math.round(Math.max(0, Math.min(100, childFriendliness)));
  }

  /**
   * Filtert Tours nach Bewertung (beliebte vs. unpopuläre)
   */
  filterByPopularity(tours: Tour[], minLogs: number = 0, maxLogs?: number): Tour[] {
    return tours.filter(tour => {
      const popularity = tour.popularity || 0;
      if (maxLogs) {
        return popularity >= minLogs && popularity <= maxLogs;
      }
      return popularity >= minLogs;
    });
  }

  /**
   * Filtert Tours nach Kinderfreundlichkeit
   */
  filterByChildFriendliness(tours: Tour[], minScore: number = 0, maxScore: number = 100): Tour[] {
    return tours.filter(tour => {
      const score = tour.childFriendliness || 0;
      return score >= minScore && score <= maxScore;
    });
  }
}
