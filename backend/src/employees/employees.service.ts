import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { DatabaseService } from '../database/database.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ResultSetHeader } from 'mysql2';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private databaseService: DatabaseService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const pool = this.databaseService.getPool();

    const [existingEmployees] = await pool.execute(
      'SELECT id FROM employees WHERE employee_number = ? OR email = ?',
      [createEmployeeDto.employeeNumber, createEmployeeDto.email],
    );

    if ((existingEmployees as any[]).length > 0) {
      throw new ConflictException(
        'Employee number or email is already registered',
      );
    }

    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO employees (employee_number, name, email, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        createEmployeeDto.employeeNumber,
        createEmployeeDto.name,
        createEmployeeDto.email,
        hashedPassword,
        'employee',
      ],
    );

    return {
      id: result.insertId,
      employeeNumber: createEmployeeDto.employeeNumber,
      name: createEmployeeDto.name,
      email: createEmployeeDto.email,
      role: 'employee',
      isActive: true,
    };
  }

  async findAll() {
    const pool = this.databaseService.getPool();
  
    const [employees] = await pool.execute(
      `SELECT id, employee_number, name, email, role, is_active, created_at
       FROM employees
       ORDER BY id ASC`,
    );
  
    return employees;
  }

  async findOne(id: number) {
    const pool = this.databaseService.getPool();
  
    const [rows] = await pool.execute(
      `SELECT id, employee_number, name, email, role, is_active, created_at
       FROM employees
       WHERE id = ?`,
      [id],
    );
  
    const employees = rows as any[];
  
    if (employees.length === 0) {
      throw new NotFoundException('Employee not found');
    }
  
    return employees[0];
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    const pool = this.databaseService.getPool();
  
    // Check whether the employee exists
    const [rows] = await pool.execute(
      'SELECT id FROM employees WHERE id = ?',
      [id],
    );
  
    if ((rows as any[]).length === 0) {
      throw new NotFoundException('Employee not found');
    }
  
    // Build the fields that need to be updated
    const updates: string[] = [];
    const values: string[] = [];
  
    if (updateEmployeeDto.employeeNumber !== undefined) {
      updates.push('employee_number = ?');
      values.push(updateEmployeeDto.employeeNumber);
    }
  
    if (updateEmployeeDto.name !== undefined) {
      updates.push('name = ?');
      values.push(updateEmployeeDto.name);
    }
  
    if (updateEmployeeDto.email !== undefined) {
      updates.push('email = ?');
      values.push(updateEmployeeDto.email);
    }
  
    if (updates.length === 0) {
      throw new BadRequestException('No fields provided for update');
    }
  
    // Check for duplicate employee number or email
    const conditions: string[] = [];
    const duplicateValues: string[] = [];
  
    if (updateEmployeeDto.employeeNumber !== undefined) {
      conditions.push('employee_number = ?');
      duplicateValues.push(updateEmployeeDto.employeeNumber);
    }
  
    if (updateEmployeeDto.email !== undefined) {
      conditions.push('email = ?');
      duplicateValues.push(updateEmployeeDto.email);
    }
  
    if (conditions.length > 0) {
      const [duplicates] = await pool.execute(
        `SELECT id FROM employees
         WHERE (${conditions.join(' OR ')}) AND id <> ?`,
        [...duplicateValues, String(id)],
      );
  
      if ((duplicates as any[]).length > 0) {
        throw new ConflictException(
          'Employee number or email is already registered',
        );
      }
    }
  
    // Update the employee
    values.push(String(id));
  
    await pool.execute(
      `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );
  
    return this.findOne(id);
  }

  async deactivate(id: number) {
    const pool = this.databaseService.getPool();
  
    const [rows] = await pool.execute(
      'SELECT id, is_active FROM employees WHERE id = ?',
      [id],
    );
  
    const employees = rows as any[];
  
    if (employees.length === 0) {
      throw new NotFoundException('Employee not found');
    }
  
    if (!employees[0].is_active) {
      throw new BadRequestException('Employee is already deactivated');
    }
  
    await pool.execute(
      'UPDATE employees SET is_active = FALSE WHERE id = ?',
      [id],
    );
  
    return {
      message: 'Employee successfully deactivated',
    };
  }
}