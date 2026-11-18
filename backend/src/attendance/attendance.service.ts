import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { join, extname } from 'path';
import { DatabaseService } from '../database/database.service';
import { ResultSetHeader } from 'mysql2';
import { unlink } from 'node:fs/promises';

@Injectable()
export class AttendanceService {
  constructor(private databaseService: DatabaseService) {}

  async submit(employeeId: number, file: Express.Multer.File) {
    const pool = this.databaseService.getPool();
  
    let result: ResultSetHeader;
  
    try {
      const [insertResult] = await pool.execute<ResultSetHeader>(
        `INSERT INTO attendances (employee_id, attendance_date, attendance_time, photo_path)
         VALUES (?, CURDATE(), NOW(), ?)`,
        [employeeId, file.filename],
      );
  
      result = insertResult;
    } catch (error: any) {
      // Remove the uploaded photo if the database insert fails.
      await unlink(file.path).catch(() => undefined);
  
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'Attendance has already been submitted today',
        );
      }
  
      throw error;
    }
  
    const [rows] = await pool.execute(
      `SELECT id, employee_id, attendance_date, attendance_time, photo_path
       FROM attendances
       WHERE id = ?`,
      [result.insertId],
    );
  
    const attendance = (rows as any[])[0];
  
    return {
      ...attendance,
      message: 'Attendance submitted successfully',
    };
  }

  async findAll() {
    const pool = this.databaseService.getPool();
  
    const [rows] = await pool.execute(
      `SELECT
        a.id,
        a.employee_id,
        e.employee_number,
        e.name AS employee_name,
        a.attendance_date,
        a.attendance_time,
        a.photo_path
      FROM attendances a
      JOIN employees e ON a.employee_id = e.id
      ORDER BY a.attendance_time DESC`,
    );
  
    return rows;
  }

  async getPhoto(attendanceId: number, employeeId: number, role: string) {
    const pool = this.databaseService.getPool();
  
    const [rows] = await pool.execute(
      'SELECT employee_id, photo_path FROM attendances WHERE id = ?',
      [attendanceId],
    );
  
    const attendance = (rows as any[])[0];
  
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }
  
    if (role !== 'hrd' && attendance.employee_id !== employeeId) {
      throw new ForbiddenException('You cannot access this photo');
    }
  
    const filePath = join(
      process.cwd(),
      'uploads',
      'attendance',
      attendance.photo_path,
    );
    
    const extension = extname(attendance.photo_path).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    
    const contentType = mimeTypes[extension] || 'application/octet-stream';
    
    return new StreamableFile(createReadStream(filePath), {
      type: contentType,
    });
  }
}