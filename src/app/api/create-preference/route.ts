
import { preference } from "@/lib/mercadopago";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { items, payer } = await req.json();

        const response = await preference.create({
            body: {
                items: items.map((item: any) => ({
                    title: item.name,
                    unit_price: Number(item.price),
                    quantity: Number(item.quantity),
                    currency_id: 'BRL',
                })),
                payer: {
                    email: payer.email,
                },
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_URL}/status/success`,
                    failure: `${process.env.NEXT_PUBLIC_URL}/status/failure`,
                    pending: `${process.env.NEXT_PUBLIC_URL}/status/pending`,
                },
                auto_return: "approved",
                marketplace_fee: 2.00, // Example fixed fee or calculated percentage
                // application_fee is deprecated or marketplace_fee is used depending on integration type (Connect vs standard)
                // For Split Payment usually involves 'application_fee' in the payment intent or marketplace_fee logic.
                // Simplified here.
            },
        });

        return NextResponse.json({ id: response.id });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error creating preference" }, { status: 500 });
    }
}
