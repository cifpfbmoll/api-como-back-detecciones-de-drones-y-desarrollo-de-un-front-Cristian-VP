import { Injectable, signal, computed } from '@angular/core';
import { Detection, DroneBlockStatus } from '../models/drone.model';

@Injectable({
  providedIn: 'root',
})
export class DroneStateService {
  // Signals for state management
  private detections = signal<Detection[]>([]);
  private blockedMacs = signal<Set<string>>(new Set());
  private blockedAlert = signal<string | null>(null);

  // Computed signals
  readonly detectionList = this.detections.asReadonly();
  readonly blockedList = computed(() => this.buildBlockedStatus());
  readonly blockedAlert$ = this.blockedAlert.asReadonly();

  constructor() {}

  /**
   * Add a detection to the state
   */
  addDetection(detection: Detection): boolean {
    const current = this.detections();
    const macAddress = detection.mac_address;

    // Check if MAC is duplicated (returning drone)
    const isDuplicate = current.some((d) => d.mac_address === macAddress);

    // Update detections list
    this.detections.set([detection, ...current]);

    // If duplicate, mark as blocked and trigger alert
    if (isDuplicate) {
      const blocked = this.blockedMacs();
      blocked.add(macAddress);
      this.blockedMacs.set(blocked);

      // Trigger alert
      this.triggerBlockedAlert(macAddress, detection.manufacturer_name);
      return true; // Was blocked
    }

    return false; // New drone
  }

  /**
   * Add multiple detections
   */
  addDetections(detections: Detection[]): void {
    const current = this.detections();
    const allDetections = [...detections, ...current];
    this.detections.set(allDetections);
    this.updateBlockedStatus();
  }

  /**
   * Clear all detections
   */
  clearDetections(): void {
    this.detections.set([]);
    this.blockedMacs.set(new Set());
  }

  /**
   * Replace all detections (for pagination)
   */
  setDetections(detections: Detection[]): void {
    this.detections.set(detections);
    this.updateBlockedStatus();
  }

  /**
   * Check if a MAC address is blocked
   */
  isBlocked(macAddress: string): boolean {
    return this.blockedMacs().has(macAddress);
  }

  /**
   * Get detection count for a specific MAC address
   */
  getDetectionCount(macAddress: string): number {
    return this.detections().filter(
      (d) => d.mac_address === macAddress
    ).length;
  }

  /**
   * Trigger blocked drone alert
   */
  triggerBlockedAlert(macAddress: string, manufacturer?: string): void {
    const alertMessage = `⚠️ BLOCKED DRONE DETECTED! MAC: ${macAddress}${
      manufacturer ? ` (${manufacturer})` : ''
    }`;
    this.blockedAlert.set(alertMessage);

    // Auto-clear alert after 5 seconds
    setTimeout(() => {
      this.blockedAlert.set(null);
    }, 5000);
  }

  /**
   * Private: Update blocked status based on current detections
   */
  private updateBlockedStatus(): void {
    const detections = this.detections();
    const macCounts = new Map<string, number>();

    // Count occurrences
    detections.forEach((detection) => {
      const count = macCounts.get(detection.mac_address) || 0;
      macCounts.set(detection.mac_address, count + 1);
    });

    // Mark as blocked if count > 1
    const blocked = new Set<string>();
    macCounts.forEach((count, mac) => {
      if (count > 1) {
        blocked.add(mac);
      }
    });

    this.blockedMacs.set(blocked);
  }

  /**
   * Build blocked drone status information
   */
  private buildBlockedStatus(): DroneBlockStatus[] {
    const detections = this.detections();
    const statusMap = new Map<string, DroneBlockStatus>();

    detections.forEach((detection) => {
      const mac = detection.mac_address;
      if (!statusMap.has(mac)) {
        statusMap.set(mac, {
          macAddress: mac,
          detectionCount: 0,
          isBlocked: false,
          lastDetected: detection.detected_at,
          manufacturer: detection.manufacturer_name,
        });
      }

      const status = statusMap.get(mac)!;
      status.detectionCount++;
      status.isBlocked = this.blockedMacs().has(mac);
      // Update to most recent detection
      if (new Date(detection.detected_at) > new Date(status.lastDetected)) {
        status.lastDetected = detection.detected_at;
      }
    });

    return Array.from(statusMap.values()).sort(
      (a, b) =>
        new Date(b.lastDetected).getTime() -
        new Date(a.lastDetected).getTime()
    );
  }
}
