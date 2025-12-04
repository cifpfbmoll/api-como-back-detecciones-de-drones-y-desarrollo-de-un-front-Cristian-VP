import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detection } from '../models/drone.model';
import { DroneStateService } from '../services/drone-state.service';

@Component({
  selector: 'app-drone-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="p-4 border rounded-lg shadow-md transition-all"
      [ngClass]="{
        'bg-red-50 border-red-300': isBlocked,
        'bg-white border-gray-200': !isBlocked
      }"
    >
      <!-- Blocked Badge -->
      <div class="flex items-start justify-between mb-3">
        <h3 class="font-mono text-sm font-semibold text-gray-800">
          {{ detection.mac_address }}
        </h3>
        <span
          *ngIf="isBlocked"
          class="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-full"
        >
          BLOCKED
        </span>
      </div>

      <!-- Detection Info -->
      <div class="grid grid-cols-2 gap-3 text-xs text-gray-600">
        <div>
          <p class="font-semibold text-gray-700">Detections</p>
          <p class="text-gray-800 font-bold">{{ detectionCount }}</p>
        </div>
        <div>
          <p class="font-semibold text-gray-700">RSSI</p>
          <p class="text-gray-800">{{ detection.rssi }} dBm</p>
        </div>
        <div class="col-span-2">
          <p class="font-semibold text-gray-700">Location</p>
          <p class="text-gray-800">{{ detection.sensor_location }}</p>
        </div>
        <div class="col-span-2">
          <p class="font-semibold text-gray-700">Manufacturer</p>
          <p class="text-gray-800">
            {{ detection.manufacturer_name || 'Unknown' }}
          </p>
        </div>
        <div class="col-span-2">
          <p class="font-semibold text-gray-700">Last Detected</p>
          <p class="text-gray-800">{{ formatDate(detection.detected_at) }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class DroneCardComponent implements OnInit {
  @Input() detection!: Detection;

  isBlocked: boolean = false;
  detectionCount: number = 0;

  constructor(private droneState: DroneStateService) {}

  ngOnInit(): void {
    const mac = this.detection.mac_address;
    this.isBlocked = this.droneState.isBlocked(mac);
    this.detectionCount = this.droneState.getDetectionCount(mac);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
