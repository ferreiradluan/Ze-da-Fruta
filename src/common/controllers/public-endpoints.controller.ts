import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('🌍 Endpoints Públicos Globais')
@Controller()
export class PublicEndpointsController {
  // Controllers removidos para evitar conflito com controllers especializados
  // Os endpoints /products e /categorias agora são servidos pelos controllers:
  // - ProductsPublicController (/products)  
  // - CategoriasPublicController (/categorias)
  // - SalesPublicController (/sales/public/*)
}
