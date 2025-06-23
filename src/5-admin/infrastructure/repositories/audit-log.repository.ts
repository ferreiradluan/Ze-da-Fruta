import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>
  ) {}

  async salvar(auditLog: AuditLog): Promise<AuditLog> {
    return await this.repository.save(auditLog);
  }

  async buscarPorAdmin(adminId: string): Promise<AuditLog[]> {
    return await this.repository.find({
      where: { adminId },
      order: { timestamp: 'DESC' }
    });
  }
}
