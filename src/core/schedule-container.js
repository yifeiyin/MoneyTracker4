const { Monum } = require('./monum');
const warn = console.warn;

class ScheduleContainer {
    constructor() {
        this._greatestIdUsed = 800000;
        this._schedules = {};
    }

    toJSON(key) {
        return {
            '_greatestIdUsed': this._greatestIdUsed,
            '_schedules': this._schedules,
        };
    }

    fromJSON(json) {
        let reviver = (k, v) => {
            return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(v) ? new Date(v) :
                v._class == 'monum' ? Monum.fromObject(v) :
                    v;
        };
        const parsedObject = JSON.parse(json, reviver);
        this._greatestIdUsed = parsedObject._greatestIdUsed;
        this._schedules = parsedObject._schedules;
        // TODO: Sanity Check
    }

    _generateUniqueId() {
        this._greatestIdUsed++;
        return this._greatestIdUsed;
    }

    _getScheduleById(id) {
        const result = this._schedules[id];
        if (result == undefined)
            throw new ReferenceError(`id not found: ${id}`);
        return result;
    }

    createSchedule(newSchedule) {
        // Recursively call self when receiving an Array
        if (newSchedule instanceof Array) {
            let result = [];
            for (let item of newSchedule)
                result.push(this.createSchedule(item));
            return result;
        }

        // TODO: Sanity check, make sure it is legal
        const newId = this._generateUniqueId();
        this._schedules[newId] = newSchedule;
        return newId;
    }

    changeScheduleProperty(id, changes) {
        const target = this._getScheduleById(id);
        for (let [key, value] in Object.entries(changes)) {
            if (value == undefined) delete target[key];
            else target[key] = value;
        }
    }

    removeSchedule(id) {
        delete this._schedules[id];
    }

    getTransactionsBetweenDates(startDate, endDate) {
        let resultTransactions = [];
        for (let [scheduleId, schedule] of Object.entries(this._schedules)) {

            // Ignore Other Versions
            if (schedule.__version__ != 'v1') {
                warn(`Ignoring schedule with version ${schedule.__version__}`);
            }

            // Ignore Out Of Range Schedules
            if (schedule.effectiveTime > endDate || schedule.expirationDate < startDate)
                continue;

            // ---------- CORE CODE -------------

            const startOn = schedule.startOn;
            const repeatInterval = schedule.repeatInterval;    // example: every **2** weeks
            const repeatUnit = schedule.repeatUnit;            // example: every 2 **weeks**

            const offsetUnit = schedule.offsetUnit;
            const offsetCount = schedule.offsetCount;

            const resultDates = [];
            for (let i = 0; true; i++) {
                const newDate = new Date(+startOn);

                // Dealing with repeat
                if (repeatUnit == 'year')
                    newDate.setFullYear(newDate.getFullYear() + i * repeatInterval);
                else if (repeatUnit == 'month')
                    newDate.setMonth(newDate.getMonth() + i * repeatInterval);
                else if (repeatUnit == 'week')
                    newDate.setDate(newDate.getDate() + i * 7 * repeatInterval);
                else if (repeatUnit == 'day')
                    newDate.setDate(newDate.getDate() + i * repeatInterval);
                else
                    throw new ReferenceError(`repeatUnit cannot be recognized: ${repeatUnit}`);


                // Dealing with Offset
                if (offsetCount != undefined && offsetCount != 0) {
                    if (offsetUnit == undefined)
                        throw new ReferenceError("OffsetUnit is undefined");

                    if (offsetUnit == 'year')
                        newDate.setFullYear(newDate.getFullYear() + offsetCount);
                    else if (offsetUnit == 'month')
                        newDate.setMonth(newDate.getMonth() + offsetCount);
                    else if (offsetUnit == 'week')
                        newDate.setDate(newDate.getDate() + 7 * offsetCount);
                    else if (offsetUnit == 'day')
                        newDate.setDate(newDate.getDate() + offsetCount);
                    else
                        throw new ReferenceError(`offsetUnit cannot be recognized: ${offsetUnit}`);
                }

                // Breaking out (Notice the equal sign, the endDate and expirationDate are excluded)
                if (newDate >= endDate || (schedule.expirationDate && newDate >= schedule.expirationDate)) {
                    break;
                }

                let existsInExceptOn = false;
                if (schedule.exceptOn) {
                    for (let date of schedule.exceptOn) {
                        if (+date == +newDate) {
                            existsInExceptOn = true;
                            break;
                        }
                    }
                }

                if (!existsInExceptOn)
                    resultDates.push(newDate);

            }

            // Pushing new transactions into resultTransactions
            for (let date of resultDates) {
                let resultTransaction = Object.assign({}, schedule.transaction);
                resultTransaction.time = date;

                // Add internal flags
                resultTransaction.__bySchedule = scheduleId;

                resultTransactions.push(resultTransaction);
            }

        }
        return resultTransactions;
    }
}

module.exports = { ScheduleContainer };
