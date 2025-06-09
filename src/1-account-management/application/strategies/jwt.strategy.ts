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
  }

  async validate(payload: any) {
    try {
      const { sub, type, email, nome, roles } = payload;

      if (type === 'admin') {
        const admin = await this.adminRepository.findOne({ where: { id: sub } });
        if (!admin) {
          throw new UnauthorizedException('Admin não encontrado');
        }
        return {
          id: admin.id,
          email: admin.email,
          nome: admin.nome,
          type: 'admin',
          roles: ['ADMIN'],
        };
      }

      if (type === 'usuario') {
        const usuario = await this.usuarioRepository.findOne({
          where: { id: sub },
          relations: ['roles'],
        });
        if (!usuario) {
          throw new UnauthorizedException('Usuário não encontrado');
        }
        return {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          type: 'usuario',
          roles: usuario.roles?.map((r) => r.nome) || [],
        };
      }

      throw new UnauthorizedException('Tipo de usuário inválido');
    } catch (error) {
      throw new UnauthorizedException('Token JWT inválido');
    }
  }
}
