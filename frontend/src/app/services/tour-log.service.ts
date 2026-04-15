import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TourLog, CreateTourLogDto } from '../models/tour.model';

@Injectable({
  providedIn: 'root',
})
export class TourLogService {
  private readonly TOUR_LOGS_KEY = 'tp_tour_logs';
  private tourLogsSubject = new BehaviorSubject<TourLog[]>(this.loadTourLogs());
  public tourLogs$ = this.tourLogsSubject.asObservable();

  /*getTourLogsByTourId(tourId: string): TourLog[] {
    return this.getTourLogs().filter(log => log.tourId === tourId);
  }*/

  getTourLogs(): TourLog[] { return this.tourLogsSubject.value; }

  /*getTourLogById(logId: string): TourLog | undefined {
    return this.getTourLogs().find(log => log.id === logId);
  }*/

  private validateLogDto(logDto: CreateTourLogDto): { valid: boolean; message: string } {
    if (logDto.rating < 1 || logDto.rating > 5) return { valid: false, message: 'Rating must be between 1 and 5.' };
    if (logDto.totalDistance <= 0 || logDto.totalTime <= 0) return { valid: false, message: 'Distance and time must be greater than 0.' };
    return { valid: true, message: '' };
  }

  async createTourLog(tourId: string, logDto: CreateTourLogDto): Promise<{ success: boolean; message: string; log?: TourLog }> {
     try {
       if (!tourId) return { success: false, message: 'Tour ID is required.' };
       const validation = this.validateLogDto(logDto);
       if (!validation.valid) return { success: false, message: validation.message };

       const tourLog: TourLog = {
         id: Date.now().toString(),
         tourId,
         dateTime: logDto.dateTime,
         comment: logDto.comment,
         difficulty: logDto.difficulty,
         totalDistance: logDto.totalDistance,
         totalTime: logDto.totalTime,
         rating: logDto.rating,
         createdAt: new Date(),
       };

       const logs = this.getTourLogs();
       logs.push(tourLog);
       this.saveTourLogs(logs);
       this.tourLogsSubject.next(logs);
       return { success: true, message: 'Tour log created successfully!', log: tourLog };
     } catch (error) {
       return { success: false, message: 'Failed to create tour log.' };
     }
   }

  async updateTourLog(logId: string, logDto: CreateTourLogDto): Promise<{ success: boolean; message: string; log?: TourLog }> {
     try {
       const logs = this.getTourLogs();
       const logIndex = logs.findIndex(log => log.id === logId);
       if (logIndex === -1) return { success: false, message: 'Tour log not found.' };

       const validation = this.validateLogDto(logDto);
       if (!validation.valid) return { success: false, message: validation.message };

       const updatedLog: TourLog = {
         ...logs[logIndex],
         dateTime: logDto.dateTime,
         comment: logDto.comment,
         difficulty: logDto.difficulty,
         totalDistance: logDto.totalDistance,
         totalTime: logDto.totalTime,
         rating: logDto.rating,
       };

       logs[logIndex] = updatedLog;
       this.saveTourLogs(logs);
       this.tourLogsSubject.next(logs);
       return { success: true, message: 'Tour log updated successfully!', log: updatedLog };
     } catch (error) {
       return { success: false, message: 'Failed to update tour log.' };
     }
   }

  deleteTourLog(logId: string): void {
    const logs = this.getTourLogs().filter(log => log.id !== logId);
    this.saveTourLogs(logs);
    this.tourLogsSubject.next(logs);
  }

  private loadTourLogs(): TourLog[] {
    const logsJson = localStorage.getItem(this.TOUR_LOGS_KEY);
    if (!logsJson) return [];
    const logs = JSON.parse(logsJson);
    return logs.map((log: any) => ({
      ...log,
      dateTime: new Date(log.dateTime),
      createdAt: new Date(log.createdAt),
    }));
  }

  private saveTourLogs(logs: TourLog[]): void {
    localStorage.setItem(this.TOUR_LOGS_KEY, JSON.stringify(logs));
  }
}
