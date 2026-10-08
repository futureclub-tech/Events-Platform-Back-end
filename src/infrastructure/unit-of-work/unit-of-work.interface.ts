import type { ClientSession } from 'mongoose';

export interface IUnitOfWork {
  execute<T>(operation: (session: ClientSession) => Promise<T>): Promise<T>;
}
