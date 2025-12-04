import { Injectable, signal } from '@angular/core';
import { Observable, Subject, interval, takeUntil } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CreateDetectionPayload, Detection } from '../models/drone.model';

/**
 * Simulation Service
 * Generates random drone detections at regular intervals and registers them via the API
 */
@Injectable({
  providedIn: 'root',
})
export class SimulationService {
  private simulationActive = signal(false);
  private detectionSubject = new Subject<Detection>();
  private stopSimulation$ = new Subject<void>();

  // Drone manufacturers OUI codes
  private readonly KNOWN_OUIES = [
    '60:60:1F', // DJI Technology Co., Ltd.
    'AA:BB:CC', // Test OUI 1
    'DD:EE:FF', // Test OUI 2
    '00:11:22', // Test OUI 3
  ];

  // Sensor locations
  private readonly LOCATIONS = [
    'Building A - Floor 3',
    'Building B - Rooftop',
    'Building A - Parking Lot',
    'Building C - Main Entrance',
    'Warehouse 1 - Storage Area',
    'Hangar 2 - Perimeter',
  ];

  readonly detections$ = this.detectionSubject.asObservable();
  readonly isSimulating = this.simulationActive.asReadonly();

  constructor(private apiService: ApiService) {}

  /**
   * Start the simulation - emit a new drone detection every 5 seconds
   */
  startSimulation(): void {
    if (this.simulationActive()) {
      console.warn('Simulation already running');
      return;
    }

    this.simulationActive.set(true);
    this.stopSimulation$ = new Subject<void>();

    interval(5000) // Every 5 seconds
      .pipe(
        takeUntil(this.stopSimulation$),
        switchMap(() => {
          const payload = this.generateRandomDetection();
          return this.apiService.createDetection(payload);
        }),
        tap((detection) => {
          console.log('Simulated detection:', detection);
          this.detectionSubject.next(detection);
        })
      )
      .subscribe({
        error: (err) => {
          console.error('Simulation error:', err);
          this.simulationActive.set(false);
        },
      });
  }

  /**
   * Stop the simulation
   */
  stopSimulation(): void {
    if (!this.simulationActive()) {
      return;
    }

    this.simulationActive.set(false);
    this.stopSimulation$.next();
    this.stopSimulation$.complete();
  }

  /**
   * Generate random drone detection data matching API requirements
   */
  private generateRandomDetection(): CreateDetectionPayload {
    const oui = this.LOCATIONS[
      Math.floor(Math.random() * this.KNOWN_OUIES.length)
    ];
    const lastThreeOctets = Array.from({ length: 3 })
      .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
      .join(':');
    const macAddress = `${oui}${oui ? ':' : ''}${lastThreeOctets}`;

    return {
      mac: macAddress.toUpperCase(),
      rssi: Math.floor(Math.random() * (-30 - (-95)) + (-95)), // -95 to -30 dBm
      sensor_location:
        this.LOCATIONS[Math.floor(Math.random() * this.LOCATIONS.length)],
      timestamp: new Date().toISOString(),
    };
  }
}
