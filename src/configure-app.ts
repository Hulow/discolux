import { INestApplication, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './shared/web/swagger/setup-swagger';

export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  setupSwagger(app);
}
