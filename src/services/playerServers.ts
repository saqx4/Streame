export type PlayerServerKey =
  | 'server1'
  | 'server2'
  | 'server3'
  | 'server4'
  | 'server5'
  | 'server6'
  | 'server7'
  | 'server8'
  | 'server9'
  | 'server10'
  | 'server11'
  | 'server12'
  | 'server13'
  | 'server14'
  | 'server15'
  | 'server16'
  | 'server17'
  | 'server18'
  | 'server26'
  | 'server27'
  | 'server28'
  | 'server29'
  | 'server30'
  | 'server31'
  | 'server32'
  | 'server33'
  | 'server34'
  | 'server35'
  | 'server36'
  | 'server37'
  | 'server38'
  | 'server39'

export const playerServerOptions: { key: PlayerServerKey; label: string }[] = [
  { key: 'server7', label: '⭐ VidLink (JW) - Resumable' },
  { key: 'server8', label: '⭐ VidLink - Resumable' },
  { key: 'server27', label: '⭐ Vidlink.pro - Resumable' },
  { key: 'server6', label: '⭐ Vidking - Resumable' },
  { key: 'server1', label: '⭐Vidsrc.xyz - Resumable' },
  { key: 'server31', label: '⭐ GoDrivePlayer' },
  { key: 'server2', label: 'Vidsrc.to' },
  { key: 'server3', label: 'Vidsrc-embed.ru' },
  { key: 'server4', label: '2Embed.cc' },
  { key: 'server5', label: 'Videasy' },
  { key: 'server9', label: 'Embed.su' },
  { key: 'server10', label: 'Multiembed' },
  { key: 'server11', label: 'Filmku' },
  { key: 'server12', label: 'Nontongo' },
  { key: 'server13', label: 'AutoEmbed' },
  { key: 'server14', label: 'Player.Autoembed' },
  { key: 'server15', label: '2Embed.cc (mirror)' },
  { key: 'server16', label: 'VidKing (embed)' },
  { key: 'server17', label: 'Vidsrc.icu' },
  { key: 'server18', label: 'MoviesAPI' },
  { key: 'server26', label: 'Smashystream' },
  { key: 'server28', label: 'Embedsoap' },
  { key: 'server29', label: '111Movies' },
  { key: 'server30', label: 'VidFast' },
  { key: 'server32', label: 'SuperEmbed' },
  { key: 'server33', label: 'Vidsrcme.ru' },
  { key: 'server34', label: 'Vidsrcme.su' },
  { key: 'server35', label: 'Vidsrc-me.ru' },
  { key: 'server36', label: 'Vidsrc-me.su' },
  { key: 'server37', label: 'Vidsrc-embed.ru (alt)' },
  { key: 'server38', label: 'Vidsrc-embed.su' },
  { key: 'server39', label: 'Vsrc.su' },
]

const playerServerKeySet = new Set<PlayerServerKey>(playerServerOptions.map((s) => s.key))

export const isPlayerServerKey = (value: string): value is PlayerServerKey => {
  return playerServerKeySet.has(value as PlayerServerKey)
}

export const getPlayerServerNumber = (key: PlayerServerKey): number => {
  return Number(key.replace('server', ''))
}

export const isResumableServerKey = (key: PlayerServerKey): boolean => {
  return key === 'server7' || key === 'server8' || key === 'server27'
}
