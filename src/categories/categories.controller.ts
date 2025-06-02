import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.categoriesService.findOneByName(name);
  }

  @Put(':name')
  update(@Param('name') name: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.updateByName(name, updateCategoryDto);
  }

  @Delete(':name')
  remove(@Param('name') name: string) {
    return this.categoriesService.removeByName(name);
  }
}