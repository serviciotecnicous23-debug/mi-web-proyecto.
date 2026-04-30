(() => {
  const logo = `
    <svg viewBox="0 0 160 160" role="img" aria-label="Avivando el Fuego Radio">
      <defs>
        <linearGradient id="aef-emblem-bg" x1="18%" y1="8%" x2="82%" y2="100%">
          <stop offset="0%" stop-color="#3b170c" />
          <stop offset="45%" stop-color="#120807" />
          <stop offset="100%" stop-color="#050202" />
        </linearGradient>
        <linearGradient id="aef-emblem-steel" x1="15%" y1="0%" x2="88%" y2="100%">
          <stop offset="0%" stop-color="#fff7ed" />
          <stop offset="30%" stop-color="#f59e0b" />
          <stop offset="62%" stop-color="#dc2626" />
          <stop offset="100%" stop-color="#451a03" />
        </linearGradient>
        <linearGradient id="aef-emblem-flame" x1="40%" y1="8%" x2="66%" y2="100%">
          <stop offset="0%" stop-color="#fff7ad" />
          <stop offset="26%" stop-color="#fbbf24" />
          <stop offset="58%" stop-color="#f97316" />
          <stop offset="100%" stop-color="#dc2626" />
        </linearGradient>
        <linearGradient id="aef-emblem-core" x1="50%" y1="20%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#fffef3" />
          <stop offset="52%" stop-color="#fed7aa" />
          <stop offset="100%" stop-color="#fb923c" />
        </linearGradient>
        <linearGradient id="aef-emblem-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff7ed" />
          <stop offset="38%" stop-color="#fbbf24" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
        <filter id="aef-emblem-glow" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0.28 0 0 0.08  0.18 0.11 0 0 0.02  0 0 0 0 0  0 0 0 1.5 0" result="warm" />
          <feMerge><feMergeNode in="warm" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M80 11c21 12 43 12 58 22 0 47-17 87-58 115-41-28-58-68-58-115 15-10 37-10 58-22z" fill="url(#aef-emblem-bg)" stroke="url(#aef-emblem-steel)" stroke-width="3.6" stroke-linejoin="round" />
      <path d="M80 22c17 9 35 10 47 18-2 38-16 69-47 93-31-24-45-55-47-93 12-8 30-9 47-18z" fill="rgba(255,247,237,.035)" stroke="rgba(254,215,170,.16)" stroke-width="1.5" stroke-linejoin="round" />
      <g class="aef-svg-signal" opacity=".78">
        <path d="M50 45c17-15 43-15 60 0" fill="none" stroke="url(#aef-emblem-gold)" stroke-width="3.3" stroke-linecap="round" />
        <path d="M60 57c11-9 29-9 40 0" fill="none" stroke="#fed7aa" stroke-width="2.5" stroke-linecap="round" opacity=".64" />
        <path d="M80 29v17M71.5 37.5h17" stroke="#fff7ed" stroke-width="3" stroke-linecap="round" opacity=".78" />
      </g>
      <g class="aef-svg-wave-left" fill="none" stroke="url(#aef-emblem-gold)" stroke-linecap="round" opacity=".82">
        <path d="M50 72c-7 8-7 22 0 30" stroke-width="5" />
        <path d="M38 62c-13 17-13 50 0 67" stroke-width="4" opacity=".48" />
      </g>
      <g class="aef-svg-wave-right" fill="none" stroke="url(#aef-emblem-gold)" stroke-linecap="round" opacity=".82">
        <path d="M110 72c7 8 7 22 0 30" stroke-width="5" />
        <path d="M122 62c13 17 13 50 0 67" stroke-width="4" opacity=".48" />
      </g>
      <g class="aef-svg-flame" filter="url(#aef-emblem-glow)">
        <path d="M82 47c8 15 25 26 25 49 0 20-13 34-27 38-15-4-27-18-27-38 0-17 10-29 19-42 4-6 7-10 10-7z" fill="url(#aef-emblem-flame)" />
        <path d="M81 70c8 10 15 18 15 31 0 11-7 20-16 23-10-3-16-11-16-23 0-12 8-21 17-31z" fill="url(#aef-emblem-core)" opacity=".96" />
        <path d="M80 89v20" stroke="#6b1d09" stroke-width="5" stroke-linecap="round" opacity=".25" />
        <path d="M70 111h20" stroke="#fff7ed" stroke-width="4" stroke-linecap="round" opacity=".72" />
        <circle class="aef-svg-ember" cx="80" cy="112" r="6.5" fill="#fff7ed" opacity=".88" />
      </g>
      <path d="M58 130h44" stroke="#fed7aa" stroke-width="3" stroke-linecap="round" opacity=".36" />
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

  const formatDuration = (totalSeconds) => {
    const secondsNumber = Number(totalSeconds || 0);
    if (!Number.isFinite(secondsNumber) || secondsNumber <= 0) return "--:--";
    const minutes = Math.floor(secondsNumber / 60);
    const seconds = Math.floor(secondsNumber % 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const updateNowPlaying = async () => {
    try {
      const response = await fetch("/api/nowplaying/avivando_el_fuego", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const currentSong = textFromSong(data?.now_playing?.song) || "Avivando el Fuego Radio";
      const nextSong = textFromSong(data?.playing_next?.song) || "Programación continua";
      const playlist = data?.now_playing?.playlist || "AzuraCast AutoDJ";
      const elapsed = Math.max(0, Number(data?.now_playing?.elapsed || 0));
      const duration = Math.max(0, Number(data?.now_playing?.duration || 0));
      const progress = duration > 0 ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : 0;

      setText("[data-aef-song]", currentSong);
      setText("[data-aef-next]", nextSong);
      setText("[data-aef-playlist]", playlist);
      setText("[data-aef-time]", `${formatDuration(elapsed)} / ${formatDuration(duration)}`);
      const progressBar = document.querySelector("[data-aef-progress]");
      if (progressBar) progressBar.style.width = `${progress}%`;
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
              <div class="aef-meta-card aef-progress-card">
                <strong>En reproduccion</strong>
                <div class="aef-progress-track"><span data-aef-progress style="width:0%"></span></div>
                <span data-aef-time>--:-- / --:--</span>
              </div>
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
