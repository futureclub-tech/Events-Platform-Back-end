export interface IEntityMapper<TEntity, TPersistence> {
  toDomain(persistence: TPersistence): TEntity;
  toPersistence(entity: TEntity): Record<string, unknown>;
}
