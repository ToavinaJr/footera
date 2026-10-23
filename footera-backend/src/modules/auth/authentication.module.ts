import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { UserContext } from './user-context.js';
import { UserContextInterceptor } from './user-context.interceptor.js';

@Module({ imports: [DatabaseModule], providers: [AuthService, JwtAuthGuard, UserContext, UserContextInterceptor], exports: [AuthService, JwtAuthGuard, UserContextInterceptor, UserContext] })
export class AuthenticationModule {}
