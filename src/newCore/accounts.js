import { assert } from './helpers';
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
    this._cacheById = {}; // id -> { id, ... }
    // this._cacheByName = {}; // name -> { id, ... }
    this._cacheByParentId = {}; // name -> [{ id, ... }]
    this._cachePathById = {}; // id -> path
  }

  async getReady() {
    if (Object.keys(this._cacheById).length !== 0) {
      // React hot reloading
      return;
    }
    await this.updateCache();
  }

  async updateCache() {
    const data = await this.exportData();
    for (let acc of data) {
      // this._cacheByName[acc.name] = acc;
      this._cacheById[acc.id] = acc;

      if (acc.parentId !== null) {
        if (this._cacheByParentId[acc.parentId]) this._cacheByParentId[acc.parentId].push(acc);
        else this._cacheByParentId[acc.parentId] = [acc];
      }
    }

    this.updateCachePath(100, '');
  }

  updateCachePath(id, path) {
    const currentPath = path + '/' + id;
    this._cachePathById[id] = currentPath;
    (this._cacheByParentId[id] || []).forEach((child) => {
      this.updateCachePath(child.id, currentPath);
    })
  }

  async exportData() {
    return await this.table.toArray();
  }

  async importData(data) {
    data = AccountDatabaseSchema.validateSync(data);
    await this.db.transaction('rw', this.table, async () => {
      await this.table.clear();
      await this.table.bulkAdd(data);
    });
    await this.updateCache();
  }

  async create(newAccount) {
    // TODO: Validate debit/credit type
    if (!newAccount.id) {
      newAccount = AccountSchema.omit(['id']).validateSync(newAccount);
    } else {
      newAccount = AccountSchema.validateSync(newAccount);
    }

    await this.table.add(newAccount);
    await this.updateCache();
  }

  async remove(id) {
    // TODO: Recursively delete children
    // TODO: Handle the case where there are associated transactions
    await this.table.delete(id);
    await this.updateCache();
  }

  async update(id, changes) {
    // TODO: If parentId has changed, need to re-index transactions
    await this.table.update(id, changes);
    await this.updateCache();
  }

  async get(id) {
    const liveResult = await this.table.get(id);
    const result = this._cacheById[id];
    assert(liveResult === result);
    if (result === undefined) throw new Error('Item not found')
    return result;
  }

  getPath(id) {
    return this._cachePathById[id];
  }

  async fromIdToName(id) {
    const liveResult = (await this.table.get(id)).name;
    const result = this._cacheById[id].name;
    assert(liveResult === result)
    return result;
  }

  async fromNameToId(name) {
    const result = await this.table.where('name').equals(name).toArray();
    if (result.length !== 1) throw new Error(result.length === 0 ? `Account name not found: ${name}` : `Ambiguous account name: ${name}`);
    return result[0].id;
  }

  async isValidId(id) {
    assert(await this.table.get(id) === id in this._cacheById)
    return undefined === await this.table.get(id);
  }

  getTreeData(startsFrom = 100) {
    const children = this._cacheByParentId[startsFrom] || [];
    const self = this._cacheById[startsFrom];

    return {
      id: startsFrom,
      name: self.name,
      isFolder: self.isFolder,
      children: children.map(child => this.getTreeData(child.id)),
    }
  }

  fuzzyFindGetId(name) {
    const result = []
    for (let [id, account] of Object.entries(this._cacheById)) {
      if (account.name.toLowerCase().includes(name.toLowerCase())) {
        result.push(id)
      }
    }
    if (result.length > 1) {
      const firstThree = result.filter((v, i) => i < 3)
      throw new Error(`Ambiguous account name ${name}, matches: ${firstThree.join(', ')} and ${result.lenght - firstThree.length} more`);
    }
    if (result.length === 0) {
      throw new Error(`No matches for account name ${name}`);
    }

    return result[0]
  }

  fuzzyFindGetPath(name) {
    const id = this.fuzzyFindGetId(name)
    return this._cachePathById[id]
  }

  // async getTreeData(startsFrom = 100) {
  //   const children = await this.table.where('parentId').equals(startsFrom).toArray();
  //   const self = await this.table.get(startsFrom);
  //   return {
  //     id: startsFrom,
  //     name: self.name,
  //     isFolder: self.isFolder,
  //     children: await Promise.all(children.map(child => this.getTreeData(child.id))),
  //   }
  // }
}
