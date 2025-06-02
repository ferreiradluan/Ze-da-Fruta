import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole, UserProfileType } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, senha: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Só permite login local para admin
    if (user.role === 'admin' && user.provider !== 'local') {
      throw new UnauthorizedException('Admin só pode logar via autenticação local');
    }

    // Verifica hash para admin/local
    if (user.provider === 'local') {
      const senhaValida = await bcrypt.compare(senha, user.senha || '');
      if (!senhaValida) {
        throw new UnauthorizedException('Credenciais inválidas');
      }
    } else {
      // Google: só permite se não for admin
      if (user.role === 'admin') {
        throw new UnauthorizedException('Admin só pode logar via autenticação local');
      }
      if (user.senha !== senha) {
        throw new UnauthorizedException('Credenciais inválidas');
      }
    }

    await this.handleSuccessfulLogin(user);
    return user;
  }

  private async handleSuccessfulLogin(user: User) {
    // Reset login attempts on successful login
    await this.usersService.update(user.userId, {
      loginAttempts: 0,
      lastLoginAt: new Date(),
      lockedUntil: undefined,
    });
  }

  private async checkAccountLock(user: User) {
    if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new UnauthorizedException('Conta bloqueada temporariamente. Tente novamente em 15 minutos.');
      }
      // Reset attempts if lock time has passed
      await this.usersService.update(user.userId, {
        loginAttempts: 0,
        lockedUntil: undefined,
        lastLoginAt: new Date(),
      });
    }
  }

  async validateGoogleUser(profile: any) {
    const { email, firstName, lastName, picture } = profile;
    
    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      user = await this.usersService.create({
        email,
        firstName,
        lastName,
        picture,
        provider: 'google',
        isEmailVerified: true, // Google emails are verified
        role: UserRole.USER,
        profileType: UserProfileType.CUSTOMER,
      });
    }

    await this.handleSuccessfulLogin(user);
    return user;
  }

  async login(user: User) {
    await this.checkAccountLock(user);

    const payload = { 
      sub: user.userId, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileType: user.profileType,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        role: user.role,
        profileType: user.profileType,
      },
    };
  }

  async getUserProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Remove sensitive information
    const { senha, loginAttempts, lockedUntil, ...userProfile } = user;
    return userProfile;
  }

  async updateUserProfile(userId: number, profileType: UserProfileType): Promise<User> {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.usersService.update(userId, { profileType });
  }

  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Only admins can change roles
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can change user roles');
    }

    return this.usersService.update(userId, { role });
  }
}