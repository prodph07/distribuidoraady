
import { payment } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get("topic") || url.searchParams.get("type");
        const id = url.searchParams.get("id") || url.searchParams.get("data.id");

        if (topic === "payment" && id) {
            const paymentInfo = await payment.get({ id });

            if (paymentInfo) {
                // Update Order Status in Supabase
                // Assuming external_reference in payment preference was set to order_id
                const orderId = paymentInfo.external_reference;
                const status = paymentInfo.status === 'approved' ? 'preparing' : 'pending_payment';

                if (orderId) {
                    const { error } = await supabase
                        .from('orders')
                        .update({ status: status, payment_id: id })
                        .eq('id', orderId);

                    if (error) {
                        console.error("Error updating connection:", error);
                    }
                }
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
    }
}
