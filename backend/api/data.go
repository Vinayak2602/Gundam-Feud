package api

import (
	"encoding/json"
	"fmt"
	"time"
)

func mergeGame(game *game, newData *game) {
	game.Round = newData.Round 
	game.Rounds = newData.Rounds
	game.FinalRound = newData.FinalRound
	game.FinalRound2 = newData.FinalRound2
	game.HideFirstRound = newData.HideFirstRound
	game.IsFinalRound = newData.IsFinalRound
	game.IsFinalSecond = newData.IsFinalSecond
	game.PointTracker = newData.PointTracker
	game.IsSuddenDeath = newData.IsSuddenDeath
	game.WinnerTeam = newData.WinnerTeam
	game.GameOver = newData.GameOver
	game.Settings = newData.Settings
	game.Teams = newData.Teams
	game.Title = newData.Title
	game.TitleText = newData.TitleText
	game.RegisteredPlayers = newData.RegisteredPlayers
}

func NewData(client *Client, event *Event) GameError {
	s := store
	room, storeError := s.getRoom(client, event.Room)
	if storeError.code != "" {
		return storeError
	}
	copyRound := room.Game.Round
	copyTitle := room.Game.Title
	newData := game{}
	rawData, err := json.Marshal(event.Data)
	if err != nil {
		return GameError{code: SERVER_ERROR, message: fmt.Sprint(err)}
	}
	err = json.Unmarshal(rawData, &newData)
	if err != nil {
		return GameError{code: SERVER_ERROR, message: fmt.Sprint(err)}
	}
	mergeGame(room.Game, &newData)
	setTick(client, event)

	if copyRound != newData.Round || copyTitle != newData.Title {
		room.Game.Buzzed = []buzzed{}
		room.Game.RoundStartTime = time.Now().UTC().UnixMilli()
		message, err := NewSendClearBuzzers()
		if err != nil {
			return GameError{code: SERVER_ERROR, message: fmt.Sprint(err)}
		}
		room.Hub.broadcast <- message
	}
	message, err := NewSendData(room.Game)
	if err != nil {
		return GameError{code: SERVER_ERROR, message: fmt.Sprint(err)}
	}
	room.Hub.broadcast <- message
	s.writeRoom(event.Room, room)
	return GameError{}
}

func EndGame(client *Client, event *Event) GameError {
	s := store
	room, storeError := s.getRoom(client, event.Room)
	if storeError.code != "" {
		return storeError
	}

	if event.Data != nil {
		newData := game{}
		rawData, err := json.Marshal(event.Data)
		if err != nil {
			return GameError{code: SERVER_ERROR, message: fmt.Sprint(err)}
		}
		err = json.Unmarshal(rawData, &newData)
		if err != nil {
			return GameError{code: SERVER_ERROR, message: fmt.Sprint(err)}
		}
		mergeGame(room.Game, &newData)
	}

	room.Game.GameOver = true
	message, err := NewSendData(room.Game)
	if err != nil {
		return GameError{code: SERVER_ERROR, message: fmt.Sprint(err)}
	}
	room.Hub.broadcast <- message
	s.writeRoom(event.Room, room)

	go func(roomCode string, hub *Hub) {
		time.Sleep(5 * time.Minute)
		latestRoom, storeError := store.getRoom(nil, roomCode)
		if storeError.code != "" || latestRoom.Game == nil || !latestRoom.Game.GameOver {
			return
		}
		message, err := NewSendQuit()
		if err == nil && hub.broadcast != nil {
			hub.broadcast <- message
		}
		if hub.stop != nil {
			hub.stop <- true
		}
		store.deleteRoom(roomCode)
	}(room.Game.Room, room.Hub)

	return GameError{}
}

func SendUnknown(client *Client, event *Event) GameError {
	s := store
	room, storeError := s.getRoom(client, event.Room)
	if storeError.code != "" {
		return storeError
	}
	message, err := json.Marshal(event)
	if err != nil {
		return GameError{code: SERVER_ERROR, message: fmt.Sprint(err)}
	}
	room.Hub.broadcast <- message
	return GameError{}
}
