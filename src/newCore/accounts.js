import { AccountIdSchema, AccountSchema } from './schema'
import Dexie from "dexie";

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

  constructor(table) {
    this.table = table;
  }

  async exportData() {
    return await this.table.toArray();
  }

  async importData(data) { }

  async createAccount(newAccount) {
    if (!newAccount.id) {
      newAccount = AccountSchema.omit(['id']).validateSync(newAccount);
    } else {
      newAccount = AccountSchema.validateSync(newAccount);
    }

    await this.table.add(newAccount);
  }

  async removeAccount() {

  }

  updateAccount() {

  }

  fromIdToName(id) {
    return 'TODO ' + id;
  }

  isValidId(id) {

  }

  getTreeData() {
    return []
  }
}
