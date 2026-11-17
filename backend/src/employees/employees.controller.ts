import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Post()
  @Roles('hrd')
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @Roles('hrd')
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  @Roles('hrd')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(Number(id));
  }

  @Patch(':id')
  @Roles('hrd')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(
      Number(id),
      updateEmployeeDto,
    );
  }

  @Patch(':id/deactivate')
  @Roles('hrd')
  deactivate(@Param('id') id: string) {
    return this.employeesService.deactivate(Number(id));
  }
}