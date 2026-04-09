## Websocket Server

The Websocket server is running on port `16890` <ins>without authentication</ins>. It is possible to bind it to the localhost interface, so that only services on the machine can access it (or outside ones via SSH tunnels).

All changes to the playback state and the volume trigger a status message to all connected clients. The current status message is also sent when the client connects.

### Controlling commands

Commands changing the state of the player don't return a message themselves. Expect an updated full status message following the command.

| command | description |
 --- | ---
| `command/togglePause` | Resume/Start/Stop playback
| `command/prevSong` | Previous song
| `command/nextSong` | Next song
| `command/toggleMute` | Toggle mute
| `command/incVolume` | Increase volume by 5%
| `command/decVolume` | Decrease volume by 5%


### Querying commands

`getState` | `getStatus` both return the status message to the querying client only.

### Status message

The status message is a JSON encoded string of the current state. It looks like this:

```
{
    "trackId": "<numeric-id>", // but is passed as string
    "trackTitle": "<name>",
    "trackTitleAbbrev": "<name>", // everything in parentheses is removed
    "trackArtists": "<artistname>",
    "albumCover": "<link-to-256x256-cover>",
    "albumTitle": "<albumname>",
    "playing": true,
    "trackLength": <length in seconds>,
    "startTimeISO": "2025-12-02T22:24:07.288Z", // timestamp of calculated starting of the track, per ISO8601, null if paused
    "startTimestamp": 1764714247.288, // timestamp of calculated starting of the track, as seconds since epoch (UNIX), null if paused
    "pauseTrackTime": null, // pausing time in track in seconds, null if playing
    "isMuted": false,
    "volume": 0.57 // normalized 0..1
}
```

### Heartbeat

`ping` is responded with `pong` by the server

### Logging

All connections and messages from the Websocket Server are logged in the default log.
