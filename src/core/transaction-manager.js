const warn = console.warn;
const Monum = require('./monum').Monum;

class TransactionManager {
    constructor(transactionContainer, scheduleContainer, accountManager) {
        this._transactionContainer = transactionContainer;
        this._scheduleContainer = scheduleContainer;
        this._accountManager = accountManager;

        this._generationUpperLimit = new Date(0);
    }

    linkTo({ transactionContainer, scheduleContainer, accountManager }) {
        if (transactionContainer)
            this._transactionContainer = transactionContainer;

        if (scheduleContainer)
            this._scheduleContainer = scheduleContainer;

        if (accountManager)
            this._accountManager = accountManager;
    }

    //
    // Transaction Generator
    //
    changeGenerationUpperLimit(newTime) {
        if (newTime > this._generationUpperLimit) {
            this._createScheduleTransaction(newTime);
        } else {
            this._removeCachedScheduleTransaction(newTime);
        }
    }

    _createScheduleTransaction(newTime) {
        let transactions = this._scheduleContainer.getTransactionsBetweenDates(this._generationUpperLimit, newTime);
        this._transactionContainer.createTransaction(transactions);
        this._generationUpperLimit = newTime;
    }

    _removeCachedScheduleTransaction(newTime) {
        // TODO, should use native transactionManager methods
        let transactions = this._transactionContainer.getAllTransactions();
        let transactionIdsToRemove = [];
        for (let [transaction, id] of Object.entries(transactions)) {
            if (transaction.time > newTime && transaction.time <= this._generationUpperLimit &&
                transaction.bySchedule != undefined) {
                transactionIdsToRemove.push(id);
            }
        }
        this._transactionContainer.removeTransaction(transactionIdsToRemove);
    }

    //
    // Transaction Manager Main Functionalities
    //
    createTransaction(arg) {
        // TODO: Make sure debits/credits account id are legal, and are debitable/creditable
        return this._transactionContainer.createTransaction(arg);
    }

    changeTransactionProperty(id, changes) {
        // TODO: Make sure debits/credits account id are legal, and are debitable/creditable
        return this._transactionContainer.changeTransactionProperty(id, changes);
    }

    removeTransaction(id) {
        return this._transactionContainer.removeTransaction(id);
    }

    createSchedule(arg) {
        // TODO: Make sure debits/credits account id are legal, and are debitable/creditable
        return this._scheduleContainer.createSchedule(arg);
    }

    changeScheduleProperty(id, changes) {
        // TODO: Make sure debits/credits account id are legal, and are debitable/creditable
        return this._scheduleContainer.changeScheduleProperty(id, changes);
    }

    removeSchedule(id) {
        return this._scheduleContainer.removeSchedule(id);
    }

    //
    // Import
    //
    import(arg) { }


}

module.exports = { TransactionManager };
