export type PlayerServerKey =
  | 'server1'
  | 'server4'
  | 'server6'
  | 'server7'
  | 'server8'
  | 'server10'
  | 'server13'
  | 'server14'
  | 'server17'
  | 'server18'
  | 'server26'
  | 'server27'
  | 'server29'
  | 'server30'
  | 'server31'
  | 'server32'
  | 'server33'
  | 'server34'
  | 'server35'
  | 'server36'
  | 'server38'
  | 'server39'

export const playerServerOptions: { key: PlayerServerKey; label: string }[] = [
  { key: 'server7', label: '⭐ VidLink (JW) - Resumable' },
  { key: 'server8', label: '⭐ VidLink - Resumable' },
  { key: 'server27', label: '⭐ Vidlink.pro - Resumable' },
  { key: 'server6', label: '⭐ Vidking - Resumable' },
  { key: 'server1', label: '⭐Vidsrc.xyz - Resumable' },
  { key: 'server31', label: '⭐ GoDrivePlayer' },
  { key: 'server4', label: '2Embed.cc' },
  { key: 'server10', label: 'Multiembed' },
  { key: 'server13', label: 'AutoEmbed' },
  { key: 'server14', label: 'Player.Autoembed' },
  { key: 'server17', label: 'Vidsrc.icu' },
  { key: 'server18', label: 'MoviesAPI' },
  { key: 'server26', label: 'Smashystream' },
  { key: 'server29', label: '111Movies' },
  { key: 'server30', label: 'VidFast' },
  { key: 'server32', label: 'SuperEmbed' },
  { key: 'server33', label: 'Vidsrcme.ru' },
  { key: 'server34', label: 'Vidsrcme.su' },
  { key: 'server35', label: 'Vidsrc-me.ru' },
  { key: 'server36', label: 'Vidsrc-me.su' },
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
