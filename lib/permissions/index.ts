// Shared permission types and helpers
import { API_PERMISSIONS } from './configs';
import type {
  ApiPermissionConfig,
  ApiPermissionsTree,
  HttpMethod,
  PermissionCheckArgs,
  Role,
} from './types';
export { API_PERMISSIONS };

export function checkApiPermission(
  method: HttpMethod,
  path: string,
  userRole: Role | null,
  userId: string
): boolean | Promise<boolean> {
  const config = findApiConfig(method, path);
  if (!config) return false;
  return checkPermission(config, { userRole, userId, method, path });
}

export function checkPermission(
  config: ApiPermissionConfig,
  args: PermissionCheckArgs
): boolean | Promise<boolean> {
  const { permissions } = config;

  if (args.userRole && permissions.roles?.includes(args.userRole.name)) {
    console.log('✅ Role-based permission granted');
    return true;
  }

  if (permissions.customCheck) {
    return permissions.customCheck(args);
  }

  console.log('❌ No permission granted');
  return false;
}

function findApiConfig(method: HttpMethod, path: string): ApiPermissionConfig | null {
  const groups: ApiPermissionsTree = API_PERMISSIONS as unknown as ApiPermissionsTree;
  let bestMatch: ApiPermissionConfig | null = null;
  let bestScore = -1;

  // Use scoring-based matching for better route priority
  for (const groupKey in groups) {
    const group = groups[groupKey];
    for (const key in group) {
      const item = group[key];
      if (item.method === method) {
        const score = calculateMatchScore(item.path, path);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = item;
        }
      }
    }
  }

  // Fallback 1: method-agnostic best match if nothing found for the method
  if (!bestMatch) {
    for (const groupKey in groups) {
      const group = groups[groupKey];
      for (const key in group) {
        const item = group[key];
        const score = calculateMatchScore(item.path, path);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = item;
        }
      }
    }
  }

  return bestMatch;
}

function calculateMatchScore(configPath: string, actualPath: string): number {
  // Exact match gets highest score
  if (configPath === actualPath) {
    return 1000;
  }

  // Convert Next.js dynamic route syntax to regex
  const regexPath = configPath
    .replace(/\[([^\]]+)\]/g, '([^/]+)') // [id] -> ([^/]+)
    .replace(/\//g, '\\/'); // escape forward slashes
  
  const regex = new RegExp(`^${regexPath}$`);
  
  if (regex.test(actualPath)) {
    // Dynamic route match - score based on number of parameters
    const paramCount = (configPath.match(/\[([^\]]+)\]/g) || []).length;
    return 100 - paramCount; // Fewer parameters = higher score
  }

  // Fallback 2: Parent-path prefix match (e.g., '/api/drive' should match '/api/drive/folders')
  const normalizedConfig = configPath.endsWith('/') ? configPath.slice(0, -1) : configPath;
  if (actualPath.startsWith(`${normalizedConfig}/`)) {
    return 10; // Low score to prefer exact/dynamic matches when present
  }

  return 0; // No match
}

export function getAllApiPermissions(): ApiPermissionsTree {
  return API_PERMISSIONS as unknown as ApiPermissionsTree;
}

export function getPermissionsByFeature(): Record<string, ApiPermissionConfig[]> {
  const grouped: Record<string, ApiPermissionConfig[]> = {};
  const groups: ApiPermissionsTree = API_PERMISSIONS as unknown as ApiPermissionsTree;
  Object.values(groups).forEach(group => {
    Object.values(group).forEach((config) => {
      const featureGroup = config.feature.split('管理')[0] + '管理';
      if (!grouped[featureGroup]) grouped[featureGroup] = [];
      grouped[featureGroup].push(config);
    });
  });
  return grouped;
}


