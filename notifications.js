// Client-side notification foundation. Actual push delivery requires a push provider/service worker subscription.
const ADITYA_NOTIFICATION_KEY='aditya_notifications';
function saveAppNotification(title,body,orderId){const list=JSON.parse(localStorage.getItem(ADITYA_NOTIFICATION_KEY)||'[]');list.unshift({title,body,orderId,createdAt:new Date().toISOString(),read:false});localStorage.setItem(ADITYA_NOTIFICATION_KEY,JSON.stringify(list.slice(0,50)));if('Notification' in window&&Notification.permission==='granted')new Notification(title,{body,tag:orderId||title})}
async function enableAppNotifications(){if(!('Notification' in window))return 'unsupported';const p=await Notification.requestPermission();return p}
function getAppNotifications(){return JSON.parse(localStorage.getItem(ADITYA_NOTIFICATION_KEY)||'[]')}
function markAppNotificationsRead(){const list=getAppNotifications().map(x=>({...x,read:true}));localStorage.setItem(ADITYA_NOTIFICATION_KEY,JSON.stringify(list))}
window.AdityaNotifications={enable:enableAppNotifications,save:saveAppNotification,list:getAppNotifications,markRead:markAppNotificationsRead};
