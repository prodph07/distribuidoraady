import MercadoPagoConfig, { Payment, Preference } from 'mercadopago';

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-00000000-0000-0000-0000-000000000000';

const client = new MercadoPagoConfig({ accessToken });

export const payment = new Payment(client);
export const preference = new Preference(client);
