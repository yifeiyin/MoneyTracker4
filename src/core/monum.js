
const warn = console.warn;
const PRECISION = 5; // Number of digits to round to when computing

class Monum {

    constructor(currency, value) {
        this._class = 'monum';
        if (currency == undefined && value == undefined) {
            return this;
        }

        if (typeof (currency) != 'string')
            throw new Error(`Monum: Creation failed: currency is not a string: ${typeof (currency)}`);

        if (!Monum.setup.acceptableCurrencies.includes(currency.toUpperCase()))
            throw new Error(`Monum: Creation failed: currency is not acceptable: ${currency}`);

        if (currency.toUpperCase() != currency) {
            warn(`Monum: Converting currency to all upper case: ${currency}`);
            currency = currency.toUpperCase();
        }

        if (typeof (value) != 'string') {
            warn(`Monum: Converting ${value} to string`);
            value = String(value);
        }

        this[currency] = value;
    }

    toString() {
        let result = '';
        let notFirstElement = false;
        for (let [k, v] of Object.entries(this)) {
            if (k.startsWith('_')) continue;
            result += (notFirstElement ? '˖' : '') + k + ' ' + v;
            notFirstElement = true;
        }
        return result;
    }

    isZero() {
        for (let key in this)
            if (!key.startsWith('_') && Number(this[key]) != 0.0)
                return false;
        return true;
    }

    isNotZero() { return !this.isZero(); }

    add(...others) {
        let result = new Monum();

        // Copying this to result
        for (let key in this) {
            if (key.startsWith('_')) continue;
            result[key] = this[key];
        }

        // Add other to result
        for (let other of others) {
            if (other._class != 'monum') {
                warn(`Monum: other._class is not monum, ignoring: ${other.monum}`);
                continue;
            }

            for (let key in other) {
                if (key.startsWith('_')) continue;
                result[key] = result[key] == undefined ? other[key] :
                    (Number(other[key]) + Number(result[key]))
                        .toFixed(PRECISION).replace(/\.?0+$/, ''); // (*) Core Implementation
            }
        }
        return result;
    }

    sub(...others) {
        return new Monum().add(...others).neg().add(this);
    }

    neg() {
        let result = new Monum();
        for (let key in this) {
            if (key.startsWith('_')) continue;
            result[key] = (-Number(this[key])).toFixed(PRECISION).replace(/\.?0+$/, '');
        }
        return result;
    }
}


Monum.new = function (...args) { return new Monum(...args); };
Monum.combine = function (...args) { return new Monum().add(...args); };
Monum.fromObject = function (obj) {
    return new Monum.combine(obj);
}

Monum.setup = {

    acceptableCurrencies: [],
    defaultCurrency: '',

    fromJSON(json) {
        const parsedObject = JSON.parse(json);
        this.acceptableCurrencies = parsedObject.acceptableCurrencies;
        this.defaultCurrency = parsedObject.defaultCurrency;
    },

    // toJSON(key) {
    //     return {
    //         'acceptableCurrencies': this.acceptableCurrencies,
    //         'defaultCurrency': this.defaultCurrency
    //     };
    // },

    changeDefaultCurrency(newDefaultCurrency) {
        if (newDefaultCurrency != newDefaultCurrency.toUpperCase()) {
            warn(`Monum.setup: Converted currency to upper case: ${newDefaultCurrency}`);
            newDefaultCurrency = newDefaultCurrency.toUpperCase();
        }
        if (!this.acceptableCurrencies.includes(newDefaultCurrency) && newDefaultCurrency != '') {
            throw new Error(`Monum.setup: Currency does not exist: ${newDefaultCurrency}`);
        }
        this.defaultCurrency = newDefaultCurrency;
    },

    addAcceptableCurrency(currencyToAdd) {
        /**
         * @param {String | Array} currencyToAdd An array or a currency
         */

        // Recursively Call self when receiving an Array
        if (currencyToAdd instanceof Array) {
            for (let item of currencyToAdd)
                this.addAcceptableCurrency(item);
            return;
        }

        if (currencyToAdd != currencyToAdd.toUpperCase()) {
            warn(`Monum.setup: Converted currency to upper case: ${currencyToAdd}`);
            currencyToAdd = currencyToAdd.toUpperCase();
        }
        if (this.acceptableCurrencies.includes(currencyToAdd)) {
            warn(`Monum.setup: Currency already exists: ${currencyToAdd}`);
            return;
        }
        if (currencyToAdd == '') {
            throw new Error(`Monum.setup: Currency name cannot be empty`);
        }
        this.acceptableCurrencies.push(currencyToAdd);
    },

    removeAcceptableCurrency(currencyToRemove) {
        if (currencyToRemove != currencyToRemove.toUpperCase()) {
            warn(`Monum.setup: Converted currency to upper case: ${currencyToRemove}`);
            currencyToRemove = currencyToRemove.toUpperCase();
        }
        let indexToRemove = this.acceptableCurrencies.indexOf(currencyToRemove);
        if (indexToRemove == -1) {
            warn(`Monum.setup: Currency does not exist: ${currencyToRemove}`);
            return;
        }
        this.acceptableCurrencies.splice(indexToRemove, 1);
        if (this.defaultCurrency == currencyToRemove) {
            this.defaultCurrency = '';
        }
    },

};

module.exports = { Monum };
