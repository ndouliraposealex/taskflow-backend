import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'Ibrahima Diallo' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string

  @ApiProperty({ example: 'ibrahima@taskflow.sn' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string

  @ApiProperty({ example: 'MotDePasse123!' })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caracteres' })
  @MaxLength(72)
  password: string
}
