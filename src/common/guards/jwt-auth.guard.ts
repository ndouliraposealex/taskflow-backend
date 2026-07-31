import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Protege une route: exige un token JWT valide dans le header Authorization.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
