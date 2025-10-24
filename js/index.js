    // enforce immutable leading '@', max 10 chars, alphanumeric only, lowercase
    (function(){
      const el = document.getElementById('usernameInput');
      if (!el) return;
      const MAX = 10;

      // ensure maxlength attribute present (1 for '@' + MAX)
      el.setAttribute('maxlength', String(MAX + 1));

      function cleanCore(s) {
        return (s || '').replace(/@/g, '').replace(/[^a-zA-Z0-9]/g, '').slice(0, MAX).toLowerCase();
      }
      function setCoreAndCaret(core, caretPos) {
        el.value = '@' + core;
        try { el.setSelectionRange(caretPos, caretPos); } catch (_) {}
      }

      // block any deletion that would remove the leading '@'
      el.addEventListener('beforeinput', (ev) => {
        if (!ev.inputType) return;
        // block deletions that affect the leading '@'
        if (ev.inputType.startsWith('delete')) {
          const s = el.selectionStart || 0;
          const e = el.selectionEnd || 0;
          // if selection includes the first character or caret is right after '@' trying to delete
          if (s < 1 || (s === 1 && e === 1)) {
            ev.preventDefault();
            return;
          }
          return; // allow other deletes
        }

        // allow undo/redo
        if (ev.inputType === 'historyUndo' || ev.inputType === 'historyRedo') return;

        const core = el.value.slice(1);
        const selStart = el.selectionStart || 1;
        const selEnd = el.selectionEnd || 1;
        const replacing = Math.max(0, selEnd - selStart);
        const available = MAX - (core.length - replacing);
        if (available <= 0 && !ev.inputType.startsWith('delete')) {
          ev.preventDefault();
          return;
        }

        // handle paste/drop explicitly
        if (ev.inputType === 'insertFromPaste' || ev.inputType === 'insertFromDrop') {
          ev.preventDefault();
          const paste = (ev.clipboardData || window.clipboardData)?.getData('text') || '';
          const cleaned = paste.replace(/@/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, available);
          const before = core.slice(0, selStart - 1);
          const after = core.slice(selEnd - 1);
          const newCore = (before + cleaned + after).slice(0, MAX);
          setCoreAndCaret(newCore, 1 + before.length + cleaned.length);
          return;
        }

        // insertText (typing) - ensure character(s) are allowed and fit
        if (ev.inputType === 'insertText') {
          const data = ev.data || '';
          const cleaned = data.replace(/@/g, '').replace(/[^a-zA-Z0-9]/g, '');
          if (!cleaned) {
            ev.preventDefault();
            return;
          }
          if (cleaned.length > available) {
            ev.preventDefault();
            const allowed = cleaned.slice(0, available);
            const before = core.slice(0, selStart - 1);
            const after = core.slice(selEnd - 1);
            const newCore = (before + allowed + after).slice(0, MAX);
            setCoreAndCaret(newCore, 1 + before.length + allowed.length);
            return;
          }
          // otherwise allow (will be sanitized on input)
        }
      });

      // extra keydown guard for Backspace/Delete/Home
      el.addEventListener('keydown', (ev) => {
        const s = el.selectionStart || 0;
        const e = el.selectionEnd || 0;
        if (ev.key === 'Backspace') {
          // caret right after '@' or selection includes '@'
          if (s <= 1) {
            ev.preventDefault();
            return;
          }
        }
        if (ev.key === 'Delete') {
          if (s < 1) {
            ev.preventDefault();
            return;
          }
        }
        if (ev.key === 'Home') {
          ev.preventDefault();
          setTimeout(()=> el.setSelectionRange(1,1),0);
        }
      });

      // sanitize on input (ensures lowercase/alnum and truncation) and keep caret >=1
      el.addEventListener('input', () => {
        const prevPos = el.selectionStart || 1;
        const core = cleanCore(el.value);
        el.value = '@' + core;
        const pos = Math.max(1, Math.min(prevPos, core.length + 1));
        try { el.setSelectionRange(pos, pos); } catch (_) {}
      });

      // robust paste handler (fallback)
      el.addEventListener('paste', (ev) => {
        ev.preventDefault();
        const paste = (ev.clipboardData || window.clipboardData).getData('text') || '';
        const core = el.value.slice(1);
        const selStart = Math.max(1, el.selectionStart || 1);
        const selEnd = Math.max(1, el.selectionEnd || 1);
        const before = core.slice(0, selStart - 1);
        const after = core.slice(selEnd - 1);
        const cleaned = paste.replace(/@/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, MAX - (before.length + after.length));
        const newCore = (before + cleaned + after).slice(0, MAX);
        el.value = '@' + newCore;
        const caretPos = 1 + before.length + cleaned.length;
        try { el.setSelectionRange(Math.min(caretPos, newCore.length + 1), Math.min(caretPos, newCore.length + 1)); } catch(_) {}
      });

      // focus/click guard to keep caret after '@'
      function ensureCaret() { try { if ((el.selectionStart || 0) < 1) el.setSelectionRange(1,1); } catch(_) {} }
      el.addEventListener('focus', () => setTimeout(ensureCaret, 0));
      el.addEventListener('click', () => setTimeout(ensureCaret, 0));

      // initialize sanitized value
      el.value = '@' + cleanCore(el.value);
    })();
     (function(){
       const dob = document.getElementById('dobInput');
       const btn = document.getElementById('dobTrigger');
       if (!dob || !btn) return;
       btn.addEventListener('click', (e) => {
         e.preventDefault();
         // prefer showPicker if supported (Chrome/Edge)
         if (typeof dob.showPicker === 'function') {
           dob.showPicker();
           return;
         }
         // fallback: focus + try click to open picker on older browsers
         dob.focus();
         try { dob.click(); } catch (err) {}
       });
       // optional: keep a formatted visible text somewhere — the input value updates automatically
       dob.addEventListener('change', () => {
         // dob.value is updated (YYYY-MM-DD). If you want formatted display, add code here.
         // Example: console.log('DOB selected:', dob.value);
       });
     })();
     (function(){
      const openBtn = document.getElementById('changePasswordBtn');
      const modal = document.getElementById('passwordModal');
      const cancel = document.getElementById('pwdCancel');
      const form = document.getElementById('pwdForm');
      const pwdPreview = document.getElementById('passwordPreview');

      // mask: keep first 2 chars and last 1 char, mask middle with '*' (at least 1)
      function maskPasswordForPreview(pw) {
        const s = String(pw || '');
        if (s.length === 0) return '';
        if (s.length <= 3) {
          // show first char(s) and mask remaining except last
          if (s.length === 1) return '*';
          if (s.length === 2) return s[0] + '*';
          return s[0] + '*' + s[2];
        }
        const first = s.slice(0,2);
        const last = s.slice(-1);
        const middleCount = Math.max(1, s.length - 3);
        return first + '*'.repeat(middleCount) + last;
      }

      // initialize preview (if current value is plaintext)
      if (pwdPreview) {
        const cur = pwdPreview.value || '';
        pwdPreview.value = cur.includes('*') ? cur : maskPasswordForPreview(cur);
        pwdPreview.setAttribute('readonly','true');
      }

      function openModal(){
        if (!modal) return;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden','false');
        setTimeout(()=> {
          const f = document.getElementById('oldPwd');
          if (f) f.focus();
        }, 50);
      }
      function closeModal(){
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden','true');
        if (form) form.reset();
      }

      openBtn && openBtn.addEventListener('click', openModal);
      cancel && cancel.addEventListener('click', closeModal);
      modal && modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

      form && form.addEventListener('submit', (e) => {
        e.preventDefault();
        const oldV = document.getElementById('oldPwd').value || '';
        const newV = document.getElementById('newPwd').value || '';
        const conf = document.getElementById('confirmPwd').value || '';
        if (newV.length < 8) return alert('New password harus minimal 8 karakter.');
        if (newV !== conf) return alert('Konfirmasi password tidak cocok.');
        // call backend here (omitted)
        alert('Password berhasil diubah.');
        if (pwdPreview) pwdPreview.value = maskPasswordForPreview(newV);
        closeModal();
      });
     })();

     const el = document.getElementById('phoneInput');
  const prefix = '+62 ';

  function formatNumber(num) {
    // hapus karakter non-digit
    num = num.replace(/\D/g, '');
    // pisahkan tiap 3 digit dengan '-'
    return num.replace(/(\d{3})(?=\d)/g, '$1-').replace(/-$/, '');
  }

  el.addEventListener('input', () => {
    // jaga prefix agar tetap ada
    if (!el.value.startsWith(prefix)) {
      const cursor = el.selectionStart;
      el.value = prefix + el.value.replace(prefix, '');
      if (cursor < prefix.length) el.setSelectionRange(prefix.length, prefix.length);
    }

    // ambil bagian setelah prefix
    let afterPrefix = el.value.slice(prefix.length);
    // ambil hanya angka
    let numeric = afterPrefix.replace(/\D/g, '');
    // format pakai tanda '-'
    let formatted = formatNumber(numeric);
    // perbarui isi input
    el.value = prefix + formatted;
  });

  // Blok penghapusan prefix
  el.addEventListener('beforeinput', (ev) => {
    if (!ev.inputType) return;

    // Cegah hapus prefix
    if (ev.inputType.startsWith('delete')) {
      const s = el.selectionStart || 0;
      const e = el.selectionEnd || 0;
      if (s < prefix.length || (s === prefix.length && e === prefix.length)) {
        ev.preventDefault();
        return;
      }
    }

    // Blok input non-angka
    if (ev.inputType === 'insertText' && /\D/.test(ev.data)) {
      ev.preventDefault();
      return;
    }
  });

  // Cegah kursor pindah ke dalam prefix
  el.addEventListener('click', () => {
    if (el.selectionStart < prefix.length) {
      el.setSelectionRange(prefix.length, prefix.length);
    }
  });

  el.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowLeft' && el.selectionStart <= prefix.length) {
      ev.preventDefault();
      el.setSelectionRange(prefix.length, prefix.length);
    }
  });

  // Daftar semua negara (ISO + nama resmi)
