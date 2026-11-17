import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const pool = this.databaseService.getPool();

    const [rows] = await pool.execute(
      'SELECT * FROM employees WHERE email = ? AND is_active = TRUE',
      [loginDto.email],
    );

    const employees = rows as any[];

    if (employees.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const employee = employees[0];

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      employee.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: employee.id,
      email: employee.email,
      role: employee.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: employee.id,
        employeeNumber: employee.employee_number,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
    };
  }
}