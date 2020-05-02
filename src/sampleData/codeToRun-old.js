function transform(file, Monum, accountsNameToId, console) {    // ==== start ====

  const lines = file.split('\n');
  const importBatch = lines[6].match(/\d+/)[0];

  let results = [];
  for (let line of lines.splice(12)) {
    if (line.trim() === '') continue;

    const [accountNo, crDr, date, amount, desc] = line.split(',');
    if (!accountNo.includes('0031')) console.warn('Card number is different');

    let importId = results.length;
    let title, time, credits, debits, description;
    time = new Date(date.substr(0, 4), date.substr(4, 2), date.substr(6, 2));

    description = desc.replace(/\s{2,}/g, ' ');
    if (desc.includes('ETRNSFR AD RECVD'))
      title = 'eTransfer from ' +
        desc.substr(
          desc.indexOf('AD RECVD ') + 'AD RECVD '.length, 15
        ).trim().toLowerCase();

    else if (desc.includes('ETRNSFR SENT'))
      title = 'eTransfer to   ' +
        desc.substr(
          desc.indexOf('ETRNSFR SENT ') + 'ETRNSFR SENT '.length, 15
        ).trim().toLowerCase();

    else
      title = description.substr(0, 8);

    let amountTmp = new Monum('CAD', amount.replace(/-/, ''));
    let side1 = [accountsNameToId['BMO Chequeing'], amountTmp];
    let side2 = [accountsNameToId['Housing Expense'], amountTmp];

    if (crDr === 'CREDIT') {
      credits = [side1];
      debits = [side2];
    } else {
      debits = [side1];
      credits = [side2];
    }

    results.push({ title, time, credits, debits, description, importBatch, importId });
  }

  return results;
  // return [{ title, time, credits, debits, description,
  //  importBatch, importId }];


}    // ==== end ====