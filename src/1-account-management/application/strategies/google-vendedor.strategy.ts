import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Strategy, VerifyCallback, StrategyOptions } from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GoogleVendedorStrategy extends PassportStrategy(Strategy, 'google-vendedor') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    let clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    let clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    let callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');
    
    // Fallback para variáveis de ambiente diretas
    clientID = clientID || process.env.GOOGLE_CLIENT_ID;
    clientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    callbackURL = callbackURL || process.env.GOOGLE_CALLBACK_URL;
    
    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth credentials are not properly configured');
    }    const options: StrategyOptions = {
      clientID,
      clientSecret,
      callbackURL: callbackURL,
      scope: ['email', 'profile'],
      // Não usar state interno do Passport, gerenciamos manualmente no guard
    };
    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const user = await this.authService.autenticarComGoogle(profile, 'vendedor');
      done(null, user);
    } catch (err) {
      console.error('Erro na validação Google Vendedor:', err);
      done(err, false);
    }
  }
}
