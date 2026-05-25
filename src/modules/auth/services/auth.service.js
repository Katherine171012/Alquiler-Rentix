import api from '../../../core/http/axios'
import { createCaptchaChallenge } from '../../../core/security/auth-security.service.js'

export function loginRequest(payload) {
  return api.post('/auth/login', payload)
}

/** Captcha local (el MS Seguridad no expone /auth/captcha). */
export function getCaptchaRequest() {
  const challenge = createCaptchaChallenge()
  return Promise.resolve({
    success: true,
    message: 'Operación exitosa',
    data: {
      token: challenge.token,
      question: challenge.question,
    },
    errors: [],
  })
}
