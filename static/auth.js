// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzmz7H7OgKXQplbg1UNMuQ2B4QMwU_FT4",
  authDomain: "myproject-5216c.firebaseapp.com",
  projectId: "myproject-5216c",
  storageBucket: "myproject-5216c.appspot.com",
  messagingSenderId: "89584435724",
  appId: "1:89584435724:web:0a5d357fc2c76e554b6429",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Helper functions
const $ = (id) => document.getElementById(id);
const showNotification = (message) => {
  const notification = $("notification");
  notification.textContent = message;
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 3000);
};

const toggleForms = (showLogin) => {
  $("login-container").classList.toggle("hidden", !showLogin);
  $("login-container").classList.toggle("visible", showLogin);
  $("register-container").classList.toggle("hidden", showLogin);
  $("register-container").classList.toggle("visible", !showLogin);
};

const setSession = (userEmail) => {
  fetch("/set_session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: userEmail }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        setTimeout(() => {
          window.location.href = "/index";
        }, 2000);
      } else {
        showNotification("Failed to set session");
      }
    })
    .catch((error) => showNotification(`Error: ${error.message}`));
};

// Event listeners
$("show-register").addEventListener("click", () => toggleForms(false));
$("show-login").addEventListener("click", () => toggleForms(true));

$("register-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("register-email").value;
  const password = $("register-password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      showNotification("Registration successful!");
      setSession(userCredential.user.email);
    })
    .catch((error) => showNotification(`Error: ${error.message}`));
});

$("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("login-email").value;
  const password = $("login-password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      showNotification("Login successful!");
      setSession(userCredential.user.email);
    })
    .catch((error) => showNotification(`Error: ${error.message}`));
});

$("forgot-password").addEventListener("click", (e) => {
  e.preventDefault();
  const email = $("login-email").value;
  if (email) {
    sendPasswordResetEmail(auth, email)
      .then(() => showNotification("Password reset email sent!"))
      .catch((error) => showNotification(`Error: ${error.message}`));
  } else {
    showNotification("Please enter your email address");
  }
});

const handleGoogleAuth = (isLogin) => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      showNotification(
        `Google ${isLogin ? "login" : "registration"} successful!`
      );
      setSession(result.user.email);
    })
    .catch((error) => showNotification(`Error: ${error.message}`));
};

$("google-login").addEventListener("click", () => handleGoogleAuth(true));
$("google-register").addEventListener("click", () => handleGoogleAuth(false));

// Comment out or remove this block
// Check auth state on page load
// onAuthStateChanged(auth, (user) => {
//   if (user) {
//     setSession(user.email);
//   }
// });
