const { Monum } = require('./monum');
const warn = console.warn;

class TransactionContainer {
    constructor() {
        this._transactions = {};
        this._greatestIdUsed = 100000;
    }

    fromJSON(json) {
        let reviver = (k, v) => {
            return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(v) ? new Date(v) :
                typeof (v) === 'object' && v !== null && v._class === 'monum' ? Monum.fromObject(v) : v;
        };
        const parsedObject = JSON.parse(json, reviver);
        this._transactions = parsedObject._transactions;
        this._greatestIdUsed = parsedObject._greatestIdUsed;
    }

    toJSON(key) {
        return {
            '_transactions': this._transactions,
            '_greatestIdUsed': this._greatestIdUsed,
        };
    }

    _generateUniqueId() {
        this._greatestIdUsed++;
        return this._greatestIdUsed;
    }

    _getTransactionById(id) {
        const result = this._transactions[id];
        if (result == undefined)
            throw new ReferenceError(`Transaction not found: ${id}`);
        return result;
    }

    createTransaction(newTransaction) {
        /** Creates a new transaction in the database. It at least needs to
         * have these properties: time, credits, debits.
         * @param {Object} newTransaction new transaction object
         * @return {Number} new transaction id
         */

        // Recursively call self when receiving an Array
        if (newTransaction instanceof Array) {
            let result = [];
            for (let item of newTransaction)
                result.push(this.createTransaction(item));
            return result;
        }

        if (newTransaction == undefined)
            throw TypeError("newTransaction is undefined");

        if (!(newTransaction.time instanceof Date))
            throw TypeError(`newTransaction.time is not Date: ${typeof (newTransaction.time)}`);
        if (!(newTransaction.credits instanceof Array))
            throw TypeError(`newTransaction.credits is not Array: ${typeof (newTransaction.credits)}`);
        if (!(newTransaction.debits instanceof Array))
            throw TypeError(`newTransaction.debits is not Array: ${typeof (newTransaction.debits)}`);

        if (newTransaction.credits.length == 0)
            warn("New transaction credits has length 0");
        if (newTransaction.debits.length == 0)
            warn("New transaction debits has length 0");

        // Adding the transaction to the database
        const newId = this._generateUniqueId();
        this._transactions[newId] = newTransaction;
        return newId;
    }

    removeTransaction(id) {
        // Recursively call self when receiving an Array
        if (id instanceof Array) {
            for (let item of id)
                this.removeTransaction(item);
            return;
        }

        delete this._transactions[id];
    }

    changeTransactionProperty(id, changes) {
        /**
         * Changes a transaction.
         * @param {Number} id
         * @param {Object} changes key-value pair where value is the newValue
         */

        // Recursively call self when receiving an Array
        if (id instanceof Array) {
            for (let item of id)
                this.changeTransactionProperty(item, changes);
            return;
        }

        const target = this._getTransactionById(id);
        for (let [key, value] of Object.entries(changes)) {
            if (value == undefined) delete target[key];
            else target[key] = value;
            console.log(key, value);
        }
    }

    getAllTransactions() {
        return Object.assign({}, this._transactions);
    }

    getTransactions(filters) {
        // TODO, Filter function
    }
}

module.exports = { TransactionContainer };
