import { Controller, Get, Put, Delete, Body, Req, UseGuards, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AccountProfileService } from './profile.service';

@Controller('account/profile')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AccountProfileController {
  constructor(private readonly accountProfileService: AccountProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  async getMe(@Req() req: any) {
    return this.accountProfileService.findById(req.user.userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
  async updateMe(@Req() req: any, @Body() updateUserDto: any) {
    return this.accountProfileService.update(req.user.userId, updateUserDto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Remover conta do usuário autenticado' })
  async removeMe(@Req() req: any) {
    return this.accountProfileService.remove(req.user.userId);
  }

  @Get('me/enderecos')
  @ApiOperation({ summary: 'Listar endereços do usuário autenticado' })
  async getMeEnderecos(@Req() req: any) {
    return this.accountProfileService.getEnderecos(req.user.userId);
  }

  @Post('me/enderecos')
  @ApiOperation({ summary: 'Adicionar endereço ao usuário autenticado' })
  async addEndereco(@Req() req: any, @Body() enderecoDto: any) {
    return this.accountProfileService.addEndereco(req.user.userId, enderecoDto);
  }
}
