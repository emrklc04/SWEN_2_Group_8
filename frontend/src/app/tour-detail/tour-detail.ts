import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TourService } from '../services/tour.service';
import { TourLogService } from '../services/tour-log.service';
import { AuthService } from '../services/auth.service';
import { RouteService } from '../services/route.service';
import { Tour, TourLog } from '../models/tour.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-tour-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tour-detail.html',
  styleUrl: './tour-detail.css'
})
export class TourDetail implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Tour properties
  tour: Tour | null = null;
  currentUser = signal<any>(null);
  loading = signal(true);
  map: any;

  // Tour Logs properties
  tourLogs = signal<TourLog[]>([]);
  showLogModal = signal(false);
  showEditLogModal = signal(false);
  editingLogId = signal<string | null>(null);
  logLoading = signal(false);
  logMessage = signal('');
  logMessageType = signal<'success' | 'error'>('error');

  // Form fields for Tour Logs
  logDateTime = signal('');
  logComment = signal('');
  logDifficulty = signal<'easy' | 'medium' | 'hard'>('medium');
  logTotalDistance = signal(0);
  logTotalTime = signal(0);
  logRating = signal(3);

   constructor(
     private tourService: TourService,
     private tourLogService: TourLogService,
     private authService: AuthService,
     private routeService: RouteService,
     private router: Router,
     private route: ActivatedRoute
   ) {}

  ngOnInit(): void {
    this.currentUser.set(this.authService.getCurrentUser());
    this.route.params.subscribe(params => {
      const tourId = params['id'];
      if (tourId) {
        this.loadTour(tourId);
        this.loadTourLogs(tourId);
      }
    });
  }

   loadTour(id: string): void {
     this.tourService.getTourById(id).subscribe(
       async (tour: Tour) => {
         this.tour = tour;

         // Rufe OpenRouteService API auf für Distance, Time und Coordinates
         if (tour.from && tour.to) {
           try {
             const routeData = await this.routeService.getRoute(
               tour.from,
               tour.to,
               tour.transportType
             );

             if (routeData.success) {
               // Update tour mit echten Daten von OpenRouteService API
               this.tour = {
                 ...tour,
                 distance: routeData.distance,
                 estimatedTime: routeData.duration,
                 routeInformation: {
                   coordinates: routeData.coordinates,
                   bbox: this.calculateBBox(routeData.coordinates)
                 }
               };
               console.log('✓ Route-Daten von OpenRouteService API geladen:', {
                 distance: this.tour.distance,
                 duration: this.tour.estimatedTime,
                 coordinates: this.tour.routeInformation.coordinates.length
               });
             }
           } catch (error) {
             console.error('Fehler beim Laden der Route von OpenRouteService:', error);
           }
         }

         this.loading.set(false);
         setTimeout(() => this.initMap(), 200);
       },
       (error) => {
         console.error('Error loading tour:', error);
         this.loading.set(false);
         this.router.navigate(['/dashboard']);
       }
     );
   }

   private calculateBBox(coordinates: [number, number][]): number[] {
     if (coordinates.length === 0) return [0, 0, 0, 0];

     let minLon = coordinates[0][0];
     let maxLon = coordinates[0][0];
     let minLat = coordinates[0][1];
     let maxLat = coordinates[0][1];

     for (const [lon, lat] of coordinates) {
       minLon = Math.min(minLon, lon);
       maxLon = Math.max(maxLon, lon);
       minLat = Math.min(minLat, lat);
       maxLat = Math.max(maxLat, lat);
     }

     return [minLon, minLat, maxLon, maxLat];
   }

   loadTourLogs(tourId: string): void {
     this.tourLogs.set(this.tourLogService.getTourLogs().filter(log => log.tourId === tourId));
   }


   initMap(): void {
     if (!this.mapContainer || !this.tour) return;
     this.map = L.map(this.mapContainer.nativeElement).setView([51.505, -0.09], 4);
     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(this.map);
     this.displayRoute();
   }

   displayRoute(): void {
     if (!this.tour?.routeInformation?.coordinates || this.tour.routeInformation.coordinates.length === 0) {
       L.marker([51.505, -0.09]).addTo(this.map).bindPopup(`${this.tour?.from} → ${this.tour?.to}`);
       return;
     }
     const latLngs = this.tour.routeInformation.coordinates;
     L.polyline(latLngs, { color: '#667eea', weight: 3 }).addTo(this.map);
     if (latLngs.length > 0) {
       L.marker([latLngs[0][0], latLngs[0][1]]).addTo(this.map).bindPopup(this.tour?.from || 'Start');
       L.marker([latLngs[latLngs.length - 1][0], latLngs[latLngs.length - 1][1]]).addTo(this.map).bindPopup(this.tour?.to || 'End');
       this.map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50] });
     }
   }

   // Tour Log Modal Methods
  openLogModal(): void {
    this.showLogModal.set(true);
    this.resetLogForm();
  }

  closeLogModal(): void {
    this.showLogModal.set(false);
    this.resetLogForm();
  }

  openEditLogModal(logId: string): void {
    const log = this.tourLogs().find((l: TourLog) => l.id === logId);
    if (log) {
      this.editingLogId.set(logId);
      this.logDateTime.set(new Date(log.dateTime).toISOString().slice(0, 16));
      this.logComment.set(log.comment);
      this.logDifficulty.set(log.difficulty);
      this.logTotalDistance.set(log.totalDistance);
      this.logTotalTime.set(log.totalTime);
      this.logRating.set(log.rating);
      this.showEditLogModal.set(true);
    }
  }

  closeEditLogModal(): void {
    this.showEditLogModal.set(false);
    this.editingLogId.set(null);
    this.resetLogForm();
  }

  resetLogForm(): void {
    this.logDateTime.set('');
    this.logComment.set('');
    this.logDifficulty.set('medium');
    this.logTotalDistance.set(0);
    this.logTotalTime.set(0);
    this.logRating.set(3);
    this.logMessage.set('');
    this.logLoading.set(false);
  }

   async onSubmitTourLog(): Promise<void> {
     this.logLoading.set(true);
     this.logMessage.set('');

     if (!this.logDateTime() || !this.logComment() || this.logTotalDistance() <= 0 || this.logTotalTime() <= 0 || this.logRating() < 1 || this.logRating() > 5) {
       this.logMessage.set('Please fill in all required fields correctly.');
       this.logMessageType.set('error');
       this.logLoading.set(false);
       return;
     }

     const result = await this.tourLogService.createTourLog(this.tour?.id || '', {
       dateTime: new Date(this.logDateTime()),
       comment: this.logComment(),
       difficulty: this.logDifficulty(),
       totalDistance: this.logTotalDistance(),
       totalTime: this.logTotalTime(),
       rating: this.logRating()
     });
     this.logMessage.set(result.message);
     this.logMessageType.set(result.success ? 'success' : 'error');
     this.logLoading.set(false);

     if (result.success) {
       setTimeout(() => this.closeLogModal(), 1000);
     }
   }

   async onSubmitEditTourLog(): Promise<void> {
     this.logLoading.set(true);
     this.logMessage.set('');

     if (!this.logDateTime() || !this.logComment() || this.logTotalDistance() <= 0 || this.logTotalTime() <= 0) {
       this.logMessage.set('Please fill in all required fields.');
       this.logMessageType.set('error');
       this.logLoading.set(false);
       return;
     }

     const logId = this.editingLogId();
     if (!logId) {
       this.logMessage.set('Error: Log ID not found.');
       this.logMessageType.set('error');
       this.logLoading.set(false);
       return;
     }

     const result = await this.tourLogService.updateTourLog(logId, {
       dateTime: new Date(this.logDateTime()),
       comment: this.logComment(),
       difficulty: this.logDifficulty(),
       totalDistance: this.logTotalDistance(),
       totalTime: this.logTotalTime(),
       rating: this.logRating()
     });
     this.logMessage.set(result.message);
     this.logMessageType.set(result.success ? 'success' : 'error');
     this.logLoading.set(false);

     if (result.success) {
       setTimeout(() => this.closeEditLogModal(), 1000);
     }
   }

   deleteTourLog(logId: string, event?: Event): void {
     event?.stopPropagation();
     if (confirm('Are you sure you want to delete this tour log?')) this.tourLogService.deleteTourLog(logId);
   }

   // Utility methods
   backToDashboard(): void { this.router.navigate(['/dashboard']); }

    getTransportIcon(type: string): string {
      const icons: { [key: string]: string } = { car: 'Car', bike: 'Bike', foot: 'Walk' };
      return icons[type] || 'Car';
    }

   formatDistance(km: number): string { return `${km} km`; }

   formatTime(minutes: number): string {
     const hours = Math.floor(minutes / 60);
     return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes % 60}m`;
   }

   formatLogDate(date: Date): string {
     const d = new Date(date);
     return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
   }

    getDifficultyIcon(difficulty: string): string { return difficulty; }

    getRatingStars(rating: number): string { return '★'.repeat(rating) + '☆'.repeat(5 - rating); }

   logout(): void {
     this.authService.logout();
     this.router.navigate(['/auth']);
   }
}

