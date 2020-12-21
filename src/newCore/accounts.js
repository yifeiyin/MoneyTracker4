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
      id: 102,
      parentId: 100,
      name: 'Liability',
      accountType: 'credit',
      isFolder: true,
    });
    const equity = AccountSchema.validateSync({
      id: 103,
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
    data = AccountDatabaseSchema.validateSync(data);
    return await this.db.transaction('rw', this.table, async () => {
      await this.table.clear();
      await this.table.bulkAdd(data);
    });
  }

  async create(newAccount) {
    if (!newAccount.id) {
      newAccount = AccountSchema.omit(['id']).validateSync(newAccount);
    } else {
      newAccount = AccountSchema.validateSync(newAccount);
    }

    await this.table.add(newAccount);
  }

  async remove(id) {
    // TODO: Recursively delete children
    // TODO: Handle the case where there are associated transactions
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

  async fromIdToName(id) {
    return (await this.table.get(id)).name;
  }

  async fromNameToId(name) {
    const result = await this.table.where('name').equals(name).toArray();
    if (result.length !== 1) throw new Error(result.length === 0 ? `Account name not found: ${name}` : `Ambiguous account name: ${name}`);
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
