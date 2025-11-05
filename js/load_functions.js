import { Chess } from "chess.js";


async function countBlunders(pgn, playerColor) {
  const sf = new Worker("./stockfish.js");
  const chess = new Chess();
  chess.loadPgn(pgn, { strict: false });

  let blunders = 0;
  const moves = chess.history({ verbose: true });

  let fenBefore = chess.fen()

  for (let i = 0; i < moves.length; i++) {
    // Determine whose move this is
    const moveNumber = i + 1;
    const isWhitesMove = moveNumber % 2 === 1;

    // Skip opponent’s moves
    if ((playerColor === "white" && !isWhitesMove) ||
        (playerColor === "black" && isWhitesMove)) {
      chess.move(moves[i]); // still update board
      fenBefore = chess.fen();
      continue;
    }

    const fenAfter = chess.fen();
    chess.move(moves[i]);

    const evalBefore = await evaluateFEN(sf, fenBefore);
    const evalAfter = await evaluateFEN(sf, fenAfter);

    // For White: drop means evalAfter < evalBefore
    // For Black: drop means evalAfter > evalBefore (evals are from White’s perspective)
    const delta = playerColor === "white"
      ? evalAfter - evalBefore
      : evalBefore - evalAfter;

    if (delta < -500) blunders++;
  }
  sf.terminate();
  return blunders;
}

async function evaluateFEN(sf, fen) {
  return new Promise((resolve) => {
    let bestEval = null;

    sf.onmessage = (event) => {
      const line = event.data;
      if (typeof line !== "string") return;

      // Centipawn evaluation
      const cpMatch = line.match(/score cp (-?\d+)/);
      if (cpMatch) {
        bestEval = parseInt(cpMatch[1]);
      }

      // Mate in N moves
      const mateMatch = line.match(/score mate (-?\d+)/);
      if (mateMatch) {
        // If it's a mate, treat it as a large eval
        bestEval = parseInt(mateMatch[1]) > 0 ? 10000 : -10000;
      }

      // Once engine reports bestmove, we resolve
      if (line.startsWith("bestmove")) {
        resolve(bestEval !== null ? bestEval : 0);
      }
    };

    sf.postMessage(`position fen ${fen}`);
    sf.postMessage("go depth 8");
  });
}

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

export async function calculateStats(games) {
  const num_games = games.length;
  let wins = 0, draws = 0, losses = 0, timeouts = 0, abandoned = 0, tot_blunders = 0;
  let opp_resigned = 0, opp_checkmated = 0, opp_timeout = 0, opp_abandoned = 0;
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
    } else if (game.kris_result === "timevsinsufficient") {
      draws++;
    } else if (game.opp_result === "win") {
      losses++;
      if (game.kris_result === "resigned") resigned++;
      if (game.kris_result === "checkmated") checkmated++;
      if (game.kris_result === "timeout") timeouts++;
      if (game.kris_result === "abandoned") abandoned++;
    }
  });
  for (const game of games) {
    const blunders = await countBlunders(game.pgn_results, game.kris_color);
    tot_blunders += blunders;
  }
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
    elo_change,
    tot_blunders
  };
}

export function renderStats(stats, month_name, username) {
  if (!stats) return;

  console.log("blunders:", stats.tot_blunders);
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