import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Tour, CreateTourDto } from '../models/tour.model';
import { RouteService } from './route.service';
import { TourLogService } from './tour-log.service';
import { SearchService } from './search.service';

@Injectable({
  providedIn: 'root',
})
export class TourService {
  private readonly TOURS_KEY = 'tp_tours';
  // BehaviorSubject speichert aktuelle Tours und informiert UI bei Änderungen
  private toursSubject = new BehaviorSubject<Tour[]>(this.loadTours());
  public tours$ = this.toursSubject.asObservable();

  constructor(
    private routeService: RouteService,
    private tourLogService: TourLogService,
    private searchService: SearchService,
  ) {}

  getTours(): Tour[] {
    const logs = this.tourLogService.getTourLogs();
    // erweitert jede Tour um berechnete Werte (Popularity & ChildFriendliness)
    return this.toursSubject.value.map(tour => ({
      ...tour,
      popularity: this.searchService.calculatePopularity(tour.id, logs),
      childFriendliness: this.searchService.calculateChildFriendliness(tour.id, logs, tour),
    }));
  }

   getTourById(id: string): Observable<Tour> {
     const tour = this.getTours().find(t => t.id === id);
     return of(tour as Tour);// of(...) erstellt ein Observable aus einem Wert
   }

  async createTour(tourDto: CreateTourDto): Promise<{ success: boolean; message: string; tour?: Tour }> {
     try {
       const routeResult = await this.routeService.getRoute(tourDto.from, tourDto.to, tourDto.transportType);
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
       this.saveTours(tours);// speichert Daten im localStorage
       this.toursSubject.next(tours);// informiert alle Observer über Änderung
       return { success: true, message: 'Tour created successfully!', tour };
     } catch (error) {
       return { success: false, message: 'Failed to create tour.' };
     }
   }

  deleteTour(id: string): void {
    const tours = this.getTours().filter(t => t.id !== id);
    this.saveTours(tours);
    this.toursSubject.next(tours);
  }

  async updateTour(id: string, tourDto: CreateTourDto): Promise<{ success: boolean; message: string; tour?: Tour }> {
     try {
       const tours = this.getTours();
       const tourIndex = tours.findIndex(t => t.id === id);
       if (tourIndex === -1) return { success: false, message: 'Tour not found.' };

       const oldTour = tours[tourIndex];
       // prüft, ob sich Route geändert hat -> nur dann neue API-Anfrage
       const routeChanged = oldTour.from !== tourDto.from || oldTour.to !== tourDto.to || oldTour.transportType !== tourDto.transportType;
       let routeResult = { distance: oldTour.distance, duration: oldTour.estimatedTime, coordinates: oldTour.routeInformation.coordinates };

       if (routeChanged) {
         routeResult = await this.routeService.getRoute(tourDto.from, tourDto.to, tourDto.transportType);
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
    // konvertiert gespeicherte Datums-Strings wieder zu Date-Objekten
    return tours.map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }));
  }

  private saveTours(tours: Tour[]): void {
    localStorage.setItem(this.TOURS_KEY, JSON.stringify(tours));
  }
}
