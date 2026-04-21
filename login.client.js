import { getSupabase } from "./supabase.client.js";

const authForm = document.getElementById("authForm");
const authSubtitle = document.getElementById("authSubtitle");
const authEmailInput = document.getElementById("authEmail");
const authPasswordInput = document.getElementById("authPassword");
const authSubmitButton = document.getElementById("authSubmitButton");
const authToggleButton = document.getElementById("authToggleButton");
const authMessage = document.getElementById("authMessage");

let authMode = "login";
const supabase = await getSupabase();

function renderAuthMode() {
  const isLogin = authMode === "login";
  document.title = isLogin ? "TrainLog Giris" : "TrainLog Kayit";
  document.querySelector(".auth-page-title").textContent = isLogin ? "Giris Yap" : "Kayit Ol";
  authSubtitle.textContent = isLogin
    ? "Mevcut verilerini hesabina baglamak icin giris yap veya kayit ol."
    : "Yeni hesabini olustur; mevcut veriler ilk hesabina kopyalanacak.";
  authSubmitButton.textContent = isLogin ? "Giris Yap" : "Kayit Ol";
  authToggleButton.textContent = isLogin ? "Hesabin yok mu? Kayit ol" : "Zaten hesabin var mi? Giris yap";
}

async function submitAuthForm(event) {
  event.preventDefault();
  authMessage.textContent = "";
  authSubmitButton.disabled = true;

  try {
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;
    const result = authMode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) {
      authMessage.textContent = `${authMode === "login" ? "Giris yapilamadi." : "Kayit olusturulamadi."} (${result.error.message})`;
      return;
    }

    if (authMode === "signup" && !result.data.session) {
      authMessage.textContent = "Kayit olusturuldu. Email dogrulama aciksa mailini kontrol et.";
      return;
    }

    authMessage.textContent = authMode === "login" ? "Giris yapildi." : "Kayit olusturuldu ve giris yapildi.";
    window.location.assign("/");
  } catch {
    authMessage.textContent = "Sunucuya baglanirken hata oldu.";
  } finally {
    authSubmitButton.disabled = false;
  }
}

authForm.addEventListener("submit", submitAuthForm);
authToggleButton.addEventListener("click", () => {
  authMode = authMode === "login" ? "signup" : "login";
  renderAuthMode();
});

renderAuthMode();

void supabase.auth.getSession()
  .then(({ data }) => {
    if (data.session) {
      window.location.replace("/");
    }
  })
  .catch(() => {});
