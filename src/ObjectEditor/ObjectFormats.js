export const AccountEditFormat = {
    title: 'Account $name ($id)',
    fields: [
        { id: 'id', type: 'input', propertyType: 'immutable' },
        { id: 'name', type: 'input' },
        { id: 'parentId', type: 'account' },
        { id: 'isFolder', type: 'boolean', propertyType: 'immutable' },
        { id: 'accountType', type: 'select', choices: ['debit', 'credit'], propertyType: 'immutable' },
        { id: 'description', type: 'multiline' },
    ]
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
    ]
};

export const TransactionCreateFormat = {
    ...TransactionEditFormat,
    fields: TransactionEditFormat.fields.filter(o => o.id !== 'id'),
    title: 'Creating Transaction',
};

