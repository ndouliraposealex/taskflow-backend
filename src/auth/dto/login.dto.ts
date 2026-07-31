import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'ibrahima@taskflow.sn' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string

  @ApiProperty({ example: 'MotDePasse123!' })
  @IsString()
  @MinLength(6)
  password: string
}
