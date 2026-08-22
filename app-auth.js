// Standalone customer-auth layer for the Aditya Medical Store app.
// It is intentionally kept in this separate repository.
const APP_SUPABASE_URL = "https://fdqgknsevrvejptxeiyn.supabase.co";
const APP_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmZHFna25zZXZydmVqcHR4ZWl5biIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg3MTA1NDE1LCJleHAiOjIxMDI2ODE0MTV9.jAdhngvutaGra7mMS5gR9FJSNHwli2ST5TNHDGTNRCE";
let appDb = null;
function getAppDb(){ if(!window.supabase) throw new Error('Supabase library is not loaded.'); if(!appDb) appDb=window.supabase.createClient(APP_SUPABASE_URL,APP_SUPABASE_ANON_KEY); return appDb; }
async function appSignup(name,phone,email,password){const {data,error}=await getAppDb().auth.signUp({email,password,options:{data:{full_name:name,phone}}});if(error)throw error;return data;}
async function appLogin(email,password){const {data,error}=await getAppDb().auth.signInWithPassword({email,password});if(error)throw error;return data;}
async function appLogout(){const {error}=await getAppDb().auth.signOut();if(error)throw error;}
async function appSession(){return (await getAppDb().auth.getSession()).data.session;}
async function appMyOrders(){const session=await appSession();if(!session)return [];const {data,error}=await getAppDb().from('orders').select('order_id,customer_name,phone,address,payment_method,total,status,created_at,items').eq('phone',session.user.user_metadata?.phone||'').order('created_at',{ascending:false});if(error)throw error;return data||[];}
window.AdityaAppAuth={signup:appSignup,login:appLogin,logout:appLogout,session:appSession,myOrders:appMyOrders};
