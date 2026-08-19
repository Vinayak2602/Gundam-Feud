import FinalRoundButtonControls from "@/components/Admin/GameDisplay/FinalRoundButtonControls";
import FinalRoundPointTotals from "@/components/Admin/GameDisplay/FinalRoundPointTotals";
import TeamControls from "@/components/Admin/GameDisplay/TeamControls";
import TitleMusic from "@/components/Admin/GameDisplay/TitleMusic";
import HideGameQuestions from "@/components/Admin/HideGameQuestions";
import Players from "@/components/Admin/Players";
import BuzzerTable from "@/components/BuzzerTable";
import { Game, WSEvent } from "@/src/types/game";
import Image from "next/image";
import { Dispatch, RefObject, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

const REGULATION_ROUND_COUNT = 4;

interface GameDisplayProps {
  ws: RefObject<WebSocket>;
  setGame: Dispatch<SetStateAction<Game | null>>;
  game: Game;
  room: string;
  send: (data: WSEvent) => void;
  setPointsGiven: Dispatch<SetStateAction<{ state: boolean; color: string; textColor: string }>>;
  pointsGiven: { state: boolean; color: string; textColor: string };
  timerStarted: boolean;
  timerCompleted: boolean;
  setTimerStarted: (timerStarted: boolean) => void;
  setTimerCompleted: (timerCompleted: boolean) => void;
  titleMusicPlaying: boolean;
  setTitleMusicPlaying: (titleMusicPlaying: boolean) => void;
}

export default function GameDisplay({
  ws,
  setGame,
  game,
  room,
  send,
  setPointsGiven,
  pointsGiven,
  timerStarted,
  timerCompleted,
  setTimerStarted,
  setTimerCompleted,
  titleMusicPlaying,
  setTitleMusicPlaying,
}: GameDisplayProps) {
  const { t } = useTranslation();

  if (game.rounds == null) {
    {
      /* SHOW ERRORS TO ADMIN */
    }
    return <p className="py-20 text-center text-2xl text-secondary-900">[{t("Please load a game")}]</p>;
  }

  let current_screen;
  if (game.game_over && game.winner_team != null) {
    current_screen = t("Game Over");
  } else if (game.title) {
    current_screen = t("title");
  } else if (game.is_sudden_death) {
    current_screen = t("Sudden Death");
  } else if (!game.is_final_round) {
    current_screen = `${t("round")} ${t("number", {
      count: game.round + 1,
    })}`;
  } else if (!game.is_final_second) {
    current_screen = `${t("Final Round")} ${t("number", { count: 1 })}`;
  } else {
    current_screen = `${t("Final Round")} ${t("number", { count: 2 })}`;
  }

  // var put it into function scope
  const current_round = game.rounds[game.round];
  console.debug("Current round:", current_round);
  const winnerTeam = game.winner_team != null ? game.teams[game.winner_team] : null;
  const canStartSuddenDeath =
    !winnerTeam &&
    !game.is_sudden_death &&
    game.round >= REGULATION_ROUND_COUNT - 1 &&
    game.round < game.rounds.length - 1 &&
    pointsGiven.state;
  const stealingTeam = game.steal_team != null ? game.teams[game.steal_team] : null;
  const defendingTeam = game.steal_from_team != null ? game.teams[game.steal_from_team] : null;

  function clearStealState() {
    game.steal_pending = false;
    game.steal_team = null;
    game.steal_from_team = null;
  }

  return (
    <div>
      <div className="flex-col space-y-5 p-5">
        <hr />
        <div className="flex flex-row items-baseline justify-evenly">
          <TitleMusic
            send={send}
            room={room}
            game={game}
            setGame={setGame}
            isPlaying={titleMusicPlaying}
            setIsPlaying={setTitleMusicPlaying}
          />
          {/* CURRENT SCREEN TEXT */}
          <p id="currentScreenText" className="pt-5 text-center text-2xl text-foreground">
            {" "}
            {t("Current Screen")}: {current_screen}
          </p>
        </div>
        {(winnerTeam || canStartSuddenDeath || game.game_over) && (
          <div className="flex flex-wrap items-center justify-center gap-4 rounded border-4 border-warning-300 bg-secondary-300 p-5 text-foreground">
            {winnerTeam ? (
              <>
                <p className="text-3xl font-bold">
                  {t("Winner")}: {winnerTeam.name}
                </p>
                <button
                  id="winnerFastMoneyButton"
                  className="rounded border-4 bg-success-300 p-4 text-2xl text-foreground"
                  onClick={() => {
                    game.title = false;
                    game.game_over = false;
                    game.is_final_round = true;
                    game.is_final_second = false;
                    clearStealState();
                    // @ts-expect-error: need a better way to update these values
                    setGame((prv) => ({ ...prv }));
                    send({ action: "data", data: game });
                    send({ action: "set_timer", data: game.final_round_timers[0] });
                  }}
                >
                  {t("Play Fast Money")}
                </button>
                <button
                  id="endGameButton"
                  className="rounded border-4 bg-failure-200 p-4 text-2xl text-foreground"
                  onClick={() => {
                    game.game_over = true;
                    // @ts-expect-error: need a better way to update these values
                    setGame((prv) => ({ ...prv }));
                    send({ action: "end_game", data: game });
                  }}
                >
                  {t("End Game")}
                </button>
              </>
            ) : null}
            {canStartSuddenDeath ? (
              <button
                id="startSuddenDeathButton"
                className="rounded border-4 bg-warning-200 p-4 text-2xl text-foreground"
                onClick={() => {
                  const suddenDeathRoundIndex = game.round + 1;
                  const suddenDeathRound = game.rounds[suddenDeathRoundIndex];
                  game.title = false;
                  game.is_final_round = false;
                  game.is_sudden_death = true;
                  clearStealState();
                  game.round = suddenDeathRoundIndex;
                  game.teams[0].mistakes = 0;
                  game.teams[1].mistakes = 0;
                  game.rounds[suddenDeathRoundIndex] = {
                    ...suddenDeathRound,
                    multiply: 3,
                    answers: suddenDeathRound.answers.slice(0, 1).map((answer) => ({ ...answer, trig: false })),
                  };
                  game.point_tracker[suddenDeathRoundIndex] = 0;
                  setPointsGiven({
                    state: false,
                    color: "bg-success-500",
                    textColor: "text-foreground",
                  });
                  // @ts-expect-error: need a better way to update these values
                  setGame((prv) => ({ ...prv }));
                  send({ action: "data", data: game });
                }}
              >
                {t("Start Sudden Death")}
              </button>
            ) : null}
            {game.game_over && winnerTeam ? <p className="text-xl">{t("Room closes after 5 minutes")}</p> : null}
          </div>
        )}
        {game.steal_pending && stealingTeam && defendingTeam ? (
          <div className="rounded border-4 border-warning-500 bg-secondary-300 p-5 text-center text-foreground">
            <p id="stealPromptText" className="text-3xl font-bold">
              {stealingTeam.name} {t("can steal")} {t("number", { count: game.point_tracker[game.round] })}{" "}
              {t("points")}
            </p>
            <p className="pt-2 text-xl">
              {t("Use Steals Points for a correct answer, or Missed Steal to award the bank to")} {defendingTeam.name}.
            </p>
          </div>
        ) : null}

        <div className="flex grow flex-col gap-4 lg:flex-row lg:space-x-10">
          {/* TITLE SCREEN BUTTON */}
          <button
            id="titleCardButton"
            className="grow rounded border-4 bg-secondary-300 p-10 text-2xl text-foreground"
            onClick={() => {
              game.title = true;
              game.round = 0;
              game.is_sudden_death = false;
              game.winner_team = null;
              game.game_over = false;
              game.is_final_round = false;
              game.is_final_second = false;
              clearStealState();
              // @ts-expect-error: need a better way to update these values
              setGame((prv) => ({ ...prv }));
              send({ action: "data", data: game });
            }}
          >
            {t("Title Card")}
          </button>

          <HideGameQuestions game={game} setGame={setGame} send={send} />

          {/* FINAL ROUND BUTTON */}
          {game.final_round ? (
            <button
              id="finalRoundButton"
              className="grow rounded border-4 bg-secondary-300 p-10 text-2xl text-foreground"
              onClick={() => {
                game.title = false;
                game.is_sudden_death = false;
                game.game_over = false;
                game.is_final_round = true;
                game.is_final_second = false;
                clearStealState();
                // @ts-expect-error: need a better way to update these values
                setGame((prv) => ({ ...prv }));
                send({ action: "data", data: game });
                send({
                  action: "set_timer",
                  data: game.final_round_timers[0],
                });
              }}
            >
              {t("Final Round")}
            </button>
          ) : null}

          {/* ROUND SELECTOR */}
          <select
            className="grow rounded border-4 bg-secondary-300 p-10 text-2xl text-foreground"
            id="roundSelector"
            value={game.round}
            onChange={(e) => {
              game.round = parseInt(e.target.value);
              game.is_final_round = false;
              game.is_sudden_death = false;
              game.is_final_second = false;
              game.teams[0].mistakes = 0;
              game.teams[1].mistakes = 0;
              clearStealState();
              game.title = false;
              // @ts-expect-error: need a better way to update these values
              setGame((prv) => ({ ...prv }));
              setPointsGiven({
                state: false,
                color: "bg-success-500",
                textColor: "text-foreground",
              });
              send({ action: "data", data: game });
            }}
          >
            {game.rounds.map((key, index) => (
              <option value={index} key={`round-select-${index}`}>
                {t("round")} {t("number", { count: index + 1 })}
              </option>
            ))}
          </select>
        </div>
        {/* START ROUND 1 BUTTON */}
        <div className="flex flex-col gap-4 lg:flex-row lg:space-x-10">
          <button
            id="startRoundOneButton"
            className="grow rounded border-4 bg-secondary-300 p-10 text-2xl text-foreground"
            onClick={() => {
              game.title = false;
              game.is_final_round = false;
              game.is_sudden_death = false;
              game.is_final_second = false;
              game.round = 0;
              clearStealState();
              // @ts-expect-error: need a better way to update these values
              setGame((prv) => ({
                ...prv,
              }));
              setPointsGiven({
                state: false,
                color: "bg-success-500",
                textColor: "text-foreground",
              });
              send({ action: "data", data: game });
            }}
          >
            {t("Start Round 1")}
          </button>

          {/* NEXT ROUND BUTTON */}
          <button
            className="grow rounded border-4 bg-secondary-300 p-10 text-2xl text-foreground"
            id="nextRoundButton"
            onClick={() => {
              game.title = false;
              game.is_final_round = false;
              game.is_sudden_death = false;
              game.is_final_second = false;
              clearStealState();
              game.teams[0].mistakes = 0;
              game.teams[1].mistakes = 0;
              if (game.round < game.rounds.length - 1) {
                game.round = game.round + 1;
              }
              // @ts-expect-error: need a better way to update these values
              setGame((prv) => ({ ...prv }));
              setPointsGiven({
                state: false,
                color: "bg-success-500",
                textColor: "text-foreground",
              });
              console.debug(game.round);
              send({ action: "data", data: game });
            }}
          >
            {t("Next Round")}
          </button>
          <button
            id="showMistakeButton"
            className="flex grow flex-row items-center justify-center rounded border-4 bg-secondary-300 p-10 text-2xl text-foreground"
            onClick={() => {
              send({ action: "show_mistake" });
            }}
          >
            <Image width={150} height={150} style={{ objectFit: "contain" }} src="/x.svg" alt="Show Mistake" />
          </button>
          <button
            id="resetMistakesButton"
            className="grow rounded border-4 bg-secondary-300 p-10 text-2xl text-foreground"
            onClick={() => {
              for (const team in game.teams) {
                game.teams[team].mistakes = 0;
              }
              clearStealState();
              // @ts-expect-error: need a better way to update these values
              setGame((prv) => ({ ...prv }));
              send({ action: "data", data: game });
            }}
          >
            {t("Reset Mistakes")}
          </button>
        </div>

        {/* GETS POINTS MISTAKE */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TeamControls
            game={game}
            setGame={setGame}
            team={0}
            send={send}
            setPointsGiven={setPointsGiven}
            pointsGiven={pointsGiven}
          />
          <TeamControls
            game={game}
            setGame={setGame}
            send={send}
            team={1}
            setPointsGiven={setPointsGiven}
            pointsGiven={pointsGiven}
          />
        </div>
      </div>
      <hr />

      {/* IS NOT THE FINAL ROUND */}
      {!game.is_final_round ? (
        // GAME BOARD CONTROLS
        <div>
          <div className="flex flex-col space-y-2 px-10 pt-5">
            {/* QUESTION */}
            <p
              id="currentRoundQuestionText"
              className="text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl"
            >
              {current_round.question}
            </p>
            {/* POINT TRACKER */}
            <div className="flex flex-row items-center justify-between space-x-5 border-4 p-2">
              <div className="flex flex-row items-center space-x-5">
                <h3 id="pointsText" className="text-xl  text-foreground">
                  {t("Points")}:{" "}
                </h3>
                <h3 id="pointsNumberText" className="grow text-2xl  text-foreground">
                  {t("number", { count: game.point_tracker[game.round] })}
                </h3>
              </div>
              <div className="flex flex-row items-center space-x-2">
                <h3 id="multiplierText" className="text-xl text-foreground">
                  {t("multiplier")}:{" "}
                </h3>
                <h3 className="text-2xl text-foreground">x</h3>
                <input
                  type="number"
                  id="multiplierInput"
                  min="1"
                  className="w-24 border-2 bg-secondary-200 p-1 text-foreground placeholder:text-secondary-900"
                  value={current_round.multiply}
                  placeholder={t("multiplier")}
                  onChange={(e) => {
                    let value = parseInt(e.target.value);
                    if (value === 0) {
                      value = 1;
                    }
                    current_round.multiply = value;
                    // @ts-expect-error: need a better way to update these values
                    setGame((prv) => ({ ...prv }));
                    send({ action: "data", data: game });
                  }}
                />
              </div>
            </div>
          </div>

          {/* GAME BOARD BUTTONS */}
          <div className=" mx-10 mt-5 grid grid-flow-col grid-rows-4 gap-3  rounded border-4 p-3 text-white ">
            {current_round.answers.map((x, index) => (
              <div
                key={`answer-${index}`}
                className={`${
                  x.trig ? "bg-secondary-500" : "bg-primary-700"
                } rounded border-2 text-2xl font-extrabold uppercase`}
              >
                <button
                  className="flex min-h-full min-w-full flex-row items-center justify-center p-5"
                  id={`question${index}Button`}
                  onClick={() => {
                    x.trig = !x.trig;
                    // @ts-expect-error: need a better way to update these values
                    setGame((prv) => ({ ...prv }));

                    if (x.trig) {
                      game.point_tracker[game.round] = game.point_tracker[game.round] + x.pnt * current_round.multiply;
                      // @ts-expect-error: need a better way to update these values
                      setGame((prv) => ({ ...prv }));
                      send({ action: "reveal" });
                    } else {
                      game.point_tracker[game.round] = game.point_tracker[game.round] - x.pnt * current_round.multiply;
                      if (game.point_tracker[game.round] < 0) {
                        game.point_tracker[game.round] = 0;
                      }
                      // @ts-expect-error: need a better way to update these values
                      setGame((prv) => ({ ...prv }));
                    }
                    send({ action: "data", data: game });
                  }}
                >
                  <div className="grow">{x.ans}</div>
                  <div id={`answer${index}PointsText`} className="p-2">
                    {t("number", { count: x.pnt })}
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* BUZZERS AND PLAYERS */}
          <div className="grid grid-cols-2 gap-4 p-5">
            <h1 className="text-2xl capitalize text-foreground">{t("Buzzer Order")}</h1>
            <h1 className="text-2xl capitalize text-foreground">{t("players")}</h1>
            <div className="h-48 overflow-y-scroll rounded border-4 p-5 text-center">
              <div className="flex h-full  flex-col justify-between space-y-2">
                <div className="">
                  {game.buzzed.length > 0 ? (
                    <div className="flex flex-row items-center space-x-5">
                      {/* active clear buzzers button */}
                      <button
                        id="clearBuzzersButton"
                        className="rounded border-4 bg-failure-200 p-2 text-foreground hover:bg-failure-500"
                        onClick={() => {
                          send({ action: "clearbuzzers" });
                        }}
                      >
                        {t("Clear Buzzers")}
                      </button>
                      <p className="text-secondary-900">{t("Changing rounds also clears buzzers")}</p>
                    </div>
                  ) : (
                    <div className="flex flex-row items-center space-x-5">
                      {/* disabled clear buzzers button */}
                      <button
                        id="clearBuzzersButtonDisabled"
                        className="rounded border-4 bg-secondary-500 p-2 text-foreground"
                      >
                        {t("Clear Buzzers")}
                      </button>
                      <p className="text-secondary-900">{t("Changing rounds also clears buzzers")}</p>
                    </div>
                  )}
                </div>
                <hr />
                <div className="grow">
                  <BuzzerTable game={game} />
                </div>
              </div>
            </div>
            <Players game={game} setGame={setGame} ws={ws} room={room} />
          </div>
        </div>
      ) : (
        // FINAL ROUND
        <div>
          <Players game={game} setGame={setGame} ws={ws} room={room} />
          <div className="p-5">
            {/* FINAL ROUND TEXT */}
            <h2 id="finalRoundNumberText" className="py-5 text-center text-6xl text-foreground">
              {t("Final Round")} {t("number", { count: game.is_final_second ? 2 : 1 })}
            </h2>
            <hr />
            <div className="flex flex-row items-center justify-evenly space-x-5 py-5">
              {/* START FINAL ROUND 2 */}
              {!game.is_final_second ? (
                <button
                  id="startFinalRound2Button"
                  className={`rounded border-4 bg-secondary-300 p-5 text-3xl text-foreground ${timerStarted ? "opacity-50" : ""}`}
                  disabled={timerStarted}
                  onClick={() => {
                    console.debug(game);
                    game.is_final_second = true;
                    game.hide_first_round = true;
                    // @ts-expect-error: need a better way to update these values
                    setGame((prv) => ({ ...prv }));
                    send({ action: "data", data: game });
                    send({
                      action: "set_timer",
                      data: game.final_round_timers[1],
                    });
                    setTimerCompleted(false);
                  }}
                >
                  {t("start")} {t("Final Round")} {t("number", { count: 2 })}
                </button>
              ) : (
                <div className="flex flex-row items-center justify-evenly space-x-5 py-5 text-foreground">
                  {/* GO BACK TO FINAL ROUND 1 */}
                  <button
                    id="backToRound1FinalButton"
                    className={`rounded border-4 bg-secondary-300 p-5 text-3xl ${timerStarted ? "opacity-50" : ""}`}
                    disabled={timerStarted}
                    onClick={() => {
                      game.is_final_round = true;
                      game.hide_first_round = false;
                      game.is_final_second = false;
                      // @ts-expect-error: need a better way to update these values
                      setGame((prv) => ({ ...prv }));
                      send({ action: "data", data: game });
                      send({
                        action: "set_timer",
                        data: game.final_round_timers[0],
                      });
                    }}
                  >
                    {t("Back To")} {t("Final Round")} {t("number", { count: 1 })}
                  </button>
                  {game.is_final_second ? (
                    <div>
                      {/* REVEAL FIRST ROUND ANSWERS */}
                      {game.hide_first_round ? (
                        <button
                          id="revealFirstRoundFinalButton"
                          className="rounded border-4 bg-secondary-300 p-5 text-3xl text-foreground"
                          onClick={() => {
                            game.hide_first_round = false;
                            // @ts-expect-error: need a better way to update these values
                            setGame((prv) => ({ ...prv }));
                            send({ action: "data", data: game });
                          }}
                        >
                          {t("Reveal First Round Answers")}
                        </button>
                      ) : (
                        // HIDE FIRST ROUND ANSWERS
                        <button
                          id="hideFirstRoundAnswersButton"
                          className="rounded border-4 bg-secondary-300 p-5 text-3xl text-foreground"
                          onClick={() => {
                            game.hide_first_round = true;
                            // @ts-expect-error: need a better way to update these values
                            setGame((prv) => ({ ...prv }));
                            send({ action: "data", data: game });
                          }}
                        >
                          {t("Hide First Round Answers")}
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              <div className="flex px-2">
                {!timerStarted ? (
                  /* START TIMER */
                  <button
                    id="startTimerButton"
                    className={`rounded border-4 bg-secondary-300 p-5 text-3xl text-foreground ${timerCompleted ? "opacity-50" : ""}`}
                    disabled={timerCompleted}
                    onClick={() => {
                      if (game.is_final_second) {
                        send({
                          action: "start_timer",
                          data: game.final_round_timers[1],
                        });
                      } else {
                        send({
                          action: "start_timer",
                          data: game.final_round_timers[0],
                        });
                      }
                      setTimerStarted(true);
                      setTimerCompleted(false);
                    }}
                  >
                    {t("Start Timer")}
                  </button>
                ) : (
                  /* STOP TIMER */
                  <button
                    id="stopTimerButton"
                    className="rounded border-4 bg-secondary-300 p-5 text-3xl text-foreground"
                    onClick={() => {
                      send({ action: "stop_timer" });
                      setTimerStarted(false);
                    }}
                  >
                    {t("Stop Timer")}
                  </button>
                )}
                <button
                  className={`ml-2 rounded border-4 bg-secondary-300 p-5 text-3xl text-foreground ${!timerStarted ? "" : "opacity-50"}`}
                  disabled={timerStarted}
                  id="resetTimerButton"
                  onClick={() => {
                    if (!timerStarted) {
                      if (game.is_final_second) {
                        send({
                          action: "set_timer",
                          data: game.final_round_timers[1],
                        });
                      } else {
                        send({
                          action: "set_timer",
                          data: game.final_round_timers[0],
                        });
                      }
                    }
                    setTimerCompleted(false);
                  }}
                >
                  {t("Reset Timer")}
                </button>
              </div>
            </div>
            <FinalRoundPointTotals game={game} />
            {/* FINAL ROUND QUESTIONS AND ANSWERS */}
            <FinalRoundButtonControls game={game} setGame={setGame} send={send} />
          </div>
        </div>
      )}
    </div>
  );
}
