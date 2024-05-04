const express = require("express");

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB error ${e.message}`);

    process.exit(1);
  }
};

initialize();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    districtName: dbObject.district_name,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const allStateList = `
  SELECT
  *
  FROM player_details;`;

  const stateList = await db.all(allStateList);

  const stateResult = stateList.map((eachObject) => {
    return convertPlayerDbObjectToResponseObject(eachObject);
  });
  response.send(stateResult);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getState = `
    SELECT
     *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`;
  const newState = await db.get(getState);
  const stateResult = convertPlayerDbObjectToResponseObject(newState);
  response.send(stateResult);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateDistrict = `
    UPDATE
    player_details
    SET
    player_name = '${playerName}'
    WHERE
    player_id = ${playerId};`;

  await db.run(updateDistrict);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getDistrict = `
    SELECT
    *
    FROM match_details
    WHERE match_id = ${matchId};`;

  const newDistrict = await db.get(getDistrict);
  const districtResult = convertMatchDetailsDbObjectToResponseObject(
    newDistrict
  );
  response.send(districtResult);
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerMatches = `
  SELECT *
  FROM player_match_score
    NATURAL JOIN match_details
  WHERE player_id = ${playerId};`;

  const playerMatches = await db.all(getPlayerMatches);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;

  const matchPlayerDetails = `
  SELECT *
  FROM player_match_score 
    NATURAL JOIN player_details
  WHERE match_id = ${matchId};`;

  const playerMatches = await db.all(matchPlayerDetails);
  response.send(
    playerMatches.map((eachMatch) =>
      convertPlayerDbObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;

  const getStateReport = `
  SELECT
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
  FROM player_match_score
    NATURAL JOIN player_details
   WHERE player_id = ${playerId};`;

  const stateReport = await db.get(getStateReport);
  response.send(stateReport);
});

module.exports = app;