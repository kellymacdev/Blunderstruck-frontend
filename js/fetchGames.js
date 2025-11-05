export async function CheckUser(username, month, year) {
  try {
        const res = await fetch(`https://blunderstruck.onrender.com/api/month/?username=${username}&month=${month}&year=${year}`);
        console.log("Fetch status:", res.status);

        if (res.status === 404) {
          return {error: "user doesn't exist"}
        }

        if (res.status === 200) {
          return {message: "found user"}
        }
    } catch (err) {
        console.error("Error in fetchRecentMonths:", err);
        return [];
    }
}


// function to pull data through Django api proxy for specific month
export async function fetchRecentMonths(username, month, year) {
  try {
        const res = await fetch(`https://blunderstruck.onrender.com/api/month/?username=${username}&month=${month}&year=${year}`);
        console.log("Fetch status:", res.status);


        // If the response isn’t OK, bail with empty array
        if (!res.ok) {
          console.warn("Non-OK response from server");
          return [];
        }

        const json = await res.json();

        if (!json || !Array.isArray(json.games)) {
          console.warn("No valid games array found in response:", json);
          return [];
        }

        // If nested arrays, flatten
        const allGames = json.games.flatMap(g => Array.isArray(g) ? g : [g]);
        console.log("Flattened games:", allGames.length);
        return allGames;
    } catch (err) {
        console.error("Error in fetchRecentMonths:", err);
        return [];
    }
}

// normalise game data format
export function normaliseGame(raw, username) {
  const isKrisWhite = raw.white.username.toLowerCase() === username;
  const krisSide = isKrisWhite ? raw.white : raw.black;
  const oppSide = isKrisWhite ? raw.black : raw.white;
  const date = new Date(raw.end_time * 1000); // epoch to JS Date
  let openingName = '';
  if (raw.eco) {
    const openingUrl = raw.eco;
    const openingSlug = isKrisWhite ? openingUrl.split('/').pop() : '';
    const name_temp = openingSlug.replace(/-/g, ' ').replace(/\d+\./g, '').trim();
    const words = name_temp.split(' ');
    if (words.length > 4 ) {
      openingName = words.slice(0, 4).join(' ') + '...';
    } else {
      openingName = name_temp;
    }
  }
  return {
    chesscom_id: raw.url?.split('/').pop() || null,
    date,
    dateStr: date.toISOString().slice(0,10), // 'YYYY-MM-DD'
    end_time: raw.end_time,
    time_control: raw.time_control,
    kris_color: isKrisWhite ? "white": "black",
    kris_rating: krisSide.rating,
    opp_rating: oppSide.rating,
    kris_result: krisSide.result,
    opp_result: oppSide.result,
    opening: openingName,
    pgn_results: raw.pgn || null,
  };
}

// ratings throughout month taking only last rating on each day or previous days ratings if no games
export function dailyRatingSeries(games) {
  const dayMap = {};
  for (const g of games) {
    dayMap[g.dateStr] = g.kris_rating;
  }

  const days = [];
  const ratings = [];

  const startDate = new Date(games[0].dateStr);
  const endDate = new Date(games[games.length - 1].dateStr);
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const ds = d.toISOString().slice(0,10);
    const rating = (ds in dayMap) ? dayMap[ds] : null;
    days.push(ds);
    ratings.push(rating);
  }

  // carry-forward nulls
  let prev = null;
  const carried = ratings.map(r => {
    if (r !== null && r !== undefined) { prev = r; return r; }
    return prev;
  });

  return { days, ratings: carried };
}

export function drawEloChart(games) {
  const {days, ratings} = dailyRatingSeries(games);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const ctx = document.getElementById("ratingChart");
  const data = {
    labels: days,
    datasets: [
      {
        label: "Rating Over Time",
        data: ratings,
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 3,
      },
    ],
  };
  const options = {
    scales: {
        x: {
          title: {
            display: true,
            text: (() => {
              if (days.length > 0) {
                const firstDate = new Date(days[0]);
                return `${monthNames[firstDate.getMonth()]} ${firstDate.getFullYear()}`;
              }
              return "";
            })(),
            font: {size: 14}
          },
          ticks: {
            callback: function (value, index) {
              const d = new Date(days[index]);
              return d.getDate();  // just the day number for ticks
            }
          }
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: "ELO",
            font: {
              size: 20
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false,
          position: "bottom",
        },
      },

  }
  return new Chart(ctx, {type: "line", data: data, options: options})
}

function getOpeningCounts(games) {
  const counts = {};
  games.forEach(g => {
    if (g.opening) {
      counts[g.opening] = (counts[g.opening] || 0) + 1;
    }
  });
  // remove openings played < 2 times
  let count_lim = 0;
  if (games.length > 100) {
    count_lim = 5;
  } else {
    count_lim = 2;
  }
  for (const key in counts) {
    if (counts[key] < count_lim) delete counts[key];
  }
  return counts;
}


export function drawBarChart(games) {
  const counts = getOpeningCounts(games);
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const ctx = document.getElementById("openingsChart").getContext("2d");
  const chart_data = {
    labels: labels,
      datasets: [{
        label: "Times Played",
        data: data,
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1
      }]
  };
  const options = {
    indexAxis: 'y',  // makes it a horizontal bar chart
      scales: {
        x: {
          title: {
            display: true,
            text: "Number of Games"
          },
          beginAtZero: true
        },
        y: {
          title: {
            display: true,
            text: "Opening"
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
  }
  return new Chart(ctx, {type: "bar", data: chart_data, options: options});
}

// calculate ELO change over months
export function monthlyEloChange(games) {
  const byMonth = {};
  for (const g of games) {
    const monthKey = `${g.date.getFullYear()}-${String(g.date.getMonth()+1).padStart(2,'0')}`;
    if (!byMonth[monthKey]) byMonth[monthKey] = { first:null, last:null };
    if (byMonth[monthKey].first === null) byMonth[monthKey].first = g.kris_rating;
    byMonth[monthKey].last = g.kris_rating;
  }
  const labels = Object.keys(byMonth).sort();
  const changes = labels.map(k => byMonth[k].last - byMonth[k].first);
  return { labels, changes };
}





