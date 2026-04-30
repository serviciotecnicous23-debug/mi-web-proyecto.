(() => {
  const logo = `
    <svg viewBox="0 0 160 160" role="img" aria-label="Avivando el Fuego Radio">
      <defs>
        <linearGradient id="aef-flame" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#fde68a" />
          <stop offset="0.46" stop-color="#fb923c" />
          <stop offset="1" stop-color="#dc2626" />
        </linearGradient>
        <radialGradient id="aef-core" cx="50%" cy="62%" r="42%">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="0.45" stop-color="#fed7aa" />
          <stop offset="1" stop-color="#fb923c" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="72" fill="#180b06" stroke="rgba(251,146,60,.36)" stroke-width="4" />
      <path d="M83 17c18 29 44 53 44 88 0 28-20 48-47 48s-47-20-47-48c0-25 15-45 30-64 8-10 15-18 20-24z" fill="url(#aef-flame)" />
      <path d="M82 66c13 16 23 28 23 47 0 15-10 26-25 26s-25-11-25-26c0-17 11-30 27-47z" fill="url(#aef-core)" opacity=".95" />
      <circle cx="80" cy="116" r="9" fill="#fff7ed" opacity=".9" />
    </svg>`;

  const waitFor = (selector, callback, attempts = 100) => {
    const found = document.querySelector(selector);
    if (found) {
      callback(found);
      return;
    }
    if (attempts <= 0) return;
    window.setTimeout(() => waitFor(selector, callback, attempts - 1), 120);
  };

  const textFromSong = (song) => {
    if (!song) return "";
    return song.text || [song.artist, song.title].filter(Boolean).join(" - ") || song.title || "";
  };

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value) element.textContent = value;
  };

  const formatClock = () => {
    try {
      return new Intl.DateTimeFormat("es-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Chicago",
      }).format(new Date());
    } catch (_) {
      return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  };

  const updateClock = () => setText("[data-aef-clock]", formatClock());

  const updateNowPlaying = async () => {
    try {
      const response = await fetch("/api/nowplaying/avivando_el_fuego", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const currentSong = textFromSong(data?.now_playing?.song) || "Avivando el Fuego Radio";
      const nextSong = textFromSong(data?.playing_next?.song) || "Programación continua";
      const playlist = data?.now_playing?.playlist || "AzuraCast AutoDJ";
      const listeners = Number(data?.listeners?.current || 0);

      setText("[data-aef-song]", currentSong);
      setText("[data-aef-next]", nextSong);
      setText("[data-aef-playlist]", playlist);
      setText("[data-aef-listeners]", String(listeners));
      setText("[data-aef-status]", data?.is_online ? "Transmitiendo en vivo" : "Conectando señal");
    } catch (_) {}
  };

  const shareRadio = async () => {
    const url = "https://40.160.2.176.sslip.io/public/avivando_el_fuego";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Avivando el Fuego Radio", text: "Escucha la radio cristiana online 24/7.", url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert("Enlace de la radio copiado.");
      }
    } catch (_) {}
  };

  const buildBars = () =>
    Array.from({ length: 28 })
      .map((_, index) => {
        const height = 24 + ((index * 19) % 70);
        return `<span class="aef-bar" style="height:${height}%;animation-delay:${index * 46}ms"></span>`;
      })
      .join("");

  let mediaSessionConfigured = false;

  const configureMediaSession = () => {
    if (!("mediaSession" in navigator) || mediaSessionConfigured) return;
    mediaSessionConfigured = true;
    const artwork = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(logo.replace(/\s+/g, " ").trim());

    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Avivando el Fuego Radio",
      artist: "Ministerio Avivando el Fuego",
      album: "Radio cristiana online 24/7",
      artwork: [{ src: artwork, sizes: "160x160", type: "image/svg+xml" }],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      const currentAudio = document.querySelector("audio");
      if (currentAudio) currentAudio.play().catch(() => {});
      else document.querySelector(".radio-control-play-button")?.click();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      const currentAudio = document.querySelector("audio");
      if (currentAudio) currentAudio.pause();
      else document.querySelector(".radio-control-play-button")?.click();
    });
  };

  const setupMediaSession = (audio) => {
    configureMediaSession();
    if (!audio || audio.dataset.aefMediaSession === "ready") return;
    audio.dataset.aefMediaSession = "ready";
    audio.setAttribute("playsinline", "");
    audio.preload = "none";

    if (!("mediaSession" in navigator)) return;
    const syncState = () => {
      navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
    };
    audio.addEventListener("play", syncState);
    audio.addEventListener("playing", syncState);
    audio.addEventListener("pause", syncState);
    audio.addEventListener("ended", syncState);
    syncState();
  };

  const watchForAudio = () => {
    const trySetup = () => setupMediaSession(document.querySelector("audio"));
    trySetup();
    const observer = new MutationObserver(trySetup);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("click", () => window.setTimeout(trySetup, 450), true);
  };

  ready(() => {
    document.documentElement.setAttribute("data-bs-theme", "dark");
    updateClock();
    window.setInterval(updateClock, 1000);

    waitFor(".public-page .card", (card) => {
      if (document.querySelector(".aef-public-shell")) return;

      const publicPage = card.closest(".public-page") || card.parentElement;
      const shell = document.createElement("section");
      shell.className = "aef-public-shell";
      shell.innerHTML = `
        <div class="aef-scene-grid">
          <div class="aef-copy-panel">
            <div class="aef-brand-row">
              <div class="aef-logo-mark">${logo}</div>
              <div>
                <p class="aef-kicker">Radio cristiana online 24/7</p>
                <h1 class="aef-title">Avivando el Fuego Radio</h1>
              </div>
            </div>
            <p class="aef-subtitle">Adoración, alabanza, prédicas y palabra viva desde el servidor propio del ministerio.</p>
            <div class="aef-actions">
              <a class="aef-action aef-action-primary" href="https://ministerioavivandoelfuego.com/radio" target="_blank" rel="noopener">Abrir app web</a>
              <a class="aef-action" href="https://ministerioavivandoelfuego.com" target="_blank" rel="noopener">Ministerio</a>
              <button class="aef-action" type="button" data-aef-share>Compartir emisora</button>
            </div>
          </div>
          <div class="aef-live-panel">
            <div class="aef-status-line">
              <span class="aef-live-dot" data-aef-status>Transmitiendo en vivo</span>
              <span data-aef-clock>${formatClock()}</span>
            </div>
            <div class="aef-orbit" aria-hidden="true"><div class="aef-orbit-logo">${logo}</div></div>
            <p class="aef-live-playlist" data-aef-playlist>AzuraCast AutoDJ</p>
            <h2 class="aef-live-song" data-aef-song>Avivando el Fuego Radio</h2>
            <div class="aef-bars" aria-hidden="true">${buildBars()}</div>
            <div class="aef-meta-grid">
              <div class="aef-meta-card"><strong>Siguiente</strong><span data-aef-next>Programación continua</span></div>
              <div class="aef-meta-card"><strong>Oyentes</strong><span data-aef-listeners>0</span></div>
            </div>
            <div class="aef-player-dock" aria-label="Reproductor principal"></div>
          </div>
        </div>`;

      const guide = document.createElement("section");
      guide.className = "aef-guide-panel";
      guide.setAttribute("aria-label", "Cómo instalar y escuchar la radio");
      guide.innerHTML = `
        <div class="aef-guide-heading">
          <strong>Usa esta radio como aplicación</strong>
          <span>Primero toca el reproductor. Después puedes instalarla o dejarla sonando con la pantalla bloqueada.</span>
        </div>
        <div class="aef-listen-guide" aria-label="Cómo instalar y escuchar la radio">
          <article class="aef-guide-card">
            <strong>Android</strong>
            <span>Abre <b>Abrir app web</b>, toca <b>Instalar app gratis</b> o usa Menú ⋮ y <b>Agregar a pantalla principal</b>.</span>
          </article>
          <article class="aef-guide-card">
            <strong>iPhone o iPad</strong>
            <span>Abre el enlace en Safari, pulsa <b>Compartir</b> y elige <b>Añadir a pantalla de inicio</b>.</span>
          </article>
          <article class="aef-guide-card">
            <strong>Segundo plano</strong>
            <span>Presiona play primero. Luego bloquea la pantalla o sal; usa los controles del teléfono para pausar o continuar.</span>
          </article>
        </div>`;

      publicPage.insertBefore(shell, card);
      shell.querySelector(".aef-player-dock")?.appendChild(card);
      publicPage.insertBefore(guide, shell.nextSibling);
      shell.querySelector("[data-aef-share]")?.addEventListener("click", shareRadio);
      updateNowPlaying();
    });

    waitFor(".radio-control-play-button", (button) => {
      button.setAttribute("aria-label", "Escuchar Avivando el Fuego Radio en vivo");
      if (!button.parentElement?.querySelector(".aef-player-cta-label")) {
        const label = document.createElement("span");
        label.className = "aef-player-cta-label";
        label.textContent = "Toca para escuchar en vivo";
        button.insertAdjacentElement("afterend", label);
      }
    });

    updateNowPlaying();
    window.setInterval(updateNowPlaying, 15000);
    watchForAudio();
  });
})();
