
const APP_CONFIG = window.GEMS_HIDDEN_CONFIG || {};
const BRAND_NAME = APP_CONFIG.brandName || 'Gems Hidden';
const AUTH_STORAGE_KEY = 'gems_hidden_user';
const NEWSLETTER_STORAGE_KEY = 'gems_hidden_newsletter';
const PENDING_PLAN_KEY = 'gems_hidden_pending_plan';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const titleCase = (value = '') => value.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());

function setBrandText() {
  document.title = document.title.replace(/gemshidden/gi, BRAND_NAME).replace(/Gems Hidden/gi, BRAND_NAME);
  $$('[data-brand-text]').forEach(n => n.textContent = BRAND_NAME);
  $$('[data-support-email]').forEach(n => n.textContent = APP_CONFIG.supportEmail || 'support@example.com');
  $$('[data-support-email-link]').forEach(n => {
    const email = APP_CONFIG.supportEmail || 'support@example.com';
    n.textContent = email;
    n.href = `mailto:${email}`;
  });
}
function getStoredUser(){ try { return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || null; } catch { return null; } }
function setStoredUser(user){ localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user)); }
function clearStoredUser(){ localStorage.removeItem(AUTH_STORAGE_KEY); }
function getDemoUsers(){ try { return JSON.parse(localStorage.getItem('gems_hidden_demo_users')) || []; } catch { return []; } }
function saveDemoUsers(users){ localStorage.setItem('gems_hidden_demo_users', JSON.stringify(users)); }
function initials(name=''){ return name.split(' ').filter(Boolean).slice(0,2).map(p => p[0]?.toUpperCase()).join('') || 'GH'; }
function isPlaceholderLink(url=''){ return !url || /REPLACE_WITH_YOUR_REAL/i.test(url); }
function authConfigured(){ const a = APP_CONFIG.auth || {}; return a.provider === 'supabase' && a.supabaseUrl && a.supabaseAnonKey && !/REPLACE_WITH_YOUR/i.test(a.supabaseUrl) && !/REPLACE_WITH_YOUR/i.test(a.supabaseAnonKey); }
function getSupabaseClient(){ if(!authConfigured() || !window.supabase?.createClient) return null; if(!window.__gemsHiddenSupabase){ window.__gemsHiddenSupabase = window.supabase.createClient(APP_CONFIG.auth.supabaseUrl, APP_CONFIG.auth.supabaseAnonKey); } return window.__gemsHiddenSupabase; }
async function getCurrentUser(){ const s = getSupabaseClient(); if(s){ const {data} = await s.auth.getUser(); const u = data?.user; if(u){ return { id:u.id, name:u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Member', email:u.email, createdAt:u.created_at, plan:localStorage.getItem(`gems_hidden_plan_${u.email}`) || 'No pass yet' }; } return null; } return getStoredUser(); }
async function syncAuthState(){ const user = await getCurrentUser(); if(user) setStoredUser(user); return user; }
function showAlert(target, message, type='success'){ if(!target) return; target.textContent = message; target.className = `alert ${type === 'error' ? 'error' : ''} show`; }
function injectHeaderState(user){
  $$('[data-header-actions]').forEach(target => { target.innerHTML = user ? `
    <div class="account-area" data-account-area>
      <button class="account-trigger" type="button" data-account-trigger aria-haspopup="true" aria-expanded="false" aria-label="Open account menu"><span class="avatar">${initials(user.name)}</span></button>
      <div class="account-menu" role="menu">
        <div class="account-top"><div class="avatar">${initials(user.name)}</div><div><div class="account-name">${user.name}</div><div class="account-email">${user.email}</div></div></div>
        <a class="menu-link" href="account.html">Your account</a>
        <a class="menu-link" href="courses.html">Browse passes</a>
        <button class="menu-btn" type="button" data-logout-btn>Sign out</button>
      </div>
    </div>` : `
    <a class="btn btn-ghost" href="signin.html">Sign in</a>
    <a class="btn btn-primary" href="signup.html">Sign up</a>`; });
  $$('[data-mobile-actions]').forEach(target => { target.innerHTML = user ? `<a href="account.html">Your account</a><button type="button" data-logout-btn>Sign out</button>` : `<a href="signin.html">Sign in</a><a href="signup.html">Sign up</a>`; });
}
function setupMobileMenu(){ const t=$('[data-mobile-toggle]'); const m=$('[data-mobile-menu]'); if(!t||!m) return; t.addEventListener('click',()=>{ const open=m.classList.toggle('open'); t.setAttribute('aria-expanded', String(open)); }); }
function setupAccountMenu(){ document.addEventListener('click',(event)=>{ const trigger=event.target.closest('[data-account-trigger]'); const area=event.target.closest('[data-account-area]'); $$('[data-account-area]').forEach(node=>{ if(area && node===area && trigger){ const open=!node.classList.contains('open'); node.classList.toggle('open', open); const button=$('[data-account-trigger]', node); if(button) button.setAttribute('aria-expanded', String(open)); } else if(!area){ node.classList.remove('open'); const button=$('[data-account-trigger]', node); if(button) button.setAttribute('aria-expanded','false'); } }); }); }
async function logoutUser(){ const s=getSupabaseClient(); clearStoredUser(); if(s) await s.auth.signOut(); window.location.href='index.html'; }
function setupLogout(){ document.addEventListener('click', async (event)=>{ const btn=event.target.closest('[data-logout-btn]'); if(!btn) return; await logoutUser(); }); }
async function signUpWithSupabase(name,email,password){ const s=getSupabaseClient(); const base=(APP_CONFIG.siteUrl||'').replace(/\/$/,''); const emailRedirectTo=base ? `${base}/account.html` : undefined; const {data,error}=await s.auth.signUp({email,password,options:{data:{full_name:name}, emailRedirectTo}}); if(error) throw error; if(data?.user) setStoredUser({name,email,createdAt:new Date().toISOString(),plan:'No pass yet'}); return data; }
async function signInWithSupabase(email,password){ const s=getSupabaseClient(); const {error}=await s.auth.signInWithPassword({email,password}); if(error) throw error; }
function signUpDemo(name,email,password){ const users=getDemoUsers(); if(users.some(u=>u.email===email)) throw new Error('That email already exists in demo mode. Sign in instead.'); const user={name,email,password,createdAt:new Date().toISOString(),plan:'No pass yet'}; users.push(user); saveDemoUsers(users); setStoredUser(user); }
function signInDemo(email,password){ const user=getDemoUsers().find(u=>u.email===email && u.password===password); if(!user) throw new Error('That email or password does not match a saved demo account.'); setStoredUser(user); }
function setupAuthForms(){
  const signUpForm=$('[data-signup-form]'); const signInForm=$('[data-signin-form]');
  if(signUpForm){ signUpForm.addEventListener('submit', async (event)=>{ event.preventDefault(); const name=$('[name="name"]', signUpForm).value.trim(); const email=$('[name="email"]', signUpForm).value.trim().toLowerCase(); const password=$('[name="password"]', signUpForm).value.trim(); const terms=$('[name="terms"]', signUpForm).checked; const alert=$('[data-form-alert]', signUpForm); if(!name || !email || password.length < 8 || !terms){ showAlert(alert, 'Enter your full name, a valid email, a password with at least 8 characters, and accept the terms.', 'error'); return; } try { if(getSupabaseClient()){ await signUpWithSupabase(name,email,password); showAlert(alert, 'Account created. Check your email to confirm your address if your auth settings require email verification.'); setTimeout(()=>{ window.location.href='account.html'; }, 900); } else { signUpDemo(name,email,password); window.location.href='account.html'; } } catch(error){ showAlert(alert, error.message || 'Unable to create your account right now.', 'error'); } }); }
  if(signInForm){ signInForm.addEventListener('submit', async (event)=>{ event.preventDefault(); const email=$('[name="email"]', signInForm).value.trim().toLowerCase(); const password=$('[name="password"]', signInForm).value.trim(); const alert=$('[data-form-alert]', signInForm); try { if(getSupabaseClient()){ await signInWithSupabase(email,password); } else { signInDemo(email,password); } window.location.href='account.html'; } catch(error){ showAlert(alert, error.message || 'Unable to sign you in right now.', 'error'); } }); }
}
async function protectAccountPage(){ const gate=$('[data-account-gate]'); if(!gate) return; const user=await syncAuthState(); if(!user){ window.location.href='signin.html'; return; } $$('[data-account-name]').forEach(el=>el.textContent=user.name); $$('[data-account-email]').forEach(el=>el.textContent=user.email); $$('[data-account-created]').forEach(el=>el.textContent=new Date(user.createdAt || Date.now()).toLocaleDateString()); $$('[data-account-plan]').forEach(el=>el.textContent=user.plan || 'No pass yet'); $$('[data-account-initials]').forEach(el=>el.textContent=initials(user.name)); }
function setupCheckoutButtons(){ $$('[data-plan]').forEach(button=>{ button.addEventListener('click', async (event)=>{ event.preventDefault(); const plan=button.getAttribute('data-plan'); const link=APP_CONFIG.stripePaymentLinks?.[plan]; const user=await syncAuthState(); if(!user){ localStorage.setItem(PENDING_PLAN_KEY, plan); window.location.href='signup.html'; return; } if(isPlaceholderLink(link)){ alert(`Add your real Stripe checkout link for the ${titleCase(plan)} Pass in config.js before going live.`); return; } const planName=`${titleCase(plan)} Pass`; localStorage.setItem(`gems_hidden_plan_${user.email}`, planName); setStoredUser({...user, plan:planName}); window.location.href=link; }); }); }
function setupPendingPlanMessage(){ const pending=localStorage.getItem(PENDING_PLAN_KEY); const note=$('[data-pending-plan]'); if(!pending || !note) return; note.innerHTML=`<strong>${titleCase(pending)} Pass</strong> is waiting. Create your account and you can continue straight to checkout.`; note.style.display='block'; }
function setupNewsletterForm(){ const form=$('[data-news-form]'); if(!form) return; form.addEventListener('submit',(event)=>{ event.preventDefault(); const email=$('[type="email"]', form).value.trim().toLowerCase(); const alert=$('[data-news-alert]'); if(!email || !email.includes('@')){ showAlert(alert,'Enter a valid email address to join the list.','error'); return; } const signups=JSON.parse(localStorage.getItem(NEWSLETTER_STORAGE_KEY) || '[]'); signups.push({email,date:new Date().toISOString()}); localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(signups)); form.reset(); showAlert(alert,'Saved. Replace the demo newsletter logic with your real email platform when you are ready.'); }); }
function setupContactForm(){ const form=$('[data-support-form]'); if(!form) return; form.addEventListener('submit',(event)=>{ event.preventDefault(); const alert=$('[data-form-alert]', form); const name=$('[name="name"]', form)?.value.trim() || ''; const email=$('[name="email"]', form)?.value.trim() || ''; const subject=encodeURIComponent(`Website inquiry from ${name || 'visitor'}`); const body=encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${$('[name="message"]', form)?.value.trim() || ''}`); form.reset(); showAlert(alert,'Thanks. This form is still a frontend handoff. It opened your support email route so you can wire it to your real inbox or form service.'); if(APP_CONFIG.supportEmail && !/YOUR-DOMAIN/i.test(APP_CONFIG.supportEmail)){ window.location.href=`mailto:${APP_CONFIG.supportEmail}?subject=${subject}&body=${body}`; } }); }
function decorateAuthMode(){ const badge=$('[data-auth-mode]'); if(!badge) return; badge.textContent=getSupabaseClient() ? 'Live auth enabled' : 'Demo auth fallback'; }
async function init(){ setBrandText(); decorateAuthMode(); const user=await syncAuthState(); injectHeaderState(user); setupMobileMenu(); setupAccountMenu(); setupLogout(); setupAuthForms(); setupCheckoutButtons(); setupPendingPlanMessage(); setupNewsletterForm(); setupContactForm(); await protectAccountPage(); }
document.addEventListener('DOMContentLoaded', init);
