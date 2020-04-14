// const STATUS_ACTIVE = 'active';
// const STATUS_ARCHIVED = 'archived';

class AccountManager {
    constructor(json = '') {
        if (json != '') {
            this.fromJSON(json);
            return;
        }

        // Initialize a new AccountManager
        this._accountNodes = {};
        this._rootAccount = null;
        this._accountNodeHierarchy = null;
        this._greatestIdUsed = 100;

        this._rootAccount = this.createAccountNode({
            'isFolder': true,
            'name': 'Root',
            'parentId': null,
            '_CREATING_ROOT': true,
            '_ID': 0,
            'accountType': 'debit'
        });
        this.createAccountNode({
            'isFolder': true,
            'name': 'Asset',
            'parentId': this._rootAccount,
            '_ID': 10,
            'accountType': 'debit'
        });
        this.createAccountNode({
            'isFolder': true,
            'name': 'Liability',
            'parentId': this._rootAccount,
            '_ID': 20,
            'accountType': 'credit'
        });
        this.createAccountNode({
            'isFolder': true,
            'name': 'Equity',
            'parentId': this._rootAccount,
            '_ID': 30,
            'accountType': 'credit'
        });

    }

    fromJSON(json) {
        const parsedObject = JSON.parse(json);
        this._accountNodes = parsedObject._accountNodes;
        this._greatestIdUsed = parsedObject._greatestIdUsed;

        this._rootAccount = 0;
        this.updateAccountNodeHierarchy();

        // TODO: Sanity Check
    }

    toJSON(key) {
        return {
            '_accountNodes': this._accountNodes,
            '_greatestIdUsed': this._greatestIdUsed,
        };
    }

    _generateUniqueId() {
        this._greatestIdUsed++;
        return this._greatestIdUsed;
    }

    _isNameUniqueUnderParent(name, id) {
        for (let siblingId of this._accountNodeHierarchy[id].children) {
            if (name == this._accountNodes[siblingId].name)
                return false;
        }
        return true;
    }

    createAccountNode(newAccountNode) {

        for (let [key, type] of Object.entries({ 'isFolder': 'boolean', 'name': 'string', 'parentId': 'string', 'accountType': 'string' })) {
            if (!(key in newAccountNode)) throw new Error(`Missing mandatory key in newAccountNode: ${key}`);
            if (typeof (newAccountNode[key]) != type && !newAccountNode._CREATING_ROOT) throw new Error(`${key} in newAccountNode should be of type ${type}, but is: ${typeof (newAccountNode[key])}`);
        }

        if (!(['debit', 'credit'].includes(newAccountNode.accountType)))
            throw new Error(`value of newAccountNode.accountType is illegal: ${newAccountNode.accountType}`);

        let newAccountNodeId;

        if (newAccountNode._CREATING_ROOT == true) {
            if (newAccountNode._ID == undefined) throw new Error(`Have _CREATING_ROOT but do not have _ID`);
            newAccountNodeId = newAccountNode._ID;
        } else {
            // In almost all cases, it is this part that will run

            if (!(newAccountNode.parentId in this._accountNodes))
                throw new ReferenceError(`parentId in newAccountNode cannot be found: ${newAccountNode.parentId}`);

            if (this._accountNodes[newAccountNode.parentId].isFolder !== true) {
                throw new ReferenceError(`Parent specified is not a folder.`);
            }

            if (!this._isNameUniqueUnderParent(newAccountNode.name, newAccountNode.parentId))
                throw new Error(`name is not unique within its siblings: ${newAccountNode.name}`);

            if (newAccountNode._ID != undefined) {
                newAccountNodeId = newAccountNode._ID;
                delete newAccountNode._ID;  // Remove the property so it does not stay in the object
            }

        }
        // isFolder -- must be bool -- done
        // name -- is unique -- done
        // parentId -- must be legal -- done

        // TODO: Maybe user can create an archived account for managing past things?
        // status -- must be legal
        // id -- done

        // dr/cr account -- done

        // others: description

        newAccountNodeId = newAccountNodeId == undefined ? this._generateUniqueId() : newAccountNodeId;
        this._accountNodes[newAccountNodeId] = newAccountNode;

        this.updateAccountNodeHierarchy();
        return newAccountNodeId;
    }

