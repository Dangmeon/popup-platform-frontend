let loadingSdk

export function loadNaverMaps(clientId) {
  if (loadingSdk) return loadingSdk

  const request = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const callback = 'popqNaverMapsReady'
    const previousAuthFailure = window.navermap_authFailure
    const query = new URLSearchParams({
      ncpKeyId: clientId,
      submodules: 'geocoder',
      callback,
    })
    script.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?' + query
    script.async = true
    const timer = setTimeout(fail, 12000)

    function cleanUp() {
      clearTimeout(timer)
      delete window[callback]
      if (previousAuthFailure) window.navermap_authFailure = previousAuthFailure
      else delete window.navermap_authFailure
    }
    function fail() {
      cleanUp()
      script.remove()
      reject(new Error('네이버 지도를 불러오지 못했습니다.'))
    }

    script.onerror = fail
    window.navermap_authFailure = fail
    window[callback] = () => {
      const maps = window.naver?.maps
      if (!maps?.Map || !maps.Service?.geocode) return fail()
      cleanUp()
      resolve(maps)
    }
    document.head.append(script)
  })
  loadingSdk = request.catch(error => {
    loadingSdk = undefined
    throw error
  })
  return loadingSdk
}

export function streetAddress(location = '') {
  return location.trim().match(/^.+?(?:대로|로|길)\s+\d+(?:-\d+)?(?=\s|,|$)/)?.[0] || location.trim()
}

export function findAddress(maps, query) {
  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve(null), 8000)
    maps.Service.geocode({ query }, (status, response) => {
      clearTimeout(timeout)
      const address = status === maps.Service.Status.OK && response?.v2?.addresses?.[0]
      if (!address) return resolve(null)
      const latitude = Number(address.y)
      const longitude = Number(address.x)
      resolve(Number.isFinite(latitude) && Number.isFinite(longitude)
        ? new maps.LatLng(latitude, longitude) : null)
    })
  })
}
