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
      await this.adminRepository.ensureDefaultAdmin(this.adminRepository);
    }
  }

  async loginAdmin(dto: LoginAdminDto): Promise<{ token: string }> {
    try {
      const admin = await this.adminRepository.findByEmail(dto.email);
      if (!admin) {
        throw new UnauthorizedException('Admin não encontrado');
      }
      const senhaValida = await admin.verificarSenha(dto.senha);
      if (!senhaValida) {
        throw new UnauthorizedException('Senha inválida');
      }
      const token = this.generateJwt(admin);
      return { token };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BusinessRuleViolationException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao autenticar admin.');
    }
  }  generateJwt(admin: Admin): string {
    const payload = {
      sub: admin.id,
      email: admin.email,
      nome: admin.nome,
      type: 'admin',
    };
    
    const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
    const expiresIn = this.configService.get<string>('JWT_EXPIRATION') || '1d';
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  async autenticarComGoogle(profile: any): Promise<{ token: string }> {
    try {
      const email = profile.emails[0].value;
      let usuario = await this.usuarioRepository.findOne({ where: { email } });
      if (!usuario) {
        usuario = this.usuarioRepository.create();
        usuario.nome = profile.displayName;
        usuario.email = email;
        usuario.status = StatusUsuario.ATIVO;
        // Busca role USER real do banco
        let role = await this.roleRepository.findOne({ where: { nome: RoleType.USER } });
        if (!role) {
          role = this.roleRepository.create({ nome: RoleType.USER });
          await this.roleRepository.save(role);
        }
        usuario.roles = [role];
        try {
          await this.usuarioRepository.save(usuario);
        } catch (err) {
          this.logger.error('Erro ao salvar usuário Google', err);
          throw new InternalServerErrorException('Erro ao salvar usuário Google: ' + err.message);
        }
      }
      return { token: this.generateJwtUsuario(usuario) };
    } catch (error) {
      this.logger.error('Erro ao autenticar com Google', error);
      if (error instanceof UnauthorizedException || error instanceof BusinessRuleViolationException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao autenticar com Google: ' + error.message);
    }
  }
  generateJwtUsuario(usuario: Usuario): string {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      type: 'usuario',
      roles: usuario.roles?.map((r) => r.nome),
    };
    const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
    const expiresIn = this.configService.get<string>('JWT_EXPIRATION') || '1d';
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }
}
