import React from 'react';
import {
  IconButton,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import { Delete as DeleteIcon } from '@material-ui/icons'

import ObjectEditorField from './ObjectEditorField';


export default function DebitsCreditsEditor(props) {
  const { id, value, label, propertyType, onChange, accountModalControl } = props;
  const [idForDebits, idForCredits] = id;
  const [labelForDebits, labelForCredits] = label || id;
  const [debits, credits] = value;
  const length = Math.max(debits.length, credits.length) + 1;

  const debitTotal = global.Monum.combine(...debits.map(v => v[1]));
  const creditTotal = global.Monum.combine(...credits.map(v => v[1]));

  const debitsTotalReadable = debitTotal.toString();
  const creditsTotalReadable = creditTotal.toString();

  const isBalanced = debitTotal.sub(creditTotal).isZero();

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
        <div style={{ marginRight: 5, flex: 1 }}>
          <Typography variant='h6' align='center'>{`Debits (${debitsTotalReadable})`}</Typography>
          <DebitCreditOneSide
            side={debits}
            label={labelForDebits}
            id={idForDebits}
            accountModalControl={accountModalControl}
            onChangeTarget={(index, newTarget) => { debits[index][0] = newTarget; onChange(debits, null); }}
            onChangeMonum={(index, newMonum) => { debits[index][1] = newMonum; onChange(debits, null); }}
            onAdd={(newTarget) => { debits.push([newTarget, new global.Monum()]); onChange(debits, null); }}
            onRemove={(index) => { debits.splice(index, 1); onChange(debits, null); }}
          />
        </div>

        <div style={{ marginLeft: 5, flex: 1 }}>
          <Typography variant='h6' align='center'>{`Credits (${creditsTotalReadable})`}</Typography>
          <DebitCreditOneSide
            side={credits}
            label={labelForCredits}
            id={idForCredits}
            accountModalControl={accountModalControl}
            onChangeTarget={(index, newTarget) => { credits[index][0] = newTarget; onChange(null, credits); }}
            onChangeMonum={(index, newMonum) => { credits[index][1] = newMonum; onChange(null, credits); }}
            onAdd={(newTarget) => { credits.push([newTarget, new global.Monum()]); onChange(null, credits); }}
            onRemove={(index) => { credits.splice(index, 1); onChange(null, credits); }}
          />
        </div>
      </div>
      <Alert style={{ width: '100%' }} severity={isBalanced ? 'success' : 'error'}>{isBalanced ? 'Balanced' : 'Not balanced'}</Alert>
    </>
  );
}

function DebitCreditOneSide(props) {
  const { side, label, id, accountModalControl, onChangeTarget, onChangeMonum, onAdd, onRemove } = props;
  return (
    <div>
      {
        side.map(([targetAcc, monum], index) =>
          <div style={{ display: 'flex' }} key={id + index}>
            <span style={{ flex: 2 }}>
              <ObjectEditorField
                value={targetAcc} type='account' label={label + index} accountModalControl={accountModalControl}
                onChange={(value) => onChangeTarget(index, value)}
              />
            </span>
            <span style={{ flex: 1 }}>
              <ObjectEditorField
                value={monum} type='monum' label={label + index}
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
            value={null} type='account' label={label + ' New'} accountModalControl={accountModalControl}
            onChange={(newTarget) => onAdd(newTarget)}
          />
        </span>
      </div>
    </div>
  );
}
