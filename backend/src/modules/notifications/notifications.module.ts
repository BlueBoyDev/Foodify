// RUTA: src/modules/notifications/notifications.module.ts
import { Module }                from '@nestjs/common';
import { NotificationsService }  from './notifications.service';

import { TypeOrmModule }            from '@nestjs/typeorm';
import { User }                   from '../users/entities/user.entity';

@Module({
  imports:   [TypeOrmModule.forFeature([User])],
  providers: [NotificationsService],
  exports:   [NotificationsService],
})
export class NotificationsModule {}
