import { Test, TestingModule } from '@nestjs/testing';
import { PedidosController } from './pedidos.controller';
import { SalesService } from '../../application/services/sales.service';

const mockSalesService = {
  criarPedido: jest.fn(),
  listarPedidos: jest.fn(),
  buscarPedidoPorId: jest.fn(),
  atualizarStatusPedido: jest.fn(),
  adicionarItemAoPedido: jest.fn(),
  removerItemDoPedido: jest.fn(),
  atualizarQuantidadeItem: jest.fn(),
  aplicarCupom: jest.fn(),
  removerCupom: jest.fn(),
  cancelarPedido: jest.fn(),
};

describe('PedidosController', () => {
  let controller: PedidosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PedidosController],
      providers: [
        {
          provide: SalesService,
          useValue: mockSalesService,
        },
      ],
    }).compile();

    controller = module.get<PedidosController>(PedidosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
