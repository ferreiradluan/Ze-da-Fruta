import { Injectable, UnauthorizedException, OnModuleInit, InternalServerErrorException, Logger } from '@nestjs/common';
import { AdminRepository } from '../../infrastructure/repositories/admin.repository';
import { UsuarioRepository } from '../../infrastructure/repositories/usuario.repository';
import { LoginAdminDto } from '../../api/dto/login-admin.dto';
import { Admin } from '../../domain/entities/admin.entity';
import { Usuario } from '../../domain/entities/usuario.entity';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { BusinessRuleViolationException } from '../../../common/exceptions/business-rule-violation.exception';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Garante admin padrão no banco
    if (this.adminRepository.ensureDefaultAdmin) {
      await this.adminRepository.ensureDefaultAdmin();
    }
  }

  // Autenticação de admin local
  async loginAdmin(loginDto: LoginAdminDto): Promise<{ access_token: string; user: any }> {
    const { email, senha } = loginDto;
    
    const admin = await this.adminRepository.findOne({ where: { email } });
    
    if (!admin || !admin.verificarSenha(senha)) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { 
      sub: admin.id, 
      email: admin.email,
      type: 'admin',
      roles: ['ADMIN']
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET não configurado');
    }

    const access_token = jwt.sign(payload, secret, { expiresIn: '7d' });

    return {
      access_token,
      user: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        type: 'admin',
        roles: ['ADMIN']
      }
    };
  }

  // Validação de usuário Google
  async validateGoogleUser(profile: any): Promise<Usuario> {
    try {
      const email = profile.emails[0].value;
      let usuario = await this.usuarioRepository.findOne({ where: { email } });
      
      if (!usuario) {
        usuario = this.usuarioRepository.create();
        usuario.nome = profile.displayName;
        usuario.email = email;
        usuario.status = 'ATIVO';
        
        try {
          await this.usuarioRepository.save(usuario);
        } catch (err) {
          this.logger.error('Erro ao salvar usuário Google', err);
          throw new InternalServerErrorException('Erro ao salvar usuário Google: ' + err.message);
        }
      }
      
      return usuario;
    } catch (err) {
      this.logger.error('Erro na validação do usuário Google', err);
      throw new InternalServerErrorException('Erro na validação do usuário Google: ' + err.message);
    }
  }

  // Geração de JWT para usuário
  async generateJwtToken(usuario: Usuario): Promise<{ access_token: string; user: any }> {
    const payload = { 
      sub: usuario.id, 
      email: usuario.email,
      type: 'user',
      roles: usuario.roles?.map(r => r.nome) || []
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET não configurado');
    }

    const access_token = jwt.sign(payload, secret, { expiresIn: '7d' });

    return {
      access_token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        type: 'user',
        roles: usuario.roles?.map(r => r.nome) || []
      }
    };
  }
}
