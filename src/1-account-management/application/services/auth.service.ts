import { Injectable, UnauthorizedException, OnModuleInit, InternalServerErrorException, Logger } from '@nestjs/common';
import { AdminRepository } from '../../infrastructure/repositories/admin.repository';
import { UsuarioRepository } from '../../infrastructure/repositories/usuario.repository';
import { LoginAdminDto } from '../../api/dto/login-admin.dto';
import { Admin } from '../../domain/entities/admin.entity';
import { Usuario } from '../../domain/entities/usuario.entity';
import { Role } from '../../domain/entities/role.entity';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { BusinessRuleViolationException } from '../../../common/exceptions/business-rule-violation.exception';
import { STATUS_USUARIO, StatusUsuario } from '../../domain/types/status-usuario.types';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly usuarioRepository: UsuarioRepository,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
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
    }    const payload = { 
      sub: admin.id, 
      email: admin.email,
      type: 'admin',
      roles: ['ADMIN'] // Usar uppercase para coincidir com ROLE.ADMIN
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
        roles: ['admin'] // Usar lowercase para coincidir com ROLE.ADMIN
      }
    };
  }

  // Validação de usuário Google
  async validateGoogleUser(profile: any): Promise<Usuario> {
    try {
      const email = profile.emails[0].value;
      let usuario = await this.usuarioRepository.findOne({ where: { email } });
        if (!usuario) {
        usuario = this.usuarioRepository.create();        usuario.nome = profile.displayName;
        usuario.email = email;
        usuario.status = STATUS_USUARIO.ATIVO; // ✅ Usuários Google vêm ATIVO automaticamente
          try {
          await this.usuarioRepository.save(usuario);
        } catch (err: any) {
          this.logger.error('Erro ao salvar usuário Google', err);
          throw new InternalServerErrorException('Erro ao salvar usuário Google: ' + (err?.message || String(err)));
        }
      }
      
      return usuario;
    } catch (err: any) {
      this.logger.error('Erro na validação do usuário Google', err);
      throw new InternalServerErrorException('Erro na validação do usuário Google: ' + (err?.message || String(err)));
    }  }

  // Geração de JWT para usuário
  async generateJwtToken(usuario: Usuario, tipoUsuario: 'user' | 'vendedor' | 'entregador' = 'user'): Promise<{ access_token: string; user: any }> {
    if (!usuario || !usuario.id) {
      throw new InternalServerErrorException('Usuário inválido para geração de token');
    }

    // Recarregar usuário com roles para garantir que estão atualizadas
    const usuarioComRoles = await this.usuarioRepository.findOne({
      where: { id: usuario.id },
      relations: ['roles']
    });

    if (!usuarioComRoles) {
      throw new InternalServerErrorException('Usuário não encontrado para geração de token');
    }

    const payload = { 
      sub: usuarioComRoles.id, 
      email: usuarioComRoles.email,
      type: tipoUsuario,
      roles: usuarioComRoles.roles?.map(r => r.nome) || []
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET não configurado');
    }

    const access_token = jwt.sign(payload, secret, { expiresIn: '7d' });

    return {
      access_token,
      user: {
        id: usuarioComRoles.id,
        nome: usuarioComRoles.nome,
        email: usuarioComRoles.email,
        type: tipoUsuario,
        roles: usuarioComRoles.roles?.map(r => r.nome) || []
      }
    };
  }

  /**
   * ✅ Método para autenticação com Google com tipo diferenciado
   */
  async autenticarComGoogle(profile: any, tipoUsuario: 'user' | 'vendedor' | 'entregador' = 'user') {
    try {
      let usuario = await this.usuarioRepository.findOne({
        where: { googleId: profile.id },
        relations: ['roles']
      });

      if (!usuario) {
        usuario = await this.usuarioRepository.findOne({
          where: { email: profile.emails[0].value },
          relations: ['roles']
        });        if (!usuario) {            // ✅ Determinar status baseado no tipo de usuário
          let statusInicial: StatusUsuario = STATUS_USUARIO.ATIVO; // Default para usuários normais
          
          if (tipoUsuario === 'vendedor' || tipoUsuario === 'entregador') {
            statusInicial = STATUS_USUARIO.PENDENTE; // Vendedores e entregadores precisam de aprovação
            this.logger.log(`Criando ${tipoUsuario} com status PENDENTE para aprovação: ${profile.emails[0].value}`);
          } else {
            this.logger.log(`Criando usuário normal com status ATIVO: ${profile.emails[0].value}`);
          }

          // ✅ Criar novo usuário com status apropriado
          usuario = this.usuarioRepository.create({
            nome: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            status: statusInicial,
            roles: [] // Inicializar array vazio
          });

          // ✅ Salvar e atribuir role baseada no tipo
          await this.usuarioRepository.save(usuario);
          await this.ensureUserHasCorrectRole(usuario, tipoUsuario);        } else {
          usuario.googleId = profile.id;
          await this.usuarioRepository.save(usuario);
          // ✅ Garantir que usuário existente também tenha role correta
          await this.ensureUserHasCorrectRole(usuario, tipoUsuario);
        }
      } else {
        // ✅ Garantir que usuário existente também tenha role correta
        await this.ensureUserHasCorrectRole(usuario, tipoUsuario);
      }

      return usuario;
    } catch (err: any) {
      throw new InternalServerErrorException('Erro na autenticação Google: ' + (err?.message || String(err)));
    }
  }
  /**
   * ✅ Garante que o usuário tenha pelo menos a role USER
   */
  private async ensureUserHasDefaultRole(usuario: Usuario): Promise<void> {
    try {
      // Recarregar usuário com roles para ter dados atualizados
      const usuarioComRoles = await this.usuarioRepository.findOne({
        where: { id: usuario.id },
        relations: ['roles']
      });

      if (!usuarioComRoles) return;

      // Se não tem nenhuma role, inicializar com array vazio e deixar sem roles por enquanto
      if (!usuarioComRoles.roles || usuarioComRoles.roles.length === 0) {
        this.logger.log(`Usuário ${usuarioComRoles.email} sem roles - deixando sem roles por enquanto`);
        usuarioComRoles.roles = [];
        await this.usuarioRepository.save(usuarioComRoles);
      }
    } catch (error) {
      this.logger.error(`Erro ao verificar role padrão para usuário ${usuario.email}:`, error);
      // Não lançar erro para não quebrar o fluxo de autenticação
    }
  }  /**
   * ✅ Garante que o usuário tenha a role correta baseada no tipo
   */
  private async ensureUserHasCorrectRole(usuario: Usuario, tipoUsuario: 'user' | 'vendedor' | 'entregador'): Promise<void> {
    try {
      // Recarregar usuário com roles para ter dados atualizados
      const usuarioComRoles = await this.usuarioRepository.findOne({
        where: { id: usuario.id },
        relations: ['roles']
      });

      if (!usuarioComRoles) return;

      // Determinar role baseada no tipo
      let roleNome = 'USER';
      
      switch (tipoUsuario) {
        case 'vendedor':
          roleNome = 'SELLER';
          break;
        case 'entregador':
          roleNome = 'DELIVERY_PERSON';
          break;
        default:
          roleNome = 'USER';
      }

      // Inicializar roles se não existir
      if (!usuarioComRoles.roles) {
        usuarioComRoles.roles = [];
      }

      // Verificar se já possui a role correta
      const jaTemRole = usuarioComRoles.roles.some(role => role.nome === roleNome);

      if (!jaTemRole) {
        // Buscar ou criar a role
        let role = await this.roleRepository.findOne({ where: { nome: roleNome } });
        
        if (!role) {
          // Criar a role se não existir
          role = this.roleRepository.create({ nome: roleNome });
          await this.roleRepository.save(role);
          this.logger.log(`Role ${roleNome} criada no banco`);
        }

        // Adicionar a role ao usuário
        usuarioComRoles.roles.push(role);
        await this.usuarioRepository.save(usuarioComRoles);
        this.logger.log(`Role ${roleNome} atribuída para ${usuarioComRoles.email}`);
      } else {
        this.logger.log(`Usuário ${usuarioComRoles.email} já possui role ${roleNome}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao verificar role para usuário ${usuario.email}:`, error);
      // Não lançar erro para não quebrar o fluxo de autenticação
    }
  }

  /**
   * ✅ Obter usuário por email (para testes)
   */
  async obterUsuarioPorEmail(email: string): Promise<Usuario | null> {
    try {
      return await this.usuarioRepository.findOne({
        where: { email },
        relations: ['roles']
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar usuário por email ${email}:`, error);
      return null;
    }
  }
  /**
   * ✅ Gerar JWT token (método público)
   */
  generateJWT(usuario: Usuario, tipoUsuario: 'user' | 'vendedor' | 'entregador' = 'user'): string {
    const payload = { 
      sub: usuario.id, 
      email: usuario.email,
      type: tipoUsuario,
      roles: usuario.roles?.map(r => r.nome) || []
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET não configurado');
    }

    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }
}
