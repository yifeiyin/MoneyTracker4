import { TransactionDatabaseSchema, TransactionSchema } from '../schema';
import { getTodaysDateAt0000 } from '_core/helpers'
import CheckpointManager from './checkpoints';  // eslint-disable-line
import StringSimilarity from 'string-similarity';

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
    if (result === undefined) throw new Error(`Item not found: ${id}`)
    return result;
  }

  async getAll() {
    return await this.table.toArray();
  }

  async findSimilar(arg) {
    const allTransactions = await this.getAll();
    const trans = allTransactions.filter(x => Boolean(x.rawDesc));

    const { bestMatch, bestMatchIndex } = StringSimilarity.findBestMatch(arg, trans.map(x => x.rawDesc));
    console.log(bestMatch);
    console.log(trans[bestMatchIndex]);
  }
}
