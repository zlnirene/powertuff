// scripts/signin.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signin-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      alert('Please fill out all fields!');
      return;
    }

    // Simulasi proses login (nanti bisa diganti dengan Firebase)
    console.log('Email:', email);
    console.log('Password:', password);

    // Contoh validasi sederhana
    if (email === "wonyoung@gmail.com" && password === "jangwony") {
      alert("Sign-in successful! Redirecting...");
      
      // Redirect 
      setTimeout(() => {
        window.location.href = "../pages/profile.html";
      }, 1000);
    } else {
      alert("Invalid email or password.");
    }
  });
});

// signup.js

document.addEventListener("DOMContentLoaded", function() {
  const signupForm = document.getElementById("signupForm");

  signupForm.addEventListener("submit", function(event) {
    event.preventDefault();

    // Ambil data dari input
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    // Simpan ke localStorage (simulasi pendaftaran)
    const userData = { name, email, password };
    localStorage.setItem("user", JSON.stringify(userData));

    // Notifikasi sukses
    alert("Account created successfully! Redirecting...");

    // Arahkan ke halaman utama (index.html)
    window.location.href = "../pages/profile.html";
  });
});
