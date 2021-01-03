import { TransactionDatabaseSchema, TransactionSchema } from './schema';
import { getTodaysDateAt0000 } from './helpers'
import CheckpointManager from './checkpoints';  // eslint-disable-line

export default class TransactionManager {
  static getInitialSetupData() {
    const first = TransactionSchema.validateSync({
      id: 100001,
      time: getTodaysDateAt0000(),
      title: 'Initial transaction',
      credits: [],
      debits: [],
    });
    return [first];
  }

  /** @type {CheckpointManager} */
  checkpointManager = null;

  /**
   * @param {import("dexie").Table} table
   * @param {import("dexie").Dexie} db
   */
  constructor(table, db) {
    this.table = table;
    this.db = db;
  }

  async exportData() {
    return await this.table.toArray();
  }

  async importData(data) {
    data = TransactionDatabaseSchema.validateSync(data);
    return await this.db.transaction('rw', this.table, async () => {
      await this.table.clear();
      await this.table.bulkAdd(data);
    });
  }

  async create(data) {
    data = TransactionSchema.omit(['id']).validateSync(data);
    return await this.table.add(data);
  }

  async remove(id) {
    await this.table.delete(id);
  }

  async update(id, changes) {
    await this.table.update(id, changes);
  }

  async get(id) {
    const result = await this.table.get(id);
    if (result === undefined) throw new Error('Item not found')
    return result;
  }

  async getAll() {
    return await this.table.toArray();
  }
}
