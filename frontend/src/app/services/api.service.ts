import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import {
  Detection,
  Manufacturer,
  CreateDetectionPayload,
  PaginatedResponse,
  StatsResponse,
} from '../models/drone.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly apiBaseUrl = 'http://localhost:8080/api/v1';
  private mockDetections: Detection[];
  private detectionId = 100;

  constructor(private http: HttpClient) {
    this.mockDetections = this.generateMockDetections();
  }

  /**
   * Fetch all detections with optional pagination and filters
   */
  getDetections(
    page: number = 1,
    limit: number = 20,
    manufacturerId?: number,
    location?: string
  ): Observable<PaginatedResponse<Detection>> {
    // Try real API first, fall back to mock if unavailable
    return this.http
      .get<PaginatedResponse<Detection>>(`${this.apiBaseUrl}/detections`, {
        params: this.buildParams(page, limit, manufacturerId, location),
      })
      .pipe(
        catchError((error) => {
          // If API fails, return mock data
          console.warn('API unavailable, using mock data');
          return of(this.getMockDetectionsResponse(page, limit));
        })
      );
  }

  /**
   * Fetch the latest detections
   */
  getLatestDetections(): Observable<Detection[]> {
    return this.http
      .get<Detection[]>(`${this.apiBaseUrl}/detections/latest`)
      .pipe(
        catchError((error) => {
          // Return mock data on failure
          return of(this.mockDetections.slice(0, 5)).pipe(delay(300));
        })
      );
  }

  /**
   * Create a new drone detection
   */
  createDetection(
    payload: CreateDetectionPayload
  ): Observable<Detection> {
    return this.http
      .post<Detection>(`${this.apiBaseUrl}/detections`, payload)
      .pipe(
        catchError((error) => {
          // Create mock detection on failure
          const mockDetection = this.createMockDetection(payload);
          return of(mockDetection).pipe(delay(300));
        })
      );
  }

  /**
   * Fetch all manufacturers
   */
  getManufacturers(): Observable<Manufacturer[]> {
    return this.http
      .get<Manufacturer[]>(`${this.apiBaseUrl}/manufacturers`)
      .pipe(
        catchError((error) => {
          // Return mock manufacturers on failure
          return of(this.getMockManufacturers()).pipe(delay(200));
        })
      );
  }

  /**
   * Fetch dashboard statistics
   */
  getStats(): Observable<StatsResponse> {
    return this.http
      .get<StatsResponse>(`${this.apiBaseUrl}/stats`)
      .pipe(
        catchError((error) => {
          // Return mock stats on failure
          return of(this.getMockStats()).pipe(delay(200));
        })
      );
  }

  // ============ PRIVATE HELPER METHODS ============

  private buildParams(
    page: number,
    limit: number,
    manufacturerId?: number,
    location?: string
  ): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (manufacturerId) {
      params = params.set('manufacturer_id', manufacturerId.toString());
    }
    if (location) {
      params = params.set('location', location);
    }
    return params;
  }

  private getMockDetectionsResponse(
    page: number,
    limit: number
  ): PaginatedResponse<Detection> {
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      data: this.mockDetections.slice(start, end),
      pager: {
        currentPage: page,
        count: this.mockDetections.length,
        perPage: limit,
        total: this.mockDetections.length,
      },
    };
  }

  private createMockDetection(payload: CreateDetectionPayload): Detection {
    const detection: Detection = {
      id: ++this.detectionId,
      mac_address: payload.mac,
      manufacturer_id: 1,
      rssi: payload.rssi,
      sensor_location: payload.sensor_location,
      detected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      manufacturer_name: 'DJI Technology Co., Ltd.',
    };
    
    // Add to mock storage
    this.mockDetections.unshift(detection);
    return detection;
  }

  private generateMockDetections(): Detection[] {
    const locations = [
      'Building A - Floor 3',
      'Building B - Rooftop',
      'Parking Lot',
      'Main Entrance',
      'Warehouse',
      'Perimeter',
    ];
    
    const macs = [
      '60:60:1F:AA:BB:CC',
      '60:60:1F:DD:EE:FF',
      '60:60:1F:11:22:33',
      '60:60:1F:44:55:66',
      'AA:BB:CC:DD:EE:FF',
    ];

    const detections: Detection[] = [];
    for (let i = 0; i < 8; i++) {
      detections.push({
        id: i + 1,
        mac_address: macs[i % macs.length],
        manufacturer_id: i % 2 === 0 ? 1 : null,
        rssi: Math.floor(Math.random() * (-30 - (-95)) + (-95)),
        sensor_location: locations[i % locations.length],
        detected_at: new Date(Date.now() - i * 60000).toISOString(),
        created_at: new Date(Date.now() - i * 60000 - 5000).toISOString(),
        manufacturer_name:
          i % 2 === 0 ? 'DJI Technology Co., Ltd.' : undefined,
      });
    }
    return detections;
  }

  private getMockManufacturers(): Manufacturer[] {
    return [
      {
        id: 1,
        oui: '60:60:1F',
        name: 'DJI Technology Co., Ltd.',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 2,
        oui: 'AA:BB:CC',
        name: 'Test Manufacturer',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
    ];
  }

  private getMockStats(): StatsResponse {
    return {
      total_detections: this.mockDetections.length,
      unique_drones: new Set(
        this.mockDetections.map((d) => d.mac_address)
      ).size,
      active_locations: new Set(
        this.mockDetections.map((d) => d.sensor_location)
      ).size,
      top_manufacturers: [
        {
          manufacturer_name: 'DJI Technology Co., Ltd.',
          count: 4,
        },
        {
          manufacturer_name: 'Unknown',
          count: 2,
        },
      ],
    };
  }
}
