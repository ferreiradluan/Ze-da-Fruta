// 🏗️ Módulo 5-admin - Arquitetura REST Modular
// Exports principais do módulo de administração

export { AdminModule } from './5-admin.module';
export { AdminService } from './admin.service';
export { AdminController } from './admin.controller';

// Entidades de domínio
export { AuditLog } from './domain/entities/audit-log.entity';
export { PlatformSetting } from './domain/entities/platform-setting.entity';

// Repositories
export { AuditLogRepository } from './infrastructure/repositories/audit-log.repository';
export { PlatformSettingRepository } from './infrastructure/repositories/platform-setting.repository';
