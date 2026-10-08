import type { Model, Document, ClientSession } from 'mongoose';
import { injectable, unmanaged } from 'inversify';
import type { IBaseRepository } from '../interfaces/base.repository.interface.js';
import type { IEntityMapper } from '../mappers/entity.mapper.js';

@injectable()
export abstract class BaseRepository<T, TDoc extends Document> implements IBaseRepository<T> {
  constructor(
    @unmanaged() protected readonly model: Model<TDoc>,
    @unmanaged() protected readonly mapper: IEntityMapper<T, TDoc>,
  ) {}

  async create(item: T, session?: ClientSession): Promise<T> {
    const doc = new this.model(this.mapper.toPersistence(item));
    await doc.save(session ? { session } : {});
    return this.mapper.toDomain(doc as unknown as TDoc);
  }

  async findById(id: string, session?: ClientSession): Promise<T | null> {
    const doc = await this.model
      .findById(id)
      .session(session ?? null)
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findOne(filter: Record<string, unknown>, session?: ClientSession): Promise<T | null> {
    const doc = await this.model
      .findOne(filter)
      .session(session ?? null)
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async find(filter: Record<string, unknown> = {}, session?: ClientSession): Promise<T[]> {
    const docs = await this.model
      .find(filter)
      .session(session ?? null)
      .exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  async updateById(
    id: string,
    update: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<T | null> {
    const options = session ? { new: true, session } : { new: true };
    const doc = await this.model.findByIdAndUpdate(id, update, options).exec();
    return doc ? this.mapper.toDomain(doc as unknown as TDoc) : null;
  }

  async deleteById(id: string, session?: ClientSession): Promise<boolean> {
    const result = await this.model
      .findByIdAndDelete(id)
      .session(session ?? null)
      .exec();
    return result !== null;
  }
}