    removeAccountNode(id) {
        // TODO: Need to ensure there is no transaction associated with this account
        delete this._accountNodes[id];
        this.updateAccountNodeHierarchy();
    }

    changeAccountNodeProperty(id, changes) {

        const targetAccount = this._accountNodes[id];

        if (targetAccount == undefined) {
            throw new Error(`Cannot find account by id: ${id}`);
        }

        for (let [propertyKey, newValue] of Object.entries(changes)) {

            if (propertyKey == 'name') {
                if (newValue === targetAccount.name) continue;
                // Ensuring name is unique within its siblings
                if (!this._isNameUniqueUnderParent(newValue, targetAccount.parentId))
                    throw new Error(`AccountManager: name is not unique within its siblings: ${newValue}`);
                targetAccount.name = newValue;
            }

            else if (propertyKey == 'parentId') {
                if (newValue === targetAccount.parentId) continue;

                // Ensuring the parent exists
                if (!(newValue in this._accountNodes))
                    throw new ReferenceError(`ParentId not found: ${newValue}`);
                if (newValue == this._rootAccount)
                    throw new Error(`AccountManger: Cannot add account to root account`);

                // Ensuring name is unique within its siblings
                if (!this._isNameUniqueUnderParent(targetAccount.name, newValue))
                    throw new Error(`AccountManager: name is not unique within its siblings: ${targetAccount.name}`);

                targetAccount.parentId = newValue;
                this.updateAccountNodeHierarchy();
            }

            else if (propertyKey == 'status') {
                // TODO: Change status
                targetAccount.status = newValue; // WARN: Temporary use only!!
            }

            else {
                if (newValue == undefined)
                    delete targetAccount[propertyKey];
                else
                    targetAccount[propertyKey] = newValue;
            }

        }
    }

    fromIdToName(id) {
        if (!(id in this._accountNodes))
            throw new ReferenceError(`Id not found: ${id}`);

        return this._accountNodes[id].name;
    }

    accountIdExist(id, nonFolderOnly = true) {
        const exists = Object.keys(this._accountNodes).includes(id);

        if (nonFolderOnly)
            return exists && this._accountNodes[id].isFolder == false;

        else
            return exists;
    }

    updateAccountNodeHierarchy() {
        let resultHierarchy = {};
        for (let [accId, acc] of Object.entries(this._accountNodes)) {
            resultHierarchy[accId] = { parent: acc.parentId, children: [] };
        }

        for (let accId in resultHierarchy) {
            let childrenList = resultHierarchy[accId]['children'];

            for (let otherAccId in resultHierarchy) {
                if (otherAccId == accId) continue;
                if (resultHierarchy[otherAccId].parent == accId)
                    childrenList.push(otherAccId);
            }
        }

        this._accountNodeHierarchy = resultHierarchy;
    }

    getReadableAccountNodeHierarchy(stringSoFar = '', level = 0, startsFrom = this._rootAccount) {
        let accNode = this._accountNodes[startsFrom];
        let tmpStr = '» '.repeat(level) + '[' + String(startsFrom).padStart(3, '0') + ']' + (accNode.accountType == 'debit' ? 'ᵈʳ' : 'ᶜʳ') + (accNode.isFolder ? '📁  ' : '📄  ') + accNode.name;
        stringSoFar += tmpStr + '\n' + ' '.repeat(tmpStr.length) + ' - ' + (accNode.description || '') + '\n';
        for (let childId of this._accountNodeHierarchy[startsFrom].children) {
            stringSoFar = this.getReadableAccountNodeHierarchy(stringSoFar, level + 1, childId);
        }
        return stringSoFar;
    }

    getTreeData(startsFrom = this._rootAccount) {
        if (startsFrom === this._rootAccount) {
            return this._accountNodeHierarchy[startsFrom].children.map(c => this.getTreeData(c))
        }
        return {
            id: '' + startsFrom,
            name: this.fromIdToName(startsFrom),
            children: this._accountNodeHierarchy[startsFrom].children.map(c => this.getTreeData(c))
        }
    }
}

// AccountManager.STATUS_ACTIVE = STATUS_ACTIVE;
// AccountManager.STATUS_ARCHIVED = STATUS_ARCHIVED;

module.exports = { AccountManager };
