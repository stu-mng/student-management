import type { HttpMethod } from './types';

export function getPathParam(templatePath: string, actualPath: string, paramName: string): string | null {
  const templateParts = templatePath.split('/').filter(Boolean);
  const actualParts = actualPath.split('/').filter(Boolean);
  if (templateParts.length !== actualParts.length) return null;

  for (let i = 0; i < templateParts.length; i++) {
    const part = templateParts[i];
    const match = part.match(/^\[(.+)\]$/);
    if (match) {
      const name = match[1];
      if (name === paramName) {
        return actualParts[i] ?? null;
      }
    }
  }
  return null;
}

export function isMethod(method: string): method is HttpMethod {
  return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}


