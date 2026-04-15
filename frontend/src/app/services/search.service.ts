import { Injectable } from '@angular/core';
import { Tour, TourLog } from '../models/tour.model';

export interface SearchResult {
  tours: (Tour & { matchedFields: string[] })[];
  totalResults: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {

   //Durchführt eine Full-Text-Suche in Tours und Tour-Logs

   searchTours(query: string, tours: Tour[], logs: TourLog[]): SearchResult {
     if (!query?.trim()) return { tours: [], totalResults: 0 };

     const sq = query.toLowerCase().trim();
     const results: (Tour & { matchedFields: string[] })[] = [];

     tours.forEach(tour => {
       const matchedFields: string[] = [];
       const popularity = this.calculatePopularity(tour.id, logs);
       const childFriendliness = this.calculateChildFriendliness(tour.id, logs, tour);

       // Text-Suche
       if (tour.name.toLowerCase().includes(sq)) matchedFields.push('name');
       if (tour.description.toLowerCase().includes(sq)) matchedFields.push('description');
       if (tour.from.toLowerCase().includes(sq)) matchedFields.push('from');
       if (tour.to.toLowerCase().includes(sq)) matchedFields.push('to');
       if (tour.transportType.toLowerCase().includes(sq)) matchedFields.push('transportType');

       // Tour-Logs durchsuchen
       if (logs.filter(l => l.tourId === tour.id).some(l => l.comment.toLowerCase().includes(sq))) {
         matchedFields.push('tourLogs');
       }

       // Berechnet Attribute durchsuchen
       if (popularity.toString().includes(sq)) matchedFields.push('popularity');
       if (childFriendliness.toString().includes(sq)) matchedFields.push('childFriendliness');

       if (matchedFields.length > 0) {
         results.push({ ...tour, popularity, childFriendliness, matchedFields });
       }
     });

     results.sort((a, b) => b.matchedFields.length - a.matchedFields.length);
     return { tours: results, totalResults: results.length };
   }

  //Berechnet die Popularität einer Tour basierend auf der Anzahl der Tour-Logs
  calculatePopularity(tourId: string, logs: TourLog[]): number {
    return logs.filter(log => log.tourId === tourId).length;
  }

   //Berechnet die Kinderfreundlichkeit (0-100)
   calculateChildFriendliness(tourId: string, logs: TourLog[], tour: Tour): number {
     const tourLogs = logs.filter(log => log.tourId === tourId);

     if (tourLogs.length === 0) {
       let score = 100;
       if (tour.distance > 50) score -= 75;
       else if (tour.distance > 20) score -= 50;
       else if (tour.distance > 10) score -= 25;
       if (tour.estimatedTime > 240) score -= 75;
       else if (tour.estimatedTime > 120) score -= 50;
       else if (tour.estimatedTime > 60) score -= 25;
       if (tour.transportType === 'car') score -= 50;
       else if (tour.transportType === 'bike') score -= 25;
       return Math.max(0, Math.min(100, score));
     }

     const scoreLog = (log: TourLog) => {
       const diffScore = log.difficulty === 'easy' ? 100 : log.difficulty === 'medium' ? 60 : 20;
       const timeScore = log.totalTime > 240 ? 25 : log.totalTime > 120 ? 50 : log.totalTime > 60 ? 75 : 100;
       const distScore = log.totalDistance > 20 ? 25 : log.totalDistance > 10 ? 50 : log.totalDistance > 5 ? 75 : 100;
       return { diffScore, timeScore, distScore };
     };

     const totals = tourLogs.reduce((acc, log) => {
       const { diffScore, timeScore, distScore } = scoreLog(log);
       return { diff: acc.diff + diffScore, time: acc.time + timeScore, dist: acc.dist + distScore };
     }, { diff: 0, time: 0, dist: 0 });

     const result = (totals.diff / tourLogs.length) * 0.4 + (totals.time / tourLogs.length) * 0.3 + (totals.dist / tourLogs.length) * 0.3;
     return Math.round(Math.max(0, Math.min(100, result)));
   }

  //Filtert Tours nach Bewertung (beliebte vs. unpopuläre)
  filterByPopularity(tours: Tour[], minLogs: number = 0, maxLogs?: number): Tour[] {
    return tours.filter(tour => {
      const popularity = tour.popularity || 0;
      if (maxLogs) {
        return popularity >= minLogs && popularity <= maxLogs;
      }
      return popularity >= minLogs;
    });
  }

  //Filtert Tours nach Kinderfreundlichkeit
  filterByChildFriendliness(tours: Tour[], minScore: number = 0, maxScore: number = 100): Tour[] {
    return tours.filter(tour => {
      const score = tour.childFriendliness || 0;
      return score >= minScore && score <= maxScore;
    });
  }
}
