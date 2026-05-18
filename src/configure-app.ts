import { INestApplication } from '@nestjs/common';
import { setupSwagger } from './shared/web/swagger/setup-swagger';

export function configureApp(app: INestApplication): void {
  setupSwagger(app);
}
