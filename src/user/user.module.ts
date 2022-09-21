import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { TagModule } from 'src/tag/tag.module';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
    controllers: [UserController],
    providers: [UserService, UserRepository],
    imports: [forwardRef(() => AuthModule), DbModule, forwardRef(() => TagModule)],
    exports: [UserService],
})
export class UserModule {}
