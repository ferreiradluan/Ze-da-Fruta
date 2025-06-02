import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ItensPedidoService } from './itens-pedido.service';
import { ItemPedido } from '../common/entities/item-pedido.entity';

@Controller('itens-pedido')
export class ItensPedidoController {
  constructor(private readonly itensPedidoService: ItensPedidoService) {}

  @Post()
  create(@Body() itemPedido: ItemPedido): Promise<ItemPedido> {
    return this.itensPedidoService.create(itemPedido);
  }

  @Get()
  findAll(): Promise<ItemPedido[]> {
    return this.itensPedidoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ItemPedido | null> {
    return this.itensPedidoService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() itemPedido: Partial<ItemPedido>): Promise<ItemPedido | null> {
    return this.itensPedidoService.update(id, itemPedido);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return this.itensPedidoService.remove(id);
  }
}