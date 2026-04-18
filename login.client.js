const authForm = document.getElementById("authForm");
const authSubtitle = document.getElementById("authSubtitle");
const authEmailInput = document.getElementById("authEmail");
const authPasswordInput = document.getElementById("authPassword");
const authSubmitButton = document.getElementById("authSubmitButton");
const authToggleButton = document.getElementById("authToggleButton");
const authMessage = document.getElementById("authMessage");

let authMode = "login";

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
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: authEmailInput.value.trim(),
        password: authPasswordInput.value
      })
    });

    let payload = {};
    let rawBody = "";

    try {
      rawBody = await response.text();
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const detail = payload.detail || payload.error || rawBody || `HTTP ${response.status}`;
      authMessage.textContent = `${authMode === "login" ? "Giris yapilamadi." : "Kayit olusturulamadi."} (${detail})`;
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

void fetch("/api/auth/me", { cache: "no-store" })
  .then((response) => {
    if (response.ok) {
      window.location.replace("/");
    }
  })
  .catch(() => {});
