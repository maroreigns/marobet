/*************************************
     * IMPORTANT PLACEHOLDERS - EDIT HERE
     *
     * Replace OWNER_WHATSAPP_NUMBER with your WhatsApp number in international format (no plus sign).
     * Example for a Nigerian number: "2348012345678"
     *
     * NOTE: The account details below are intentionally set to the values you requested:
     * Account number: 7066290939
     * Account name: Obaro Maro
     * Bank/provider: Opay
     *
     *************************************/
    const OWNER_WHATSAPP_NUMBER = "2347066290939"; // <-- REPLACE with your WhatsApp number (international format, no +)
    const ACCOUNT_NUMBER = "7066290939"; // change if needed
    const ACCOUNT_NAME = "Obaro Maro";
    const ACCOUNT_BANK = "Opay";
    const PAYMENT_AMOUNT = 500; // integer, for display only (₦)
    const PAYMENT_TTL_HOURS = 24; // how long 'paid' stays active in localStorage

    // Utility: DOM
    const menuBtn = document.getElementById('menuBtn');
    const menuPop = document.getElementById('menuPop');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalPlatform = document.getElementById('modalPlatform');
    const accNumberEl = document.getElementById('accNumber');
    const accNameEl = document.getElementById('accName');
    const accBankEl = document.getElementById('accBank');
    const copyAccBtn = document.getElementById('copyAcc');
    const copyFullBtn = document.getElementById('copyFull');
    const paidCheckbox = document.getElementById('paidCheckbox');
    const getCodeBtn = document.getElementById('getCodeBtn');
    const txRefInput = document.getElementById('txRef');
    const modalClose = document.getElementById('modalClose');
    const heroGet = document.getElementById('heroGet');
    const howBtn = document.getElementById('howBtn');
    const waContact = document.getElementById('waContact');
    const toast = document.getElementById('toast');
    const thisYear = document.getElementById('thisYear');

    // set account info
    accNumberEl.textContent = ACCOUNT_NUMBER;
    accNameEl.textContent = ACCOUNT_NAME;
    accBankEl.textContent = ACCOUNT_BANK;

    // fill year
    thisYear.textContent = new Date().getFullYear();

    // Menu toggle
    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!expanded));
      if (!expanded) {
        menuPop.style.display = 'block';
        menuPop.setAttribute('aria-hidden','false');
      } else {
        menuPop.style.display = 'none';
        menuPop.setAttribute('aria-hidden','true');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !menuPop.contains(e.target)) {
        menuPop.style.display = 'none';
        menuPop.setAttribute('aria-hidden','true');
        menuBtn.setAttribute('aria-expanded','false');
      }
    });

    // Platform buttons
    document.querySelectorAll('[data-action="pay"]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const platform = btn.dataset.platform || 'Platform';
        openPaymentModal(platform);
      });
    });

    // hero get -> open default modal (choose Sportybet by default)
    heroGet.addEventListener('click', ()=> openPaymentModal('Sportybet'));
    howBtn.addEventListener('click', ()=> document.getElementById('how').scrollIntoView({behavior:'smooth'}));

    // WhatsApp contact (sidebar)
    waContact.addEventListener('click', ()=>{
      // Pre-fill a simple greeting message
      const pre = `Hello! I'm interested in daily booking codes. Please send me instructions.`;
      const url = buildWhatsAppUrl(pre);
      window.open(url, '_blank');
    });

    // Modal open/close functions
    function openPaymentModal(platform){
      modalPlatform.textContent = platform;
      modalBackdrop.style.display = 'flex';
      modalBackdrop.setAttribute('aria-hidden','false');
      setTimeout(()=> {
        modalBackdrop.querySelector('.modal').classList.add('open');
      },20);

      // Restore paid status for platform if exists
      const paidKey = paidLocalKey(platform);
      const paidObj = readPaid(paidKey);
      if(paidObj && (Date.now() - paidObj.timestamp) < PAYMENT_TTL_HOURS*3600*1000){
        paidCheckbox.checked = true;
        enableGetCode();
      } else {
        paidCheckbox.checked = false;
        disableGetCode();
      }
    }

    function closePaymentModal(){
      modalBackdrop.querySelector('.modal').classList.remove('open');
      setTimeout(()=> {
        modalBackdrop.style.display = 'none';
        modalBackdrop.setAttribute('aria-hidden','true');
        // clear tx ref and checkbox
        txRefInput.value = '';
      },220);
    }

    modalClose.addEventListener('click', closePaymentModal);
    modalBackdrop.addEventListener('click', (e)=>{
      if(e.target === modalBackdrop) closePaymentModal();
    });

    // Copy functions
    async function copyText(text){
      try{
        if(navigator.clipboard && navigator.clipboard.writeText){
          await navigator.clipboard.writeText(text);
        } else {
          // fallback
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        showToast('Copied to clipboard');
      } catch(err){
        showToast('Unable to copy. Please copy manually.');
      }
    }

    copyAccBtn.addEventListener('click', ()=>{
      copyText(ACCOUNT_NUMBER);
    });

    copyFullBtn.addEventListener('click', ()=>{
      const full = `Please pay ₦${PAYMENT_AMOUNT} to account number ${ACCOUNT_NUMBER}, Account Name: ${ACCOUNT_NAME}, Bank/Provider: ${ACCOUNT_BANK}`;
      copyText(full);
    });

    // Paid checkbox -> enable Get Booking Code
    paidCheckbox.addEventListener('change', ()=>{
      const platform = modalPlatform.textContent || 'Platform';
      const key = paidLocalKey(platform);
      if(paidCheckbox.checked){
        // store local status
        writePaid(key, {timestamp: Date.now()});
        enableGetCode();
      } else {
        localStorage.removeItem(key);
        disableGetCode();
      }
    });

    function enableGetCode(){
      getCodeBtn.classList.remove('disabled');
      getCodeBtn.removeAttribute('aria-disabled');
      getCodeBtn.disabled = false;
      getCodeBtn.style.pointerEvents = 'auto';
    }
    function disableGetCode(){
      getCodeBtn.classList.add('disabled');
      getCodeBtn.setAttribute('aria-disabled','true');
      getCodeBtn.disabled = true;
      getCodeBtn.style.pointerEvents = 'none';
    }

    // Get Booking Code -> open whatsapp with prefilled message including txRef
    getCodeBtn.addEventListener('click', ()=>{
      if(getCodeBtn.classList.contains('disabled')) return;
      const platform = modalPlatform.textContent || 'Platform';
      const tx = txRefInput.value ? ` Transaction/Note: ${txRefInput.value}` : '';
      const msg = `I've paid ₦${PAYMENT_AMOUNT} for booking code on ${platform}.${tx} Please send my booking code. Account used: ${ACCOUNT_NUMBER} (${ACCOUNT_NAME} - ${ACCOUNT_BANK})`;
      const url = buildWhatsAppUrl(msg);
      // open WA
      window.open(url, '_blank');

      showToast('WhatsApp opened. Please send the message to complete.');
      // optionally keep modal open - choose to close modal for clarity
      setTimeout(closePaymentModal, 600);
    });

    // Build wa.me link with url encoded message
    function buildWhatsAppUrl(message){
      const base = `https://wa.me/${encodeURIComponent(OWNER_WHATSAPP_NUMBER)}`;
      const params = `?text=${encodeURIComponent(message)}`;
      return base + params;
    }

    // LocalStorage helpers for 'paid' status
    function paidLocalKey(platform){
      return `marobet_paid_${platform.replace(/\s+/g,'_')}`;
    }
    function writePaid(key, obj){
      localStorage.setItem(key, JSON.stringify(obj));
    }
    function readPaid(key){
      try{
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : null;
      }catch(e){ return null; }
    }

    // small toast
    let toastTimer = null;
    function showToast(msg, ms=2500){
      clearTimeout(toastTimer);
      toast.textContent = msg;
      toast.style.display = 'block';
      toast.style.opacity = '1';
      toastTimer = setTimeout(()=> {
        toast.style.display = 'none';
      }, ms);
    }

    // FAQ accordion behaviour
    document.querySelectorAll('.faq-item').forEach(item=>{
      const btn = item.querySelector('button');
      const ans = item.querySelector('.answer');
      btn.addEventListener('click', ()=>{
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        if(!expanded){
          ans.style.display = 'block';
        } else {
          ans.style.display = 'none';
        }
      });
    });

    // Close modal on Esc
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape'){
        // close menu if open
        menuPop.style.display = 'none';
        menuPop.setAttribute('aria-hidden','true');
        menuBtn.setAttribute('aria-expanded','false');

        if(modalBackdrop.style.display === 'flex'){
          closePaymentModal();
        }
      }
    });

    // init: set WA contact link href (works even if placeholder - opens with greeting)
    (function initWA(){
      const greeting = `Hello! I'm interested in daily booking codes.`;
      const waUrl = buildWhatsAppUrl(greeting);
      waContact.setAttribute('aria-label', 'Contact Marobet on WhatsApp');
      // if using <a> instead of button, could set href; here we'll open in JS
      // also set hero button to open Sportybet modal (already wired)
    })();

    // Accessibility: trap focus inside modal when opened (lightweight)
    document.addEventListener('focus', function(e){
      if(modalBackdrop.style.display === 'flex' && !modalBackdrop.contains(e.target)){
        // move focus to first focusable inside modal
        const first = modalBackdrop.querySelector('button, [href], input, textarea, select');
        if(first) first.focus();
      }
    }, true);

    // Optional: read paid items and clean up expired ones on load
    (function cleanupPaid(){
      Object.keys(localStorage).forEach(k=>{
        if(k.startsWith('marobet_paid_')){
          try{
            const obj = JSON.parse(localStorage.getItem(k));
            if(!obj || !obj.timestamp) { localStorage.removeItem(k); return; }
            if((Date.now() - obj.timestamp) > PAYMENT_TTL_HOURS*3600*1000) localStorage.removeItem(k);
          }catch(e){ localStorage.removeItem(k); }
        }
      });
    })();

    // Small enhancement: clicking outside platform cards will close menu
    document.addEventListener('scroll', ()=>{
      menuPop.style.display = 'none';
      menuPop.setAttribute('aria-hidden','true');
      menuBtn.setAttribute('aria-expanded','false');
    });

    /***********************
     * Additional small UX:
     * When user clicks any "Get Payment Details", pre-check localStorage to keep their paid state if present.
     ***********************/
    // For initial load ensure getCodeBtn disabled
    disableGetCode();


  const lockerCodes = {
    SportyBet: "SPX92JD",
    Bet9ja: "9JX4F8T",
    "1xBet": "1X88PGQ"
  };

  document.querySelectorAll(".premium-locker-btn").forEach(button => {
    button.addEventListener("click", () => {
      const platform = button.dataset.platform;
      const confirmPay = confirm(
        `Please pay ₦1000 to this account:\n\nAccount Name: Obaro Maro\nAccount No: 7066290939\nBank: Opay\n\nAfter payment, click OK to get your ${platform} code via WhatsApp.`
      );

      if (confirmPay) {
        const card = button.closest(".premium-locker-card");
        const codeEl = card.querySelector(".premium-locker-code");

        // Reveal booking code
        codeEl.style.color = "#111";
        codeEl.style.background = "none";
        codeEl.textContent = lockerCodes[platform];

        // Turn button into WhatsApp button
        button.textContent = "Get Code on WhatsApp";
        button.style.background = "#25D366";
        button.onclick = () => {
          const msg = encodeURIComponent(
            `Hello! I have paid ₦1000 for today's ${platform} premium booking code.`
          );
          window.open(`https://wa.me/2347066290939?text=${msg}`, "_blank");
        };
      }
    });
  });


    