import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const GoogleOAuthSchema = z.object({
    strategyName: z.string().default('google'),
    callbackPath: z.string().default('/auth/google/callback'),
    frontendCallbackUrl: z.string().default('http://localhost:5173/auth/callback'),
    scopes: z.array(z.string()).default(['email', 'profile']),
});

const handler = async (args: z.infer<typeof GoogleOAuthSchema>): Promise<SkillResult> => {
    const { strategyName, callbackPath, frontendCallbackUrl, scopes } = args;
    const files: Record<string, string> = {};

    files['google.strategy.ts'] = `import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, '${strategyName}') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.API_URL + '${callbackPath}',
      scope: ${JSON.stringify(scopes)},
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, photos, displayName } = profile;
    
    const user = {
      googleId: id,
      email: emails?.[0]?.value,
      name: displayName,
      picture: photos?.[0]?.value,
      accessToken,
    };
    
    done(null, user);
  }
}`;

    files['google-auth.guard.ts'] = `import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('${strategyName}') {}`;

    files['auth.controller.ts'] = `import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: Response) {
    // User data from Google is in req.user
    const { token, user } = await this.authService.handleGoogleLogin(req.user);
    
    // Redirect to frontend with token
    const params = new URLSearchParams({
      token,
      user: JSON.stringify(user),
    });
    
    res.redirect(\`${frontendCallbackUrl}?\${params}\`);
  }
}`;

    files['auth.service.ts'] = `import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { User } from './user.entity';

interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    // @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async handleGoogleLogin(googleUser: GoogleUser) {
    // Find or create user
    // let user = await this.userRepo.findOne({ where: { email: googleUser.email } });
    // if (!user) {
    //   user = await this.userRepo.save({
    //     email: googleUser.email,
    //     name: googleUser.name,
    //     picture: googleUser.picture,
    //     googleId: googleUser.googleId,
    //   });
    // }

    const payload = { email: googleUser.email, sub: googleUser.googleId };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      },
    };
  }
}`;

    files['auth.module.ts'] = `import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './google.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [GoogleStrategy, AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}`;

    return {
        success: true,
        data: files,
        metadata: { strategyName, callbackPath, generatedFiles: Object.keys(files) },
    };
};

export const googleOAuthSkillDefinition: SkillDefinition<typeof GoogleOAuthSchema> = {
    name: 'google_oauth_generator',
    description: 'Generates NestJS Google OAuth2 strategy with Passport.',
    parameters: GoogleOAuthSchema,
    handler,
};
