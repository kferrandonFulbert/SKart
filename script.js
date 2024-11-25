document.addEventListener("DOMContentLoaded", () => {
    const views = document.querySelectorAll(".view");
    const btnCreateSession = document.getElementById("btn-create-session");
    const btnCancel = document.getElementById("btn-cancel");
    const btnBackToSession = document.getElementById("btn-back-to-session");
    const sessionForm = document.getElementById("session-form");
    const tourForm = document.getElementById("tour-form");
    const sessionList = document.getElementById("session-list");

    let db;
    const dbName = "KartingSessions";

    // Initialiser IndexedDB
    function initDatabase() {
        const request = indexedDB.open(dbName, 1);

        request.onerror = (event) => {
            console.error("Erreur d'ouverture d'IndexedDB :", event);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            loadSessions();
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains("sessions")) {
                const sessionStore = db.createObjectStore("sessions", {
                    keyPath: "id",
                    autoIncrement: true,
                });
            }
            if (!db.objectStoreNames.contains("tours")) {
                const tourStore = db.createObjectStore("tours", {
                    keyPath: "id",
                    autoIncrement: true,
                });
                tourStore.createIndex("sessionId", "sessionId", { unique: false });
            }
        };
    }

    // Afficher une vue
    function showView(viewId) {
        views.forEach((view) => {
            view.classList.toggle("active", view.id === viewId);
        });
    }

    // Charger les sessions
    function loadSessions() {
        sessionList.innerHTML = "";
        const transaction = db.transaction(["sessions"], "readonly");
        const store = transaction.objectStore("sessions");

        store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const session = cursor.value;
                const li = document.createElement("li");
                li.textContent = `${session.nom} - ${session.date}`;
                li.dataset.id = session.id;
                sessionList.appendChild(li);
                cursor.continue();
            }
        };
    }

    // Ajouter une session
    function saveSession(session) {
        const transaction = db.transaction(["sessions"], "readwrite");
        const store = transaction.objectStore("sessions");
        store.add(session);

        transaction.oncomplete = () => {
            loadSessions();
        };

        transaction.onerror = (event) => {
            console.error("Erreur lors de l'ajout de session :", event);
        };
    }

    // Charger les tours
    function loadTours(sessionId) {
        const tourList = document.getElementById("tour-list");
        tourList.innerHTML = "";
        const transaction = db.transaction(["tours"], "readonly");
        const store = transaction.objectStore("tours");
        const index = store.index("sessionId");

        const request = index.getAll(sessionId);

        request.onsuccess = (event) => {
            const tours = event.target.result;
            tours.forEach((tour, index) => {
                const li = document.createElement("li");
                li.textContent = `Tour ${index + 1}: ${tour.temps} secondes`;
                tourList.appendChild(li);
            });
        };
    }

    // Ajouter un tour
    function addTour(sessionId, temps) {
        const transaction = db.transaction(["tours"], "readwrite");
        const store = transaction.objectStore("tours");
        const tour = { sessionId, temps };
        store.add(tour);

        transaction.oncomplete = () => {
            loadTours(sessionId);
        };

        transaction.onerror = (event) => {
            console.error("Erreur lors de l'ajout du tour :", event);
        };
    }

    // Navigation et événements
    btnCreateSession.addEventListener("click", () => showView("create-session"));
    btnCancel.addEventListener("click", () => showView("home"));

    sessionForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const sessionName = document.getElementById("session-name").value;
        const sessionDate = document.getElementById("session-date").value;

        if (sessionName && sessionDate) {
            saveSession({ nom: sessionName, date: sessionDate });
            sessionForm.reset();
            showView("home");
        } else {
            alert("Veuillez remplir tous les champs.");
        }
    });

    sessionList.addEventListener("click", (event) => {
        if (event.target.tagName === "LI") {
            const sessionId = event.target.dataset.id;
            document.getElementById("session-info").textContent = event.target.textContent;
            tourForm.dataset.sessionId = sessionId;
            loadTours(Number(sessionId));
            showView("manage-tours");
        }
    });

    tourForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const sessionId = Number(tourForm.dataset.sessionId);
        const tourTime = Number(document.getElementById("tour-time").value);

        if (tourTime > 0) {
            addTour(sessionId, tourTime);
            tourForm.reset();
        } else {
            alert("Veuillez entrer un temps valide.");
        }
    });

    // Calculer les statistiques pour une session
function calculateStats(tours) {
    if (tours.length === 0) {
        return {
            bestTime: "N/A",
            averageTime: "N/A",
            totalLaps: "0",
        };
    }

    const times = tours.map((tour) => tour.temps);
    const bestTime = Math.min(...times);
    const totalTime = times.reduce((acc, time) => acc + time, 0);
    const averageTime = (totalTime / tours.length).toFixed(2);

    return {
        bestTime: `${bestTime} secondes`,
        averageTime: `${averageTime} secondes`,
        totalLaps: `${tours.length}`,
    };
}

// Charger les tours associés à une session et afficher les statistiques
function loadTours(sessionId) {
    const tourList = document.getElementById("tour-list");
    tourList.innerHTML = "";

    const transaction = db.transaction(["tours"], "readonly");
    const store = transaction.objectStore("tours");
    const index = store.index("sessionId");

    const request = index.getAll(sessionId);

    request.onsuccess = (event) => {
        const tours = event.target.result;

        // Mettre à jour la liste des tours
        tours.forEach((tour, index) => {
            const li = document.createElement("li");
            li.textContent = `Tour ${index + 1}: ${tour.temps} secondes`;
            tourList.appendChild(li);
        });

        // Mettre à jour les statistiques
        updateStats(tours);
    };
}
// Afficher les statistiques
function updateStats(tours) {
    const stats = calculateStats(tours);

    document.getElementById("best-time").textContent = `Meilleur temps : ${stats.bestTime}`;
    document.getElementById("average-time").textContent = `Temps moyen : ${stats.averageTime}`;
    document.getElementById("total-laps").textContent = `Nombre de tours : ${stats.totalLaps}`;
}



    btnBackToSession.addEventListener("click", () => showView("home"));

    // Initialiser l'application
    initDatabase();


    // Enregistrement du service worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./sw.js")
        .then((registration) => {
          console.log("Service Worker enregistré avec succès:", registration);
        })
        .catch((error) => {
          console.error("Échec de l'enregistrement du Service Worker:", error);
        });
    });
  }

  let deferredPrompt;

window.addEventListener("beforeinstallprompt", (event) => {
  // Empêcher l'affichage automatique de la bannière d'installation
  event.preventDefault();
  deferredPrompt = event;
  console.log("L'application est prête pour l'installation");

  // Afficher un bouton d'installation
  const installButton = document.getElementById("install-button");
  if (installButton) {
    installButton.style.display = "block";
    installButton.addEventListener("click", () => {
      installButton.style.display = "none";
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("L'utilisateur a installé l'application.");
        } else {
          console.log("L'utilisateur a annulé l'installation.");
        }
        deferredPrompt = null;
      });
    });
  }
});

});
