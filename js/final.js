
import {showLoading, renderStats, calculateStats} from "./load_functions.js";

import {drawBarChart, drawEloChart, fetchRecentMonths, normaliseGame, CheckUser} from "./fetchGames.js";



async function loadUser(USERNAME) {
    //remove stats and graphs divs
    const statsContainer = document.getElementById("stats");
    const graphs = document.getElementById('graphs-container');

    statsContainer.style.display = "none";
    graphs.style.display = "none";
    document.getElementById('stats').innerHTML = '';



    const controlsContainer = document.getElementById("controls");
    const searchInput = document.getElementById("usernameInput");
    const input = searchInput.value.trim();
    //if (!input) {
    //    alert('Please enter a username!');
    //    return;
    //}

    USERNAME = input;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    console.log("Username set:", USERNAME)
    const message = document.getElementById("message");
    message.style.display = "none";

    // check user exists
    const noUserBox = document.getElementById("no-user-message")
    noUserBox.style.display = "none";
    const exists = await CheckUser(USERNAME, currentMonth, currentYear)
    if (exists.error) {
        noUserBox.style.display='block';
        return;
    }


    // Populate controls container
    controlsContainer.style.display = "inline-block";


    const yearSelect = document.getElementById("yearSelect");
    const monthSelect = document.getElementById("monthSelect");
    const loadButton = document.getElementById("loadButton");

    const optionList = document.querySelectorAll("option")
    if (optionList.length < 1) {
        for (let y = currentYear; y >= 2020; y--) {
            const opt = document.createElement("option");
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        }

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        months.forEach((m, i) => {
            const opt = document.createElement("option");
            opt.value = i + 1; // API uses 1–12
            opt.textContent = m;
            monthSelect.appendChild(opt);
        });
    }


    yearSelect.value = currentYear;
    monthSelect.value = currentMonth;

    const newLoadButton = loadButton.cloneNode(true);
    loadButton.parentNode.replaceChild(newLoadButton, loadButton);


    newLoadButton.addEventListener("click", async () => {
        const year = yearSelect.value;
        const month = monthSelect.value;

        console.log("fetching for", USERNAME);
        console.log(month)

        showLoading(true);
        try {
            const raw_plain = await fetchRecentMonths(USERNAME, month, year);
            console.log("Fetched raw data:", raw_plain.length);
            const raw = (raw_plain || []).filter(game => game.rated === true);
            console.log("Found rated games:", raw.length);
            const games = raw
                .map(g => normaliseGame(g, USERNAME))
                .sort((a, b) => a.end_time - b.end_time);
            console.log("Normalised games:", games.length);
            showLoading(false);

            if (!games || games.length === 0) {
                graphs.style.display = 'none';
                document.getElementById('stats').innerHTML = `<p>Sorry, no games found for this month. Please select a different month.</p>`;
                console.log("no games found for this month")
            } else {
                graphs.style.display = 'flex';
                const month_name = new Date(year, month - 1).toLocaleString('default', {month: 'long'});
                const stats = calculateStats(games);
                renderStats(stats, month_name, USERNAME);

                if (window.eloChartInstance) window.eloChartInstance.destroy();
                if (window.openingsChartInstance) window.openingsChartInstance.destroy();

                window.eloChartInstance = drawEloChart(games);
                window.openingsChartInstance = drawBarChart(games);
            }
        } catch (err) {
            console.error("Error in deploying:", err);
            showLoading(false);
            return [];
        }

    })

    newLoadButton.click();

}


document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOMContentLoaded fired ✅");

    let USERNAME = null;
    const searchButton = document.getElementById("search-button");
    const searchInput = document.getElementById("usernameInput");
    const message = document.getElementById("message");
    const statsContainer = document.getElementById("stats");
    const otherDivs = document.querySelectorAll(".hidden-on-load");

    otherDivs.forEach(div => div.style.display = "none");
    statsContainer.style.display = "none";
    message.style.display = "block";

    searchButton.addEventListener('click', async () => {
        searchButton.disabled = true;
        searchButton.style.display = "none";
        await loadUser(USERNAME)
    });

    searchInput.addEventListener('focus', async () => {
        searchButton.disabled = false;
        searchButton.style.display = "inline-block";
    })

})