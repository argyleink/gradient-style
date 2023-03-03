export async function copyToClipboard(text) {
  try {
    return navigator.clipboard.writeText(text)
  } 
  catch (err) {
    return Promise.reject(err)
  }
}