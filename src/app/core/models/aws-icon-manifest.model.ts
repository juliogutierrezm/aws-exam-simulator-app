// src/app/core/models/aws-icon-manifest.model.ts

export interface AwsIconEntry {
  /** Relative path within public/aws-icons/, e.g. "Storage/Amazon-Simple-Storage-Service.svg" */
  file: string;
  /** Human-readable service name */
  name: string;
}

/**
 * Runtime icon manifest: icon_key → { file, name }
 * Loaded from /data/aws-icon-manifest.json
 */
export type AwsIconManifest = Record<string, AwsIconEntry>;
