import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TourService } from '../services/tour.service';
import { SearchService } from '../services/search.service';
import { ImportExportService } from '../services/import-export.service';
import { TourLogService } from '../services/tour-log.service';
import { Tour } from '../models/tour.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  currentUser = signal<any>(null);
  tours = signal<Tour[]>([]);
  filteredTours = signal<Tour[]>([]);
  showCreateModal = signal(false);
  showEditModal = signal(false);
  editingTourId = signal<string | null>(null);

  // Suche
  searchQuery = signal('');
  filterMode = signal<'all' | 'popularity' | 'childFriendly'>('all');

  // Formularfelder
  tourName = signal('');
  tourDescription = signal('');
  tourFrom = signal('');
  tourTo = signal('');
  tourTransportType = signal<'car' | 'bike' | 'foot'>('car');
  loading = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('error');

  constructor(
    private authService: AuthService,
    private tourService: TourService,
    private searchService: SearchService,
    private importExportService: ImportExportService,
    private tourLogService: TourLogService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Lifecycle-Hook: wird beim Start der Komponente einmal aufgerufen
    this.currentUser.set(this.authService.getCurrentUser());

    // subscribe->hört auf Änderungen des Observables tours$
    this.tourService.tours$.subscribe((tours) => {
      this.tours.set(tours);
      this.applyFilters();
    });
  }

   applyFilters(): void {
     let filtered = this.tours();
     if (this.searchQuery().trim()) {
       filtered = this.searchService.searchTours(this.searchQuery(), filtered, this.tourLogService.getTourLogs()).tours;
     }
     if (this.filterMode() === 'popularity') {
       filtered = this.searchService.filterByPopularity(filtered, 1);
     } else if (this.filterMode() === 'childFriendly') {
       filtered = this.searchService.filterByChildFriendliness(filtered, 70);
     }
     this.filteredTours.set(filtered);
   }

   onSearchChange(): void { this.applyFilters(); }
   onFilterChange(): void { this.applyFilters(); }

   logout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
   goToProfile(): void { this.router.navigate(['/profile']); }
   viewTour(id: string): void { this.router.navigate(['/tour', id]); }// ['/tour', id] = Route mit Parameter, z. B. /tour/123

  openCreateModal(): void { this.showCreateModal.set(true); this.resetForm(); }
   closeCreateModal(): void { this.showCreateModal.set(false); this.resetForm(); }

   resetForm(): void {
     this.tourName.set('');
     this.tourDescription.set('');
     this.tourFrom.set('');
     this.tourTo.set('');
     this.tourTransportType.set('car');
     this.message.set('');
     this.loading.set(false);
   }

   editTour(id: string, event?: Event): void {
     event?.stopPropagation();// stopPropagation() wird nur ausgeführt, wenn event wirklich existiert
     const tour = this.tours().find(t => t.id === id);
     if (tour) {
       this.editingTourId.set(id);
       this.tourName.set(tour.name);
       this.tourDescription.set(tour.description || '');
       this.tourFrom.set(tour.from);
       this.tourTo.set(tour.to);
       this.tourTransportType.set(tour.transportType);
       this.showEditModal.set(true);
     }
   }

   closeEditModal(): void { this.showEditModal.set(false); this.editingTourId.set(null); this.resetForm(); }

    deleteTour(id: string, event?: Event): void {
      event?.stopPropagation();
      if (confirm('Are you sure you want to delete this tour?')) this.tourService.deleteTour(id);// confirm zeigt ein Browser-Bestätigungsfenster
    }

  // Promise<void> = gibt später kein Ergebnis zurück, nur Abschluss
   async onSubmitTour(): Promise<void> {
     this.loading.set(true);
     this.message.set('');
     if (!this.tourName() || !this.tourFrom() || !this.tourTo()) {
       this.message.set('Please fill in all required fields.');
       this.messageType.set('error');
       this.loading.set(false);
       return;
     }
     const result = await this.tourService.createTour({
       name: this.tourName(),
       description: this.tourDescription(),
       from: this.tourFrom(),
       to: this.tourTo(),
       transportType: this.tourTransportType(),
     });
     this.message.set(result.message);
     this.messageType.set(result.success ? 'success' : 'error');
     if (result.success) {
       this.loading.set(false);
       setTimeout(() => this.closeCreateModal(), 1500);
     }
     this.loading.set(false);
   }

   async onSubmitEditTour(): Promise<void> {
     this.loading.set(true);
     this.message.set('');
     if (!this.tourName() || !this.tourFrom() || !this.tourTo()) {
       this.message.set('Please fill in all required fields.');
       this.messageType.set('error');
       this.loading.set(false);
       return;
     }
     const tourId = this.editingTourId();
     if (!tourId) {
       this.message.set('Error: Tour ID not found.');
       this.messageType.set('error');
       this.loading.set(false);
       return;
     }
     const result = await this.tourService.updateTour(tourId, {
       name: this.tourName(),
       description: this.tourDescription(),
       from: this.tourFrom(),
       to: this.tourTo(),
       transportType: this.tourTransportType(),
     });
     this.message.set(result.message);
     this.messageType.set(result.success ? 'success' : 'error');
     if (result.success) {
       this.loading.set(false);
       setTimeout(() => this.closeEditModal(), 1500);
     }
     this.loading.set(false);
   }

   getTransportIcon(type: string): string {
     const icons: { [key: string]: string } = { car: 'Car', bike: 'Bike', foot: 'Walk' };
     return icons[type] || 'Car';//falls type nicht gefunden wird, wird Auto-Icon zurückgegeben
   }

   formatDistance(km: number): string { return `${km} km`; }

   formatTime(minutes: number): string {
     const hours = Math.floor(minutes / 60);
     const mins = minutes % 60;
     return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
   }

  exportToJson(): void {
    const logs = this.tourLogService.getTourLogs();
    this.importExportService.exportToJson(
      this.tours(),
      logs,
      `tourplanner-${new Date().toISOString().split('T')[0]}.json`,
    );
    this.showMessage('Export erfolgreich!', 'success');
  }

  exportToCsv(): void {
    const logs = this.tourLogService.getTourLogs();
    this.importExportService.exportToCsv(
      this.tours(),
      logs,
      `tourplanner-${new Date().toISOString().split('T')[0]}.csv`,
    );
    this.showMessage('Export erfolgreich!', 'success');
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0]; // greift auf die erste ausgewählte Datei zu
    if (!file) return;

    this.importExportService.importFromJson(file).then((result) => {
      if (result.success && result.data) {
        const currentTours = this.tours();

        const mergedTours = [...currentTours, ...result.data.tours];

        this.tours().forEach((t) => this.tourService.deleteTour(t.id));
        mergedTours.forEach((t) => {
          if (!this.tours().find((x) => x.id === t.id)) {
            this.tourService.createTour({
              name: t.name,
              description: t.description,
              from: t.from,
              to: t.to,
              transportType: t.transportType,
            });
          }
        });
      }
      this.showMessage(result.message, result.success ? 'success' : 'error');
      (event.target as HTMLInputElement).value = '';
    });
  }

  private showMessage(msg: string, type: 'success' | 'error'): void {
    this.message.set(msg);
    this.messageType.set(type);
    setTimeout(() => this.message.set(''), 3000);
  }
}

