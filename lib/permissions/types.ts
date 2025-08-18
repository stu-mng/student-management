export type Permission = 'read' | 'write' | 'delete' | 'admin';

export type RoleName =
  | 'root'
  | 'admin'
  | 'manager'
  | 'class-teacher'
  | 'teacher'
  | 'candidate'
  | 'new-registrant';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Role {
  name: RoleName;
  order?: number;
}

export interface PermissionCheckArgs {
  userRole: Role | null;
  userId: string;
  method: HttpMethod;
  path: string;
}

export type PermissionCheckFunction = (
  args: PermissionCheckArgs
) => boolean | Promise<boolean>;

export interface ApiPermissionConfig {
  feature: string;
  description: string;
  method: HttpMethod;
  path: string;
  permissions: {
    roles?: RoleName[];
    customCheck?: PermissionCheckFunction;
  };
}

export type ApiPermissionsTree = Record<string, Record<string, ApiPermissionConfig>>;


