import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo produto' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Produto já existe' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar todos os produtos' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de produtos retornada com sucesso' })
  async getAllProducts(
    @Query('categoryId') categoryId?: number,
    @Query('isActive') isActive?: boolean,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll({
      categoryId: categoryId ? Number(categoryId) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search,
    });
  }

  @Get(':name')
  @ApiOperation({ summary: 'Buscar produto por nome' })
  @ApiResponse({ status: 200, description: 'Produto encontrado' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async getProductByName(@Param('name') name: string) {
    return this.productsService.findOneByName(name);
  }

  @Put(':name')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async updateProduct(
    @Param('name') name: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productsService.updateByName(name, updateProductDto);
  }

  @Delete(':name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover produto' })
  @ApiResponse({ status: 204, description: 'Produto removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async deleteProduct(@Param('name') name: string) {
    await this.productsService.removeByName(name);
  }

  @Put(':name/stock')
  @ApiOperation({ summary: 'Atualizar estoque do produto' })
  @ApiResponse({ status: 200, description: 'Estoque atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 400, description: 'Quantidade inválida' })
  async updateStock(
    @Param('name') name: string,
    @Body('quantity') quantity: number
  ) {
    return this.productsService.updateStock(name, quantity);
  }

  @Put(':name/rating')
  @ApiOperation({ summary: 'Atualizar avaliação do produto' })
  @ApiResponse({ status: 200, description: 'Avaliação atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 400, description: 'Avaliação inválida' })
  async updateRating(
    @Param('name') name: string,
    @Body('rating') rating: number
  ) {
    return this.productsService.updateRating(name, rating);
  }
}