import { Controller, Get, Put, Req, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../application/strategies/guards/roles.guard';
import { Roles } from '../../application/strategies/guards/roles.decorator';
import { RoleType } from '../../domain/enums/role-type.enum';
import { AccountService } from '../../application/services/account.service';
import { UpdateUserDto } from '../dto/update-user.dto';

@ApiTags('👤 Cliente - Perfil')
@Controller('account')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile/me')
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.PARTNER, RoleType.DELIVERY)
  @ApiOperation({
    summary: 'Obter meu perfil',
    description: 'Retorna as informações do perfil do usuário autenticado'
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-do-usuario' },
        nome: { type: 'string', example: 'João Silva' },
        email: { type: 'string', example: 'joao.silva@gmail.com' },
        status: { type: 'string', example: 'ATIVO' },
        fotoPerfil: { type: 'string', example: '/uploads/profile/foto.png', nullable: true },
        roles: { 
          type: 'array', 
          items: { type: 'string' }, 
          example: ['USER'] 
        },
        perfis: { 
          type: 'array', 
          items: { type: 'string' }, 
          example: ['Cliente Premium'] 
        },
        enderecos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              rua: { type: 'string' },
              numero: { type: 'string' },
              bairro: { type: 'string' },
              cidade: { type: 'string' },
              cep: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async getMyProfile(@Req() req) {
    const userId = req.user.id;
    return this.accountService.getMyProfile(userId);
  }

  @Put('profile/me')
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.PARTNER, RoleType.DELIVERY)
  @ApiOperation({
    summary: 'Atualizar meu perfil',
    description: 'Atualiza as informações do perfil do usuário autenticado'
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-do-usuario' },
        nome: { type: 'string', example: 'João Silva Santos' },
        email: { type: 'string', example: 'joao.silva@email.com' },
        status: { type: 'string', example: 'ATIVO' },
        atualizadoEm: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou email já em uso'
  })
  async updateMyProfile(@Req() req, @Body() body: UpdateUserDto) {
    const userId = req.user.id;
    return this.accountService.updateMyProfile(userId, body);
  }
}
