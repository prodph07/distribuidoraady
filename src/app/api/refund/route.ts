
import { payment } from "@/lib/mercadopago";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { payment_id } = await req.json();

        const response = await (payment as any).refund({
            payment_id: payment_id,
            body: {
                amount: undefined // Full refund if undefined
            }
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error refunding payment" }, { status: 500 });
    }
}
