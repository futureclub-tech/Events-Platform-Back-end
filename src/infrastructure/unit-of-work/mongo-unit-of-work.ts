import { injectable } from 'inversify';
import mongoose, { type ClientSession } from 'mongoose';
import type { IUnitOfWork } from './unit-of-work.interface.js';

@injectable()
export class MongoUnitOfWork implements IUnitOfWork {
  async execute<T>(operation: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    try {
      return (await session.withTransaction(() => operation(session))) as T;
    } finally {
      await session.endSession();
    }
  }
}
