import { Module, Provider } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheInterceptor, CacheModule } from "@nestjs/cache-manager";
import { createKeyv } from "@keyv/redis";
import { APP_INTERCEPTOR } from "@nestjs/core";

// USE THIS IN PROVIDERS IF WANNA CACHE GET REQUEST
const CacheInterceptorProviderConfig: Provider = {
  provide: APP_INTERCEPTOR,
  useClass: CacheInterceptor,
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get("MONGODB_URI"),
        onConnectionCreate: connection => {
          console.log("CONNECTING");
          connection.on("connected", () => console.log("DB Connected"));
          connection.on("error", error => console.log("DB error", error));
          connection.on("disconnected", () => console.log("DB Disconnected"));

          return connection;
        },
      }),
    }),
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        stores: [createKeyv(configService.getOrThrow<string>("REDIS_URL"))],
        ttl: 60 * 1000,
      }),
      isGlobal: true,
    }),

    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
