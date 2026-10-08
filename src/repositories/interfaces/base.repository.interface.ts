import type { ClientSession } from 'mongoose';

export interface IBaseRepository<T> {
  create(item: T, session?: ClientSession): Promise<T>;
  findById(id: string, session?: ClientSession): Promise<T | null>;
  findOne(filter: Record<string, unknown>, session?: ClientSession): Promise<T | null>;
  find(filter?: Record<string, unknown>, session?: ClientSession): Promise<T[]>;
  updateById(id: string, update: Partial<T>, session?: ClientSession): Promise<T | null>;
  deleteById(id: string, session?: ClientSession): Promise<boolean>;
}
