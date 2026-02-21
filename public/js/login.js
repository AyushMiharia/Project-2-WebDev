// js/login.js
import { api } from "./modules/api.js";

const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active"); tabSignup.classList.remove("active");
  loginForm.classList.add("active"); signupForm.classList.remove("active");
});
tabSignup.addEventListener("click", () => {
  tabSignup.classList.add("active"); tabLogin.classList.remove("active");
  signupForm.classList.add("active"); loginForm.classList.remove("active");
});

function showErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.style.display = "block";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("loginErr").style.display = "none";
  const btn = e.target.querySelector("button[type=submit]");
  btn.textContent = "Signing in..."; btn.disabled = true;
  try {
    await api.login({ email: loginForm.email.value, password: loginForm.password.value });
    window.location.href = "/workouts";
  } catch (err) {
    showErr("loginErr", err.message);
  } finally {
    btn.textContent = "Sign In"; btn.disabled = false;
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("signupErr").style.display = "none";
  const btn = e.target.querySelector("button[type=submit]");
  btn.textContent = "Creating..."; btn.disabled = true;
  try {
    await api.signup({ name: signupForm.name.value, email: signupForm.email.value, password: signupForm.password.value });
    window.location.href = "/workouts";
  } catch (err) {
    showErr("signupErr", err.message);
  } finally {
    btn.textContent = "Create Account"; btn.disabled = false;
  }
});
