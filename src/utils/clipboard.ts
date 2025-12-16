export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } 
  catch (err) {
    return Promise.reject(err)
  }
}