export interface Tour {
  id: string;
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: 'car' | 'bike' | 'foot';
  distance: number; // in kilometers
  estimatedTime: number; // in minutes
  routeInformation: RouteInformation;
  createdAt: Date;
  logs?: TourLog[]; // Tour Logs für diese Tour
  popularity?: number; // Automatisch berechnet: Anzahl der Tour Logs
  childFriendliness?: number; // Automatisch berechnet: 0-100, basierend auf Schwierigkeit, Zeit, Distanz
}

export interface TourLog {
  id: string;
  tourId: string;
  dateTime: Date;
  comment: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalDistance: number; // in kilometers
  totalTime: number; // in minutes
  rating: number; // 1-5
  createdAt: Date;
}

export interface CreateTourLogDto {
  dateTime: Date;
  comment: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalDistance: number;
  totalTime: number;
  rating: number;
}

export interface RouteInformation {
  coordinates: [number, number][]; // [longitude, latitude]
  bbox: number[]; // bounding box [minLon, minLat, maxLon, maxLat]
}

export interface CreateTourDto {
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: 'car' | 'bike' | 'foot';
}
