import { INestApplication } from '@nestjs/common';
import { setupSwagger } from './api/swagger/setup-swagger';

export function configureApp(app: INestApplication): void {
  setupSwagger(app);
}
