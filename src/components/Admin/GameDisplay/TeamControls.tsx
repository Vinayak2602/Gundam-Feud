import { getTeamDisplayName } from "@/src/lib/utils";
import { Game, WSEvent } from "@/src/types/game";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

const MAIN_GAME_TARGET_POINTS = 300;

interface TeamControlsProps {
  game: Game;
  setGame: Dispatch<SetStateAction<Game | null>>;
  team: number;
  send: (data: WSEvent) => void;
  setPointsGiven: Dispatch<SetStateAction<{ state: boolean; color: string; textColor: string }>>;
  pointsGiven: { state: boolean; color: string; textColor: string };
}

export default function TeamControls({ game, setGame, team, send, setPointsGiven, pointsGiven }: TeamControlsProps) {
  const { t } = useTranslation();
  const isStealTeam = game.steal_pending && game.steal_team === team;
  const isLockedOutDuringSteal = game.steal_pending && game.steal_team !== team;

  function awardRoundPoints(teamIndex: number) {
    game.teams[teamIndex].points = game.point_tracker[game.round] + game.teams[teamIndex].points;
    if (!game.is_final_round && game.teams[teamIndex].points >= MAIN_GAME_TARGET_POINTS) {
      game.winner_team = teamIndex;
    }
    game.steal_pending = false;
    game.steal_team = null;
    game.steal_from_team = null;
  }

  function TeamGetsPointsButton() {
    return (
      <button
        disabled={pointsGiven.state || isLockedOutDuringSteal}
        id={`team${team}GivePointsButton`}
        className={`rounded border-4 p-10 text-2xl ${
          isStealTeam ? "bg-warning-500 text-black" : `${pointsGiven.color} ${pointsGiven.textColor}`
        } ${isLockedOutDuringSteal ? "cursor-not-allowed opacity-50" : ""}`}
        onClick={() => {
          awardRoundPoints(team);
          setPointsGiven({
            state: true,
            color: "bg-secondary-500",
            textColor: "text-foreground",
          });
          // @ts-expect-error: need a better way to update these values
          setGame((prv) => ({ ...prv }));
          send({ action: "data", data: game });
        }}
      >
        {getTeamDisplayName(game.teams[team].name, team, t)}: {isStealTeam ? t("Steals Points") : t("Gets Points")}
      </button>
    );
  }

  function TeamMistakeButton() {
    return (
      <button
        id={`team${team}MistakeButton`}
        disabled={isLockedOutDuringSteal}
        className={`rounded border-4 bg-failure-500 p-10 text-2xl text-foreground ${
          isStealTeam ? "border-warning-200" : ""
        } ${isLockedOutDuringSteal ? "cursor-not-allowed opacity-50" : ""}`}
        onClick={() => {
          let mistakeCount = game.teams[team].mistakes;
          if (isStealTeam) {
            mistakeCount = 1;
            const defendingTeam = game.steal_from_team;
            if (defendingTeam != null) {
              awardRoundPoints(defendingTeam);
              setPointsGiven({
                state: true,
                color: "bg-secondary-500",
                textColor: "text-foreground",
              });
            }
          } else if (game.teams[team].mistakes < 3) {
            game.teams[team].mistakes++;
            mistakeCount = game.teams[team].mistakes;
            if (game.teams[team].mistakes >= 3) {
              game.steal_pending = true;
              game.steal_from_team = team;
              game.steal_team = team === 0 ? 1 : 0;
            }
          }
          // @ts-expect-error: need a better way to update these values
          setGame((prv) => ({ ...prv }));
          send({ action: "data", data: game });
          send({
            action: "mistake",
            data: mistakeCount,
          });
        }}
      >
        {getTeamDisplayName(game.teams[team].name, team, t)}: {isStealTeam ? t("Missed Steal") : t("mistake")}
      </button>
    );
  }

  return (
    <>
      <TeamGetsPointsButton />
      <TeamMistakeButton />
    </>
  );
}
