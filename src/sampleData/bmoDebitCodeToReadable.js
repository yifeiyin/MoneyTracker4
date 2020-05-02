const s = `AD,Adjustment
MB,Multi-Branch Banking
BC,Bill Payment Cancelled
MP,International Merchant Point of Sale Purchase
CB,Cheque Posted by Branch
MR,International Merchant Point of Sale Refund
CC,Certified Cheque
NR,Non-Resident Tax
CD,Customer Deposit
NS,Cheque Returned NSF,CK,Cheque
NT,Nesbitt Burns Entry
CM,Credit Memo
OL,Online Debit Purchase
CW,Telephone/Online banking
OM,Other Automated Banking Machine
DC,Other Charge
OP,Telephone, Mail, Online or Recurring Payment Purchase
DD,Direct Deposit/Pre-authorized Debit
OR,Telephone, Mail, Online or Recurring Payment Refund
DM,Debit Memo
OV,Online Debit Refund
DN,Not Service chargeable
PR,Purchase at Merchant
DR,Overdraft
RC,NSF Charge
DS,Service chargeable
RN,Merchandise Return
EC,Error Correction
RT,Returned Item
FX,Foreign Exchange
RV,Merchant Reversal
GS,Tax
SC,Service Charge
IB,BMO ATM
SO,Standing Order
IN,Interest
ST,Merchant Deposit
LI,Loan Interest
TF,Transfer of Funds
LN,Loan Payment
TX,Tax
LP,Loan Advance
WD,Withdrawal
LT,Large Volume Account List Total`

let a = {};
s.split('\n').map(line => line.split(',')).forEach(([key, value]) => a[key] = value)
export default a;