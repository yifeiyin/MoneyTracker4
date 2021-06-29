export const AccountEditFormat = {
  title: 'Account $name ($id)',
  fields: [
    { id: 'id', type: 'input', propertyType: 'immutable' },
    { id: 'name', type: 'input' },
    { id: 'parentId', type: 'account' },
    { id: 'isFolder', type: 'boolean', propertyType: 'immutable' },
    { id: 'accountType', type: 'select', choices: ['debit', 'credit'], propertyType: 'immutable' },
    { id: 'description', type: 'multiline' },
  ],
  actions: [
    { text: 'Save', callback: 'onSave', type: 'save' },
    { text: 'Delete', callback: 'onRemove', type: 'delete' },
  ],
}

export const AccountCreateFormat = {
  title: 'Create new account',
  fields: [
    { id: 'name', type: 'input' },
    { id: 'parentId', type: 'account' },
    { id: 'isFolder', type: 'boolean' },
    { id: 'accountType', type: 'select', choices: ['debit', 'credit'] },
    { id: 'description', type: 'multiline' },
  ]
}


export const TransactionEditFormat = {
  title: 'Editing Transaction',
  fields: [
    { id: 'id', type: 'input', propertyType: 'immutable' },
    { id: 'title', type: 'input' },
    { id: 'time', type: 'datetime' },
    { id: ['debits', 'credits'], type: 'debits/credits' },
    { id: 'description', type: 'multiline' },
    { id: 'tags', type: 'array-of-string' },
  ]
};

export const TransactionCreateFormat = {
  ...TransactionEditFormat,
  fields: TransactionEditFormat.fields.filter(o => o.id !== 'id'),
  title: 'Creating Transaction',
};

export const FileItemCreateFormat = (fileTypes) => ({
  disableCustomProperties: true,
  saveButtonText: 'Create New',
  fields: [
    { id: 'name', type: 'input' },
    { id: 'type', type: 'select', choices: Object.keys(fileTypes) },
  ]
});

export const RunScriptFormat = (type, files) => {
  let choices = files.filter(f => f.type === type).map(f => f.name);
  return {
    disableCustomProperties: true,
    saveButtonText: 'Run',
    fields: [
      { id: 'inputFile', label: `Input File (${type})`, type: 'select', choices },
    ]
  };
};

export const ImportFormat = {
  title: '',
  fields: [
    { id: 'type', type: 'select', choices: ['debit', 'credit'] },
    { id: 'thisSide', type: 'account' },
    { id: 'otherSide', type: 'account' },
    { id: 'amount', type: 'monum' },
    { id: '$time', type: 'datetime' },
    { id: '$title', type: 'input' },
    { id: '$tags', type: 'array-of-string' },
  ],
  actions: [],
};
