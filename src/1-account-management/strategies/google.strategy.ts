import * as dotenv from 'dotenv';
import { join } from 'path';

// Carrega o arquivo .env explicitamente
dotenv.config({ path: join(__dirname, '..', '.env') });

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    // Tenta obter valores do ConfigService
    let clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    let clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    let callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');
    
    // Tenta obter diretamente do process.env se não encontrado no ConfigService
    clientID = clientID || process.env.GOOGLE_CLIENT_ID;
    clientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    callbackURL = callbackURL || process.env.GOOGLE_CALLBACK_URL;
    
    // Fornece mensagens de erro detalhadas sobre qual variável está faltando
    if (!clientID) console.error('Erro: GOOGLE_CLIENT_ID não encontrado');
    if (!clientSecret) console.error('Erro: GOOGLE_CLIENT_SECRET não encontrado');
    if (!callbackURL) console.error('Erro: GOOGLE_CALLBACK_URL não encontrado');
    
    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth credentials are not properly configured');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: false,
    } as StrategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };

    done(null, user);
  }
}