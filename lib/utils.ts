// Simple cn utility without external dependencies
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function calculateCompletionScore(
  total: number,
  complete: number,
  na: number
): number {
  if (total === 0) return 0;
  return Math.round(((complete + na) / total) * 100);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "yes":
      return "bg-green-100 text-green-800 border-green-300";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "not_applicable":
      return "bg-gray-100 text-gray-600 border-gray-300";
    default:
      return "bg-white text-gray-600 border-gray-200";
  }
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/plain",
];