const countries = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
  "Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain",
  "Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso",
  "Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic",
  "Chad","Chile","China","Colombia","Comoros","Congo (Brazzaville)",
  "Congo (Kinshasa)","Costa Rica","Croatia","Cuba","Cyprus","Czechia","Denmark",
  "Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador",
  "Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland",
  "France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica",
  "Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania",
  "Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia",
  "Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Panama",
  "Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore",
  "Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea",
  "South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland",
  "Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga",
  "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia",
  "Zimbabwe"
];

// Masukkan semua negara ke dropdown
const select = document.getElementById('countrySelect');
countries.forEach(country => {
  const option = document.createElement('option');
  option.value = country;
  option.textContent = country;
  select.appendChild(option);
});

// Set default ke Indonesia
select.value = "Indonesia";

document.getElementById('saveBtn').addEventListener('click', () => {
  const data = {
    username: document.getElementById('usernameInput').value,
    firstName: document.getElementById('firstNameInput').value,
    lastName: document.getElementById('lastNameInput').value,
    email: document.getElementById('emailInput').value,
    password: document.getElementById('passwordPreview').value,
    gender: document.getElementById('genderSelect').value,
    dob: document.getElementById('dobInput').value,
    phone: document.getElementById('phoneInput').value,
    country: document.getElementById('countrySelect').value
  };

  // Simpan sementara ke localStorage (simulasi database)
  localStorage.setItem('profileData', JSON.stringify(data));

  alert('✅ Changes saved successfully!');
});

// ========================
// 🔹 3. Load Saved Data
// ========================
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('profileData');
  if (saved) {
    const data = JSON.parse(saved);
    document.getElementById('usernameInput').value = data.username || '';
    document.getElementById('firstNameInput').value = data.firstName || '';
    document.getElementById('lastNameInput').value = data.lastName || '';
    document.getElementById('emailInput').value = data.email || '';
    document.getElementById('passwordPreview').value = data.password || '';
    document.getElementById('genderSelect').value = data.gender || 'Female';
    document.getElementById('dobInput').value = data.dob || '';
    document.getElementById('phoneInput').value = data.phone || '+62 ';
    document.getElementById('countrySelect').value = data.country || 'Indonesia';
  }
});

// ========================
// 🔹 4. Delete Account
// ========================
document.getElementById('deleteBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to delete your account data?')) {
    localStorage.removeItem('profileData');
    document.getElementById('profileForm').reset();
    countrySelect.value = 'Indonesia';
    alert('🗑️ Account data deleted.');
  }
});