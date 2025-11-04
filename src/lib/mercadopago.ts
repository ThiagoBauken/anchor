import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
})

export const mercadoPagoPayment = new Payment(client)
export const mercadoPagoPreference = new Preference(client)