import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AccountEnderecosService } from './enderecos.service';

@Controller('account/profile/me/enderecos')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AccountEnderecosController {
  constructor(private readonly accountEnderecosService: AccountEnderecosService) {}

  @Post()
  create(@Req() req: any, @Body() endereco: any) {
    return this.accountEnderecosService.create({ ...endereco, user: { userId: req.user.userId } });
  }

  @Get()
  findAll(@Req() req: any) {
    return this.accountEnderecosService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: number) {
    return this.accountEnderecosService.findOneByUser(req.user.userId, id);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: number, @Body() endereco: any) {
    return this.accountEnderecosService.updateByUser(req.user.userId, id, endereco);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: number) {
    return this.accountEnderecosService.removeByUser(req.user.userId, id);
  }
}
