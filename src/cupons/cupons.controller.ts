import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CuponsService } from './cupons.service';
import { Cupom } from '../common/entities/cupom.entity';

@Controller('cupons')
export class CuponsController {
  constructor(private readonly cuponsService: CuponsService) {}

  @Post()
  create(@Body() cupom: Cupom): Promise<Cupom> {
    return this.cuponsService.create(cupom);
  }

  @Get()
  findAll(): Promise<Cupom[]> {
    return this.cuponsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Cupom | null> {
    return this.cuponsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() cupom: Partial<Cupom>): Promise<Cupom | null> {
    return this.cuponsService.update(id, cupom);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<boolean> {
    return this.cuponsService.remove(id);
  }
}