import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from './pipes/validation.pipe';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // parsing cookies from request.headers.cookie
    // transforming it from string to Js object and exposing in request.cookies
    // or request.signedCookies when secret is provided
    app.use(cookieParser(process.env.COOKIES_SECRET));
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Calendar app API')
        .setDescription('Simple calendar API on nestJs with express')
        .setVersion('1.0.1')
        .addTag('APP')
        .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);

    const PORT = process.env.PORT || 5000;
    await app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
}
bootstrap();
