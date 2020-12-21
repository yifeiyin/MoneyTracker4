import React from 'react';
import {
  IconButton,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import { Delete as DeleteIcon } from '@material-ui/icons'

import ObjectEditorField from './ObjectEditorField';

import Monum from '../newCore/monum';

import { sumOfAccountAndAmountList, debitsMinusCredits } from '../newCore/helpers'

export default function DebitsCreditsEditor(props) {
  // eslint-disable-next-line no-unused-vars
  const { id, value, label, propertyType, onChange, accountModalControl } = props;
  const [idForDebits, idForCredits] = id;
  const [labelForDebits, labelForCredits] = label || id;
  const [debits, credits] = value;

  const debitsTotalReadable = sumOfAccountAndAmountList(debits).toReadable();
  const creditsTotalReadable = sumOfAccountAndAmountList(credits).toReadable();

  const isBalanced = debitsMinusCredits(debits, credits).isZero();

  return (
    <div style={{ width: '100%', margin: '10px 0', padding: 15, borderRadius: 15, border: '1px solid #DDD' }}>
      <Alert severity={isBalanced ? 'success' : 'error'}>
        {isBalanced ? 'Balanced: ' + debitsTotalReadable : `Not balanced: ${debitsTotalReadable} -- ${creditsTotalReadable}`}
      </Alert>

      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
        <div style={{ marginRight: 5, flex: 1 }}>
          <Typography variant='h6' align='center'>Debits</Typography>
          <DebitCreditOneSide
            side={debits}
            label={labelForDebits}
            id={idForDebits}
            accountModalControl={accountModalControl}
            onChangeTarget={(index, newTarget) => { debits[index].acc = newTarget; onChange(debits, null); }}
            onChangeMonum={(index, newMonum) => { debits[index].amt = newMonum; onChange(debits, null); }}
            onAdd={(newTarget) => { debits.push({ acc: newTarget, amt: new Monum() }); onChange(debits, null); }}
            onRemove={(index) => { debits.splice(index, 1); onChange(debits, null); }}
          />
        </div>

        <div style={{ marginLeft: 5, flex: 1 }}>
          <Typography variant='h6' align='center'>Credits</Typography>
          <DebitCreditOneSide
            side={credits}
            label={labelForCredits}
            id={idForCredits}
            accountModalControl={accountModalControl}
            onChangeTarget={(index, newTarget) => { credits[index].acc = newTarget; onChange(null, credits); }}
            onChangeMonum={(index, newMonum) => { credits[index].amt = newMonum; onChange(null, credits); }}
            onAdd={(newTarget) => { credits.push({ acc: newTarget, amt: new Monum() }); onChange(null, credits); }}
            onRemove={(index) => { credits.splice(index, 1); onChange(null, credits); }}
          />
        </div>
      </div>
    </div>
  );
}

function DebitCreditOneSide(props) {
  // eslint-disable-next-line no-unused-vars
  const { side, label, id, accountModalControl, onChangeTarget, onChangeMonum, onAdd, onRemove } = props;
  return (
    <div>
      {
        side.map(({ acc, amt }, index) =>
          <div style={{ display: 'flex' }} key={id + index}>
            <span style={{ flex: 2 }}>
              <ObjectEditorField
                value={acc} type='account' accountModalControl={accountModalControl}
                onChange={(value) => onChangeTarget(index, value)}
              />
            </span>
            <span style={{ flex: 1 }}>
              <ObjectEditorField
                value={amt} type='monum'
                onChange={(value) => onChangeMonum(index, value)}
              />
            </span>
            <IconButton size='small' onClick={() => onRemove(index)}><DeleteIcon color="inherit" /></IconButton>
          </div>
        )
      }
      <div style={{ display: 'flex' }}>
        <span style={{ flex: 1 }}>
          <ObjectEditorField
            value={null} type='account' placeholder='Add New' accountModalControl={accountModalControl}
            onChange={(newTarget) => onAdd(newTarget)}
          />
        </span>
      </div>
    </div>
  );
}
