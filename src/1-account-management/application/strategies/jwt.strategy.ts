import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../domain/entities/usuario.entity';
import { Admin } from '../../domain/entities/admin.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }  async validate(payload: any) {
    try {
      console.log('🔍 JWT Strategy - validate payload:', payload);
      const { sub, type, email, nome, roles } = payload;

      if (type === 'admin') {
        console.log('👨‍💼 Validando admin:', sub);
        const admin = await this.adminRepository.findOne({ where: { id: sub } });
        if (!admin) {
          console.log('❌ Admin não encontrado no banco:', sub);
          throw new UnauthorizedException('Admin não encontrado');
        }
        console.log('✅ Admin encontrado:', admin.email);
        return {
          id: admin.id,
          email: admin.email,
          nome: admin.nome,
          type: 'admin',
          roles: ['ADMIN'], // Usar uppercase para coincidir com ROLE.ADMIN
        };
      }

      if (type === 'usuario' || type === 'user' || type === 'vendedor' || type === 'entregador') {
        console.log('👤 Validando usuário:', sub);
        const usuario = await this.usuarioRepository.findOne({
          where: { id: sub },
          relations: ['roles'],
        });
        if (!usuario) {
          console.log('❌ Usuário não encontrado no banco:', sub);
          throw new UnauthorizedException('Usuário não encontrado');
        }
        
        console.log('✅ Usuário encontrado:', usuario.email, 'Status:', usuario.status);
        
        // ✅ PERMITIR USUÁRIOS PENDENTES ACESSAREM SEU PRÓPRIO PERFIL
        // Para outros endpoints, podem aplicar validações específicas
        if (!usuario.isAtivo()) {
          console.log('⚠️ Usuário não ativo, mas permitindo acesso:', usuario.status);
          // Usuários PENDENTES podem acessar apenas seu perfil para ver o status
          // Outros endpoints devem ter validações específicas se necessário
          return {
            id: usuario.id,
            email: usuario.email,
            nome: usuario.nome,
            type: type, // ✅ CORREÇÃO: Usar o tipo do token JWT
            status: usuario.status, // Incluir status para validações específicas
            roles: usuario.roles?.map((r) => r.nome) || [],
          };
        }
        
        console.log('✅ Usuário ativo, retornando dados completos');
        return {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          type: type, // ✅ CORREÇÃO: Usar o tipo do token JWT
          status: usuario.status,
          roles: usuario.roles?.map((r) => r.nome) || [],
        };
      }

      console.log('❌ Tipo de usuário inválido:', type);
      throw new UnauthorizedException('Tipo de usuário inválido');    } catch (error: any) {
      console.log('❌ ERRO no JWT Strategy validate:', error.message);
      console.log('   Stack:', error.stack);
      
      // Re-lançar a exceção original se for UnauthorizedException
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException(`Token JWT inválido: ${error.message}`);
    }
  }
}
