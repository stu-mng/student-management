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
    return true;
  }

  if (permissions.customCheck) {
    return permissions.customCheck(args);
  }

  return false;
}

function findApiConfig(method: HttpMethod, path: string): ApiPermissionConfig | null {
  const groups: ApiPermissionsTree = API_PERMISSIONS as unknown as ApiPermissionsTree;
  for (const groupKey in groups) {
    const group = groups[groupKey];
    for (const key in group) {
      const item = group[key];
      if (item.method === method && pathMatches(item.path, path)) {
        return item;
      }
    }
  }
  return null;
}

function pathMatches(configPath: string, actualPath: string): boolean {
  const regexPath = configPath
    .replace(/\[([^\]]+)\]/g, '([^/]+)')
    .replace(/\//g, '\\/');
  const regex = new RegExp(`^${regexPath}$`);
  return regex.test(actualPath);
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


