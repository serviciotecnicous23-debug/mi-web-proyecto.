set("log.stdout", true)

adoracion = playlist(mode="random", reload=60, "/radio/media/adoracion")
alabanza = playlist(mode="random", reload=60, "/radio/media/alabanza")
predicas = playlist(mode="random", reload=60, "/radio/media/predicas")
palabras = playlist(mode="random", reload=60, "/radio/media/palabras")
jingles = playlist(mode="random", reload=60, "/radio/media/jingles")

music = rotate(weights=[4, 3, 1, 1], [adoracion, alabanza, palabras, predicas])
station = rotate(weights=[1, 8], [jingles, music])
station = mksafe(station)
station = normalize(station)

output.icecast(
  %mp3(bitrate=128),
  host="icecast",
  port=8000,
  password="change-source-password",
  mount="/radio.mp3",
  name="Radio Avivando el Fuego",
  genre="Christian",
  description="Radio cristiana online del Ministerio Avivando el Fuego",
  station
)
