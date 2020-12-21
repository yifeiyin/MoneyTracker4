import Monum from './monum';

export const Reviver = (k, v) => {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(v)) {
    return new Date(v);
  } else if (Monum.sniffIsMonum(v)) {
    return Monum.fromJSON(v);
  } else {
    return v;
  }
};

export const deepCopy = (obj) => this.JSON.parse(JSON.stringify(obj), global.deepCopyReviver);
