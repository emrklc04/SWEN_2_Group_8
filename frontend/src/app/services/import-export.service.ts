import { Injectable } from '@angular/core';
import { Tour, TourLog } from '../models/tour.model';

export interface ExportData {
  tours: Tour[];
  logs: TourLog[];
  exportDate: string;
  version: string;
}

@Injectable({
  providedIn: 'root', // Service ist global verfügbar
})
export class ImportExportService {
  private readonly VERSION = '1.0';

  // erstellt ein Export-Objekt und wandelt es in JSON um
  exportToJson(tours: Tour[], logs: TourLog[], filename: string = 'tourplanner-export.json'): void {
    const exportData: ExportData = { tours, logs, exportDate: new Date().toISOString(), version: this.VERSION };
    // speichert Datei lokal im Browser
    this.downloadFile(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }), filename);
  }

  //erstellt CSV-Text für Tour und Tour-Logs
  exportToCsv(tours: Tour[], logs: TourLog[], filename: string = 'tourplanner-export.csv'): void {
    const toursCsv = ['TOURS', 'ID,Name,Description,From,To,Transport,Distance,Time,Created']
      .concat(tours.map(t => `"${t.id}","${t.name}","${t.description}","${t.from}","${t.to}","${t.transportType}",${t.distance},${t.estimatedTime},"${new Date(t.createdAt).toISOString()}"`))
      .join('\n');

    const logsCsv = ['', 'TOUR LOGS', 'ID,TourID,DateTime,Comment,Difficulty,Distance,Time,Rating,Created']
      .concat(logs.map(l => `"${l.id}","${l.tourId}","${new Date(l.dateTime).toISOString()}","${l.comment}","${l.difficulty}",${l.totalDistance},${l.totalTime},${l.rating},"${new Date(l.createdAt).toISOString()}"`))
      .join('\n');

    this.downloadFile(new Blob([toursCsv + logsCsv], { type: 'text/csv' }), filename);
  }

  async importFromJson(file: File): Promise<{ success: boolean; data?: ExportData; message: string }> {
     try {
       const data = JSON.parse(await this.readFileAsText(file)) as ExportData;
       if (!Array.isArray(data.tours) || !Array.isArray(data.logs)) return { success: false, message: 'Invalid file format.' };

       // konvertiert Datums-Strings wieder in Date-Objekte
       const tours = data.tours.map(t => ({ ...t, createdAt: new Date(t.createdAt) }));
       const logs = data.logs.map(l => ({ ...l, dateTime: new Date(l.dateTime), createdAt: new Date(l.createdAt) }));
       return { success: true, data: { ...data, tours, logs }, message: `Imported: ${tours.length} tours and ${logs.length} logs.` };
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

  // erzeugt einen Download-Link im Browser und startet den Download
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
