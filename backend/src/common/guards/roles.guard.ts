import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const wsId = request.params.wsId;
    const chId = request.params.chId;

    if (wsId) {
      const roleInWS = user.rolesByWorkspace?.find(
        (r) => r.wsId === wsId,
      )?.role;
      if (requiredRoles.includes(roleInWS)) return true;
    }

    if (chId) {
      const roleInChannel = user.rolesByChannel?.find(
        (r) => r.chId === chId,
      )?.role;
      if (requiredRoles.includes(roleInChannel)) return true;
    }

    return false;
  }
}
