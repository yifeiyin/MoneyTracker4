import { AccountDatabaseSchema, AccountSchema } from './schema'

export default class AccountManager {
  static getInitialSetupData() {
    const root = AccountSchema.validateSync({
      id: 100,
      parentId: null,
      name: 'Root',
      accountType: 'debit',
      isFolder: true,
    });
    const asset = AccountSchema.validateSync({
      id: 101,
      parentId: 100,
      name: 'Asset',
      accountType: 'debit',
      isFolder: true,
    });
    const liability = AccountSchema.validateSync({
      id: 101,
      parentId: 100,
      name: 'Liability',
      accountType: 'credit',
      isFolder: true,
    });
    const equity = AccountSchema.validateSync({
      id: 102,
      parentId: 100,
      name: 'Equity',
      accountType: 'credit',
      isFolder: true,
    });
    return [root, asset, liability, equity];
  }

  constructor(table, db) {
    this.table = table;
    this.db = db;
  }

  async exportData() {
    return await this.table.toArray();
  }

  async importData(data) {
    AccountDatabaseSchema.validateSync(data);
    return await this.db.transaction('rw', this.table, async () => {
      await this.table.clear();
      await this.table.bulkAdd(data);
    });
  }

  async createAccount(newAccount) {
    if (!newAccount.id) {
      newAccount = AccountSchema.omit(['id']).validateSync(newAccount);
    } else {
      newAccount = AccountSchema.validateSync(newAccount);
    }

    await this.table.add(newAccount);
  }

  async removeAccount(id) {
    await this.table.delete(id);
  }

  async updateAccount(id, changes) {
    await this.table.update(id, changes);
  }

  async fromIdToName(id) {
    return 'TODO ' + id;
  }

  async get(id) {
    const result = await this.table.get(id);
    if (result === undefined) throw new Error('Account not found')
    return result;
  }

  async isValidId(id) {
    return undefined === await this.table.get(id);
  }

  async getTreeData(startsFrom = 100) {
    const children = await this.table.where('parentId').equals(startsFrom).toArray();
    const self = await this.table.get(startsFrom);
    return {
      id: startsFrom,
      name: self.name,
      isFolder: self.isFolder,
      children: await Promise.all(children.map(child => this.getTreeData(child.id))),
    }
  }
}
