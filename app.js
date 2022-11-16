//-------SQL --Initializing----------------------------
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//------Object of Player Details-------------------------
const convertPlayerDBObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//------Object of Match Details-------------------------
const convertMatchDBObj = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//-------Object of Player Match Score------------------
const convertScoreDBObj = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//---Get ---list of all the players in the player table---
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details;
    `;

  const playerArray = await db.all(getPlayerQuery);
  response.send(
    playerArray.map((eachPlayer) => convertPlayerDBObj(eachPlayer))
  );
});

//---Get ---specific player based on the player ID-------
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};
    `;

  const playerArr = await db.get(getPlayerQuery);
  response.send(convertPlayerDBObj(playerArr));
});

//---Put ---Updates the details of a specific player_id----
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const { playerName } = request.body;

  const updatePlayer = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};
    `;

  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//---Get ---match details of a specific match_id---------
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const matchQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};
    `;

  const match = await db.get(matchQuery);
  response.send(convertMatchDBObj(match));
});

//---Get ---list of all the matches of a player_id--------
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;

  const matchList = `
    SELECT * FROM player_match_score
    NATURAL JOIN match_details
    WHERE player_id = ${playerId};
    `;

  const playerMatch = await db.all(matchList);
  response.send(playerMatch.map((eachMatch) => convertMatchDBObj(eachMatch)));
});

//---Get ---list of players of a specific match_id--------
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const matchPlayerQuery = `
    SELECT * FROM player_match_score
    NATURAL JOIN player_details
    WHERE match_id = ${matchId};
    `;

  const matchArray = await db.all(matchPlayerQuery);
  response.send(matchArray.map((eachPlayer) => convertPlayerDBObj(eachPlayer)));
});

//---Get ---statistics of the total score, fours, sixes ---
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerTotal = `
  SELECT
  player_id AS playerId,
  player_name AS playerName,
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  FROM player_match_score
  NATURAL JOIN player_details
  WHERE player_id = ${playerId};
  `;

  const playerMatchArray = await db.get(getPlayerTotal);

  response.send(playerMatchArray);
});

module.exports = app;
