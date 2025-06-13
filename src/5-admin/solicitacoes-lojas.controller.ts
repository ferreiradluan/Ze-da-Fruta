import { Controller, Get, Post, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin/solicitacoes/lojas')
export class AdminSolicitacoesLojasController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getSolicitacoes() {
    return this.adminService.getSolicitacoesLojas();
  }

  @Post(':id/aprovar')
  aprovarSolicitacao(@Param('id') id: number) {
    return this.adminService.aprovarSolicitacaoLoja(id);
  }
}
