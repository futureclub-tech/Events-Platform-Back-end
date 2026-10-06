import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { HttpExceptionFilter } from "./shared/filters/http-exceptions.filter.js";
import { CustomValidationPipe } from "./shared/pipes/validation.pipe.js";
import { TransformInterceptor } from "./shared/interceptors/transform.interceptor.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
  app.useGlobalPipes(CustomValidationPipe);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
