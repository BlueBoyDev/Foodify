import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) { }

  findAll(restaurantId: number) {
    return this.repo.find({ where: { restaurant: { id: restaurantId } } });
  }

  async findOne(id: number) {
    const u = await this.repo.findOneBy({ id });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return u;
  }

  async create(restaurantId: number, dto: CreateUserDto) {
    // 1. Extraemos 'password' y guardamos el resto en 'userData'
    const { password, ...userData } = dto;

    // 2. Encriptamos el password limpio
    const hash = await bcrypt.hash(password, 12);

    // 3. Creamos el usuario sin el campo 'password', pero asignando 'passwordHash'
    const user = this.repo.create({
      ...userData,
      restaurant: { id: restaurantId },
      passwordHash: hash
    });

    // 4. Guardamos en la base de datos
    const savedUser = await this.repo.save(user);

    // 5. Por seguridad, quitamos el hash antes de devolver el usuario en la respuesta HTTP
    delete savedUser.passwordHash;
    return savedUser;
  }

  async update(id: number, dto: UpdateUserDto) {
    const { password, ...updateData } = dto;
    const finalData: any = { ...updateData };

    if (password) {
      finalData.passwordHash = await bcrypt.hash(password, 12);
    }

    await this.repo.update(id, finalData);
    return this.findOne(id);
  }

  async updatePassword(id: number, newPassword: string) {
    const hash = await bcrypt.hash(newPassword, 12);
    await this.repo.update(id, { passwordHash: hash });
    return { message: 'Contraseña actualizada' };
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { message: 'Usuario eliminado permanentemente' };
  }
}