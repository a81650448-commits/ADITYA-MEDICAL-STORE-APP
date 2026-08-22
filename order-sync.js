// App-only order status synchronisation. The existing Admin Panel is not modified.
const ADITYA_STATUS_KEY='aditya_order_status_cache';
const ADITYA_STATUS_MESSAGES={Pending:'Order received and waiting for confirmation.',Confirmed:'Your order has been confirmed.',Packed:'Your medicines have been packed.', 'Out for Delivery':'Your order is out for delivery.',Delivered:'Your order has been delivered.',Cancelled:'Your order has been cancelled.'};
function statusKey(id){return ADITYA_STATUS_KEY+'_'+id}
async function getOrderStatus(orderId){const {data,error}=await db.from('orders').select('order_id,status,total,created_at').eq('order_id',orderId).maybeSingle();if(error)throw error;return data}
async function syncOrderStatus(orderId){const order=await getOrderStatus(orderId);if(!order)return null;const key=statusKey(orderId),old=localStorage.getItem(key);if(old&&old!==order.status&&window.AdityaNotifications){AdityaNotifications.save('Order '+order.status,ADITYA_STATUS_MESSAGES[order.status]||('Your order is now '+order.status+'.'),orderId)}localStorage.setItem(key,order.status);return order}
async function watchOrderStatus(orderId,interval=30000,onChange){let previous=null;const check=async()=>{try{const o=await syncOrderStatus(orderId);if(o&&o.status!==previous){previous=o.status;if(onChange)onChange(o)}}catch(e){console.warn('Order status check failed',e)}};await check();return setInterval(check,Math.max(10000,interval))}
window.AdityaOrderSync={get:syncOrderStatus,watch:watchOrderStatus};
