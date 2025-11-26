export const getAuthToken = () => {
  return localStorage.getItem("token")
}

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken")
}

export const getUser = () => {
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

export const isAdmin = () => {
  const user = getUser()
  return user?.role === "admin"
}

export const setAuthData = (token, refreshToken, user) => {
  localStorage.setItem("token", token)
  localStorage.setItem("refreshToken", refreshToken)
  localStorage.setItem("user", JSON.stringify(user))
}

export const clearAuthData = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("user")
}
