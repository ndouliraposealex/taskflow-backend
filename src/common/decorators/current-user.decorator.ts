import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Extrait l'utilisateur authentifie (injecte par JwtStrategy) depuis la requete.
 * Usage: findAll(@CurrentUser() user: JwtPayload)
 */
export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  const user = request.user
  return data ? user?.[data] : user
})
