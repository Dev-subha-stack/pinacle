/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface APKRelease {
  id: string;
  version: string;
  fileName: string;
  fileSize: number;
  changelog: string;
  uploadDate: string;
  downloadCount: number;
  isLatest: boolean;
  isVisible: boolean;
}

export interface AppStats {
  totalDownloads: number;
  totalReleases: number;
  latestVersion: string;
  lastUpdated: string;
}

export interface User {
  username: string;
  passwordHash: string;
  fullName?: string;
  createdAt: string;
}

export interface SessionInfo {
  username: string;
  role: "admin" | "user";
  fullName?: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  role?: "admin" | "user";
  username?: string;
  fullName?: string;
  message?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
