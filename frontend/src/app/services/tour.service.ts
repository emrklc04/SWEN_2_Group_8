import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Tour, CreateTourDto, TourLog } from '../models/tour.model';
import { RouteService } from './route.service';
import { TourLogService } from './tour-log.service';

@Injectable({
  providedIn: 'root',
})
export class TourService {
  private readonly TOURS_KEY = 'tp_tours';
  private toursSubject = new BehaviorSubject<Tour[]>(this.loadTours());
  public tours$ = this.toursSubject.asObservable();

  constructor(
    private routeService: RouteService,
    private tourLogService: TourLogService,
  ) {}

  getTours(): Tour[] {
    return this.enrichToursWithComputedAttributes(this.toursSubject.value);
  }

  private enrichToursWithComputedAttributes(tours: Tour[]): Tour[] {
    const logs = this.tourLogService.getTourLogs();
    return tours.map((tour) => ({
      ...tour,
      popularity: this.calculatePopularity(tour.id, logs),
      childFriendliness: this.calculateChildFriendliness(tour.id, logs, tour),
    }));
  }

  private calculatePopularity(tourId: string, logs: TourLog[]): number {
    return logs.filter((log) => log.tourId === tourId).length;
  }

  private calculateChildFriendliness(tourId: string, logs: TourLog[], tour: Tour): number {
    const tourLogs = logs.filter((log) => log.tourId === tourId);
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
    let difficultyScore = 0,
      timeScore = 0,
      distanceScore = 0;
    tourLogs.forEach((log) => {
      if (log.difficulty === 'easy') difficultyScore += 100;
      else if (log.difficulty === 'medium') difficultyScore += 60;
      else difficultyScore += 20;
      if (log.totalTime > 240) timeScore += 25;
      else if (log.totalTime > 120) timeScore += 50;
      else if (log.totalTime > 60) timeScore += 75;
      else timeScore += 100;
      if (log.totalDistance > 20) distanceScore += 25;
      else if (log.totalDistance > 10) distanceScore += 50;
      else if (log.totalDistance > 5) distanceScore += 75;
      else distanceScore += 100;
    });
    const childFriendliness =
      (difficultyScore / tourLogs.length) * 0.4 +
      (timeScore / tourLogs.length) * 0.3 +
      (distanceScore / tourLogs.length) * 0.3;
    return Math.round(Math.max(0, Math.min(100, childFriendliness)));
  }

  getTourById(id: string): Observable<Tour> {
    const tours = this.enrichToursWithComputedAttributes(this.toursSubject.value);
    const tour = tours.find((t) => t.id === id);
    return of(tour as Tour);
  }

  async createTour(
    tourDto: CreateTourDto,
  ): Promise<{ success: boolean; message: string; tour?: Tour }> {
    try {
      // Hole echte Daten von OpenRouteService API
      const routeResult = await this.routeService.getRoute(
        tourDto.from,
        tourDto.to,
        tourDto.transportType,
      );

      const tour: Tour = {
        id: Date.now().toString(),
        name: tourDto.name,
        description: tourDto.description,
        from: tourDto.from,
        to: tourDto.to,
        transportType: tourDto.transportType,
        distance: routeResult?.distance || 0,
        estimatedTime: routeResult?.duration || 0,
        routeInformation: { coordinates: routeResult?.coordinates || [], bbox: [] },
        createdAt: new Date(),
      };

      const tours = this.getTours();
      tours.push(tour);
      this.saveTours(tours);
      this.toursSubject.next(tours);

      return { success: true, message: 'Tour created successfully!', tour };
    } catch (error) {
      return { success: false, message: 'Failed to create tour.' };
    }
  }

  deleteTour(id: string): void {
    const tours = this.getTours().filter((t) => t.id !== id);
    this.saveTours(tours);
    this.toursSubject.next(tours);
  }

  async updateTour(
    id: string,
    tourDto: CreateTourDto,
  ): Promise<{ success: boolean; message: string; tour?: Tour }> {
    try {
      const tours = this.getTours();
      const tourIndex = tours.findIndex((t) => t.id === id);

      if (tourIndex === -1) {
        return { success: false, message: 'Tour not found.' };
      }

      // Hole echte Daten von OpenRouteService API (nur wenn Start/Ziel geÃ¤ndert wurde)
      const oldTour = tours[tourIndex];
      const routeChanged =
        oldTour.from !== tourDto.from ||
        oldTour.to !== tourDto.to ||
        oldTour.transportType !== tourDto.transportType;

      let routeResult = {
        distance: oldTour.distance,
        duration: oldTour.estimatedTime,
        coordinates: oldTour.routeInformation.coordinates,
      };

      if (routeChanged) {
        routeResult = await this.routeService.getRoute(
          tourDto.from,
          tourDto.to,
          tourDto.transportType,
        );
      }

      const updatedTour: Tour = {
        ...oldTour,
        name: tourDto.name,
        description: tourDto.description,
        from: tourDto.from,
        to: tourDto.to,
        transportType: tourDto.transportType,
        distance: routeResult.distance || 0,
        estimatedTime: routeResult.duration || 0,
        routeInformation: { coordinates: routeResult.coordinates || [], bbox: [] },
      };

      tours[tourIndex] = updatedTour;
      this.saveTours(tours);
      this.toursSubject.next(tours);

      return { success: true, message: 'Tour updated successfully!', tour: updatedTour };
    } catch (error) {
      return { success: false, message: 'Failed to update tour.' };
    }
  }

  private loadTours(): Tour[] {
    const toursJson = localStorage.getItem(this.TOURS_KEY);
    if (!toursJson) return [];
    const tours = JSON.parse(toursJson);
    return tours.map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }));
  }

  private saveTours(tours: Tour[]): void {
    localStorage.setItem(this.TOURS_KEY, JSON.stringify(tours));
  }
}
