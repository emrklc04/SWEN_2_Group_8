import { Injectable } from '@angular/core';
import { Tour, TourLog } from '../models/tour.model';

export interface ExportData {
  tours: Tour[];
  logs: TourLog[];
  exportDate: string;
  version: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImportExportService {
  private readonly VERSION = '1.0';

  exportToJson(tours: Tour[], logs: TourLog[], filename: string = 'tourplanner-export.json'): void {
    const exportData: ExportData = {
      tours,
      logs,
      exportDate: new Date().toISOString(),
      version: this.VERSION,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    this.downloadFile(dataBlob, filename);
  }

  exportToCsv(tours: Tour[], logs: TourLog[], filename: string = 'tourplanner-export.csv'): void {
    let csv = 'TOURS\n';
    csv += 'ID,Name,Description,From,To,Transport,Distance,Time,Created\n';

    tours.forEach((tour) => {
      const date = new Date(tour.createdAt).toISOString();
      csv += `"${tour.id}","${tour.name}","${tour.description}","${tour.from}","${tour.to}","${tour.transportType}",${tour.distance},${tour.estimatedTime},"${date}"\n`;
    });

    csv += '\nTOUR LOGS\n';
    csv += 'ID,TourID,DateTime,Comment,Difficulty,Distance,Time,Rating,Created\n';

    logs.forEach((log) => {
      const date = new Date(log.dateTime).toISOString();
      const created = new Date(log.createdAt).toISOString();
      csv += `"${log.id}","${log.tourId}","${date}","${log.comment}","${log.difficulty}",${log.totalDistance},${log.totalTime},${log.rating},"${created}"\n`;
    });

    const dataBlob = new Blob([csv], { type: 'text/csv' });
    this.downloadFile(dataBlob, filename);
  }

  async importFromJson(
    file: File,
  ): Promise<{ success: boolean; data?: ExportData; message: string }> {
    try {
      const content = await this.readFileAsText(file);
      const data = JSON.parse(content) as ExportData;

      if (!Array.isArray(data.tours) || !Array.isArray(data.logs)) {
        return { success: false, message: 'Invalid file format.' };
      }

      const tours = data.tours.map((t) => ({ ...t, createdAt: new Date(t.createdAt) }));
      const logs = data.logs.map((l) => ({
        ...l,
        dateTime: new Date(l.dateTime),
        createdAt: new Date(l.createdAt),
      }));

      return {
        success: true,
        data: { ...data, tours, logs },
        message: `Imported: ${tours.length} tours and ${logs.length} logs.`,
      };
    } catch (error) {
      return { success: false, message: 'Import failed.' };
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
