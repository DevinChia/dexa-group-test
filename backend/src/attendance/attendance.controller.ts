import {
  BadRequestException,
  Controller,
  Post,
  Get,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post()
  @Roles('employee')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/attendance',
        filename: (request, file, callback) => {
          const extensions: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
          };

          callback(null, `${randomUUID()}${extensions[file.mimetype]}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (request, file, callback) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only JPEG, PNG, and WebP images are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  submit(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Attendance photo is required');
    }

    return this.attendanceService.submit(request.user.sub, file);
  }

  @Get()
  @Roles('hrd')
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get(':id/photo')
  getPhoto(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.attendanceService.getPhoto(
      Number(id),
      request.user.sub,
      request.user.role,
    );
  }

  @Get('my')
  @Roles('employee')
  findMyAttendance(@Req() request: AuthenticatedRequest) {
    return this.attendanceService.findMyAttendance(request.user.sub);
  }
}