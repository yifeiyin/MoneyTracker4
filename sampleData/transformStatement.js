
// Transform Statement
// Created on 5/1/2020, 8:56:22 PM

function TransformStatement(inputs, utils) { // ==== start ====
    const [originalStatement] = inputs;
    const { console, Monum, accountNameToId, $DR, $CR } = utils;

    const lines = originalStatement.split('\n');
    const importBatch = lines[6].match(/\d+/)[0];

    let result = [];
    for (let line of lines.splice(12)) {
        if (line.trim() === '') continue;

        const [accountNo, crDr, date, amount0, desc] = line.split(',');
        if (!accountNo.includes('0031717')) console.warn('Card number is different');

        const type = crDr === 'DEBIT' ? $DR : $CR;
        const time = new Date(date.substr(0, 4), date.substr(4, 2), date.substr(6, 2));
        const amount = amount0.replace(/\s{2,}/g, ' ');
        const rawDescription = desc;

        result.push({
            type, time, amount, rawDescription,
        });
    }
    return result;

} // ==== end ====




