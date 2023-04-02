
export type Settings = {
  isConversation: boolean
  systemMessage: string
}

const defaultSettings: Settings = { isConversation: false, systemMessage: "" }

export function getLocalSettings(): Settings {
  const settingsStr = localStorage.getItem("settings")
  return settingsStr ? JSON.parse(settingsStr) : defaultSettings
}

export function setLocalSettings(settings: Settings) {
  localStorage.setItem("settings", JSON.stringify(settings))
}
