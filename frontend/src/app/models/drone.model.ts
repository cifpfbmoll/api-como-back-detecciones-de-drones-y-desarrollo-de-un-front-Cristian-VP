/**
 * Drone Detection Model
 * Represents the data structure for drone detections from the API
 */

export interface Detection {
  id: number;
  mac_address: string;
  manufacturer_id: number | null;
  rssi: number;
  sensor_location: string;
  detected_at: string; // ISO 8601 timestamp
  created_at: string;
  manufacturer_name?: string;
}

export interface Manufacturer {
  id: number;
  oui: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDetectionPayload {
  mac: string;
  rssi: number;
  sensor_location: string;
  timestamp: string; // ISO 8601 timestamp
}

export interface PaginatedResponse<T> {
  data: T[];
  pager: {
    currentPage: number;
    count: number;
    perPage: number;
    total: number;
  };
}

export interface StatsResponse {
  total_detections: number;
  unique_drones: number;
  active_locations: number;
  top_manufacturers: Array<{
    manufacturer_name: string;
    count: number;
  }>;
}

export interface DroneBlockStatus {
  macAddress: string;
  detectionCount: number;
  isBlocked: boolean;
  lastDetected: string;
  manufacturer?: string;
}
