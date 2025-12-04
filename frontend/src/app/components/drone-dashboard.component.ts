import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DroneCardComponent } from './drone-card.component';
import { ApiService } from '../services/api.service';
import { DroneStateService } from '../services/drone-state.service';
import { SimulationService } from '../services/simulation.service';
import { Detection, CreateDetectionPayload } from '../models/drone.model';

@Component({
  selector: 'app-drone-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DroneCardComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <!-- Header -->
      <div class="max-w-7xl mx-auto">
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-800 mb-2">
            Drone Detection Dashboard
          </h1>
          <p class="text-gray-600">
            Monitor and track detected drones in real-time
          </p>
        </div>

        <!-- Blocked Alert Banner -->
        <div
          *ngIf="blockedAlert()"
          class="mb-6 p-4 bg-red-500 text-white rounded-lg shadow-lg animate-pulse"
        >
          <p class="font-bold text-lg">{{ blockedAlert() }}</p>
        </div>

        <!-- Stats Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-gray-600 text-sm font-semibold mb-2">
              Total Detections
            </h3>
            <p class="text-3xl font-bold text-blue-600">
              {{ totalDetections() }}
            </p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-gray-600 text-sm font-semibold mb-2">
              Unique Drones
            </h3>
            <p class="text-3xl font-bold text-indigo-600">
              {{ uniqueDrones() }}
            </p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-gray-600 text-sm font-semibold mb-2">Blocked</h3>
            <p class="text-3xl font-bold text-red-600">
              {{ blockedDrones() }}
            </p>
          </div>
        </div>

        <!-- Simulation Control Section -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            Automated Simulation
          </h2>
          <div class="flex flex-col md:flex-row gap-4 items-start">
            <button
              (click)="toggleSimulation()"
              [disabled]="false"
              class="px-6 py-3 text-white font-bold rounded-lg transition-all"
              [ngClass]="{
                'bg-red-600 hover:bg-red-700': simulationService.isSimulating(),
                'bg-green-600 hover:bg-green-700': !simulationService.isSimulating()
              }"
            >
              {{
                simulationService.isSimulating()
                  ? 'Stop Simulation'
                  : 'Start Simulation'
              }}
            </button>
            <p class="text-gray-600 md:mt-3">
              Generates random drone detections every 5 seconds
            </p>
          </div>
        </div>

        <!-- Manual Simulation Section -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            Manual Detection Simulation
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >MAC Address</label
              >
              <input
                type="text"
                [(ngModel)]="simulationData.mac"
                placeholder="60:60:1F:AA:BB:CC"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >RSSI (dBm)</label
              >
              <input
                type="number"
                [(ngModel)]="simulationData.rssi"
                placeholder="-50"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Location</label
              >
              <input
                type="text"
                [(ngModel)]="simulationData.sensor_location"
                placeholder="Building A - Floor 3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex items-end">
              <button
                (click)="simulateDetection()"
                [disabled]="isSimulating()"
                class="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isSimulating() ? 'Sending...' : 'Simulate' }}
              </button>
            </div>
          </div>
          <div *ngIf="simulationError()" class="mt-4 p-3 bg-red-100 text-red-700 rounded">
            {{ simulationError() }}
          </div>
        </div>

        <!-- Detections List -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Detections</h2>
            <div class="flex gap-2">
              <button
                (click)="loadDetections()"
                [disabled]="isLoading()"
                class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isLoading() ? 'Loading...' : 'Refresh' }}
              </button>
              <button
                (click)="clearDetections()"
                class="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading()" class="text-center py-8">
            <p class="text-gray-600">Loading detections...</p>
          </div>

          <!-- Error State -->
          <div
            *ngIf="error()"
            class="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4"
          >
            <p class="font-semibold">Error loading detections:</p>
            <p>{{ error() }}</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading() && detections().length === 0" class="text-center py-8">
            <p class="text-gray-600">
              No detections yet. Simulate or wait for real data.
            </p>
          </div>

          <!-- Detections Grid -->
          <div
            *ngIf="!isLoading() && detections().length > 0"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <app-drone-card
              *ngFor="let detection of detections()"
              [detection]="detection"
            ></app-drone-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class DroneDashboardComponent implements OnInit {
  detections = signal<Detection[]>([]);
  isLoading = signal(false);
  isSimulating = signal(false);
  error = signal<string | null>(null);
  simulationError = signal<string | null>(null);
  blockedAlert = signal<string | null>(null);

  totalDetections = signal(0);
  uniqueDrones = signal(0);
  blockedDrones = signal(0);

  simulationData = {
    mac: '60:60:1F:AA:BB:CC',
    rssi: -50,
    sensor_location: 'Building A - Floor 3',
  };

  constructor(
    private apiService: ApiService,
    private droneState: DroneStateService,
    public simulationService: SimulationService
  ) {
    // Subscribe to blocked alerts
    effect(() => {
      const alert = this.droneState.blockedAlert$();
      if (alert) {
        this.blockedAlert.set(alert);
      }
    });

    // Subscribe to simulated detections
    this.simulationService.detections$.subscribe((detection) => {
      const wasBlocked = this.droneState.addDetection(detection);
      this.detections.set([detection, ...this.detections()]);
      this.updateStats();

      // Log for debugging
      if (wasBlocked) {
        console.warn('Blocked drone detected:', detection.mac_address);
      }
    });
  }

  ngOnInit(): void {
    this.loadDetections();
  }

  loadDetections(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.apiService.getDetections(1, 20).subscribe({
      next: (response) => {
        this.detections.set(response.data);
        this.droneState.setDetections(response.data);
        this.updateStats();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load detections');
        this.isLoading.set(false);
      },
    });
  }

  simulateDetection(): void {
    // Validate MAC address format
    const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    if (!macRegex.test(this.simulationData.mac)) {
      this.simulationError.set(
        'Invalid MAC address format (XX:XX:XX:XX:XX:XX)'
      );
      return;
    }

    if (!this.simulationData.rssi || this.simulationData.rssi === 0) {
      this.simulationError.set('RSSI must be a valid number');
      return;
    }

    if (!this.simulationData.sensor_location.trim()) {
      this.simulationError.set('Location is required');
      return;
    }

    this.isSimulating.set(true);
    this.simulationError.set(null);

    const payload: CreateDetectionPayload = {
      mac: this.simulationData.mac,
      rssi: this.simulationData.rssi,
      sensor_location: this.simulationData.sensor_location,
      timestamp: new Date().toISOString(),
    };

    this.apiService.createDetection(payload).subscribe({
      next: (detection) => {
        const wasBlocked = this.droneState.addDetection(detection);
        this.detections.set([detection, ...this.detections()]);
        this.updateStats();
        this.isSimulating.set(false);
        this.resetSimulationForm();
      },
      error: (err) => {
        this.simulationError.set(err.message || 'Failed to simulate detection');
        this.isSimulating.set(false);
      },
    });
  }

  clearDetections(): void {
    this.detections.set([]);
    this.droneState.clearDetections();
    this.updateStats();
  }

  toggleSimulation(): void {
    if (this.simulationService.isSimulating()) {
      this.simulationService.stopSimulation();
    } else {
      this.simulationService.startSimulation();
    }
  }

  private resetSimulationForm(): void {
    this.simulationData = {
      mac: '60:60:1F:AA:BB:CC',
      rssi: -50,
      sensor_location: 'Building A - Floor 3',
    };
  }

  private updateStats(): void {
    const detections = this.detections();
    const uniqueMacs = new Set(detections.map((d) => d.mac_address));
    const blockedList = this.droneState.blockedList();

    this.totalDetections.set(detections.length);
    this.uniqueDrones.set(uniqueMacs.size);
    this.blockedDrones.set(blockedList.filter((d) => d.isBlocked).length);
  }
}
