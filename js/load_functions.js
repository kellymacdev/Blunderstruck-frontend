export function showLoading(isLoading) {
  const load = document.getElementById('loading');
  const stat = document.getElementById('stats');
  const graphs = document.getElementById('graphs-container');
  if (load) {
    load.style.display = isLoading ? 'flex' : 'none';
    graphs.style.display = isLoading ? 'none' : 'flex';
    stat.style.display = isLoading ? 'none' : 'flex';
  }
}

export function calculateStats(games) {
  const num_games = games.length;
  let wins = 0, draws = 0, losses = 0, timeouts = 0, abandoned=0;
  let opp_resigned = 0, opp_checkmated = 0, opp_timeout = 0, opp_abandoned=0;
  let resigned = 0, checkmated = 0;
  if (num_games === 0) return null;
  const firstRating = games[0].kris_rating;
  const lastRating = games[games.length - 1].kris_rating;
  const elo_change = lastRating - firstRating;
  games.forEach(game => {
    if (game.kris_result === "win") {
      wins++;
      if (game.opp_result === "resigned") opp_resigned++;
      if (game.opp_result === "checkmated") opp_checkmated++;
      if (game.opp_result === "timeout") opp_timeout++;
      if (game.opp_result === "abandoned") opp_abandoned++;
    } else if (game.kris_result === "repetition") {
      draws++;
    } else if (game.kris_result === "agreed") {
      draws++;
    } else if (game.kris_result === "stalemate") {
      draws++;
    } else if (game.kris_result === "insufficient") {
      draws++;
    }
    else {
        losses++;
        if (game.kris_result === "resigned") resigned++;
        if (game.kris_result === "checkmated") checkmated++;
        if (game.kris_result === "timeout") timeouts++;
        if (game.kris_result === "abandoned") abandoned++;
    }
  });
  const win_rate = ((wins / num_games) * 100).toFixed(2);
  return {
    num_games,
    wins,
    draws,
    losses,
    timeouts,
    abandoned,
    opp_resigned,
    opp_checkmated,
    opp_timeout,
    opp_abandoned,
    resigned,
    checkmated,
    win_rate,
    elo_change
  };
}

export function renderStats(stats, month_name, username) {
  if (!stats) return;

  const oppDetails = [
    stats.opp_resigned > 0 ? `${stats.opp_resigned} resignations` : null,
    stats.opp_checkmated > 0 ? `${stats.opp_checkmated} checkmates` : null,
    stats.opp_timeout > 0 ? `${stats.opp_timeout} timeouts` : null,
    stats.opp_abandoned > 0 ? `${stats.opp_abandoned} abandoned` : null
  ].filter(Boolean).join(', ');

  const lossDetails = [
    stats.resigned > 0 ? `${stats.resigned} resignations` : null,
    stats.checkmated > 0 ? `${stats.checkmated} checkmates` : null,
    stats.timeouts > 0 ? `${stats.timeouts} timeouts` : null,
    stats.abandoned > 0 ? `${stats.abandoned} abandoned` : null
  ].filter(Boolean).join(', ');

  const drawDetails = [
      stats.draws > 0 ? `, drew ${stats.draws} games`: null
  ].filter(Boolean).join(', ')


  document.getElementById("stats").innerHTML = `
    <p id="games-played">${username} played ${stats.num_games} games in ${month_name}.</p>
  <p id="wins-losses">They won ${stats.wins} games (${oppDetails}) ${drawDetails} and lost ${stats.losses} games (${lossDetails}).</p>
  <p id="win-rate">That's a win rate of ${stats.win_rate}%.</p>
  <p id="elo-change">Their ELO change over the month was: ${stats.elo_change}</p>`;
}