function attachHeaderHandler() {
  chrome.webRequest.onBeforeSendHeaders.addListener((req) => {
    if (req.initiator.startsWith(`chrome-extension://${chrome.runtime.id}`)) {
      for (let header of req.requestHeaders) {
        if (header.name === 'User-Agent') {
          header.value = 'Mozilla/4.0(compatible;IE;GACv7. 2. 2. 16)'
          return {requestHeaders: req.requestHeaders}
        }
      }
    }
  }, {urls: ['https://*.ncrs.nhs.uk/*']}, ['blocking', 'requestHeaders'])
}

export default attachHeaderHandler
