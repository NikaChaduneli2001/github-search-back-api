import {
  DocumentBuilder,
  SwaggerModule,
} from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";
import { apiReference } from "@scalar/nestjs-api-reference";

export interface SwaggerConfig {
  path: string;
  title: string;
  version: string;
  contact?: {
    name: string;
    email: string;
    url: string;
  };
  description: string;
  ignoreGlobalPrefix?: boolean;
  cookieAuth?: string;
}

export function setupSwagger(app: INestApplication, config: SwaggerConfig) {
  const swaggerDoc = new DocumentBuilder()
    .setTitle(config.title)
    .setVersion(config.version)
    .setContact(
      config?.contact?.name,
      config?.contact?.url,
      config?.contact?.email
    )
    .setDescription(config.description)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDoc, {
    ignoreGlobalPrefix: config.ignoreGlobalPrefix,
  });

    // Use Scalar API Reference for better performance and visualization
    app.use(
      config.path,
      apiReference({
        spec: {
          content: document,
        },
        theme: 'purple',
        layout: 'modern',
        showSidebar: true,
        searchHotKey: 'k',
      }),
    );
}
