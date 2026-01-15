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
  | 'server17'
  | 'server18'
  | 'server26'
  | 'server27'
  | 'server28'
  | 'server29'
  | 'server30'
  | 'server31'
  | 'server32'

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
  { key: 'server17', label: 'Vidsrc.icu' },
  { key: 'server18', label: 'MoviesAPI' },
  { key: 'server26', label: 'Smashystream' },
  { key: 'server28', label: 'Embedsoap' },
  { key: 'server29', label: '111Movies' },
  { key: 'server30', label: 'VidFast' },
  { key: 'server32', label: 'SuperEmbed' },
]

const playerServerKeySet = new Set<PlayerServerKey>(playerServerOptions.map((s) => s.key))

export const isPlayerServerKey = (value: string): value is PlayerServerKey => {
  return playerServerKeySet.has(value as PlayerServerKey)
}

export const getPlayerServerNumber = (key: PlayerServerKey): number => {
  return Number(key.replace('server', ''))
}
