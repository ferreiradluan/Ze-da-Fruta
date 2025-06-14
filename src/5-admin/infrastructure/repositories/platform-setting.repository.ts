import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting } from '../../domain/entities/platform-setting.entity';

@Injectable()
export class PlatformSettingRepository {
  constructor(
    @InjectRepository(PlatformSetting)
    private readonly repository: Repository<PlatformSetting>
  ) {}

  async buscarPorChave(key: string): Promise<PlatformSetting | null> {
    return await this.repository.findOne({ where: { key } });
  }

  async salvar(setting: PlatformSetting): Promise<PlatformSetting> {
    return await this.repository.save(setting);
  }
}
