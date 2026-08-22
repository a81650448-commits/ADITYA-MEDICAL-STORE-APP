// UPI payment helper. This does not process or verify payments server-side.
const ADITYA_UPI_ID = '7007596728@ptyes';
const ADITYA_PAYMENT_NAME = 'Aditya Medical Store';
function buildUpiUrl(amount, orderId){const params=new URLSearchParams({pa:ADITYA_UPI_ID,pn:ADITYA_PAYMENT_NAME,am:Number(amount||0).toFixed(2),cu:'INR',tn:'Order '+orderId});return 'upi://pay?'+params.toString()}
function payWithUpi(amount,orderId){window.location.href=buildUpiUrl(amount,orderId)}
window.AdityaUPI={upiId:ADITYA_UPI_ID,buildUrl:buildUpiUrl,pay:payWithUpi};
